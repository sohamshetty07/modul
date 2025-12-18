"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js";
import { useConversion } from "@/hooks/use-conversion";

export function useAudioCutter() {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const regions = useRef<RegionsPlugin | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(10); // Default Zoom
  const [trimRegion, setTrimRegion] = useState<{start: number, end: number}>({ start: 0, end: 0 });
  
  // FIX: Destructure 'outputFileName' so we can pass it to the UI
  const { convertFile, status, progress, downloadUrl, setDownloadUrl, outputFileName } = useConversion();

  const loadAudio = useCallback((file: File) => {
    if (!containerRef.current) return;

    if (wavesurfer.current) wavesurfer.current.destroy();

    wavesurfer.current = WaveSurfer.create({
      container: containerRef.current,
      waveColor: 'rgb(71, 85, 105)', // slate-600
      progressColor: 'rgb(236, 72, 153)', // pink-500
      cursorColor: 'rgb(255, 255, 255)',
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 160,
      minPxPerSec: 10, // Initial Zoom
      normalize: true, // Maximizes waveform height
      url: URL.createObjectURL(file),
      // Removed 'scrollParent' as it is handled automatically or deprecated in strict types
    });

    const wsRegions = wavesurfer.current.registerPlugin(RegionsPlugin.create());
    regions.current = wsRegions;

    wavesurfer.current.on('decode', () => {
        const duration = wavesurfer.current?.getDuration() || 0;
        
        // VISUAL POLISH: Custom Handle Style
        wsRegions.addRegion({
            start: duration * 0.1,
            end: duration * 0.9,
            color: 'rgba(236, 72, 153, 0.15)',
            drag: true,
            resize: true,
            // Removed 'handleStyle' to fix strict TypeScript error. 
            // Default styles will apply.
        });
        
        setTrimRegion({ start: duration * 0.1, end: duration * 0.9 });
        setIsReady(true);
    });

    wavesurfer.current.on('timeupdate', (time) => setCurrentTime(time));
    wavesurfer.current.on('play', () => setIsPlaying(true));
    wavesurfer.current.on('pause', () => setIsPlaying(false));
    
    wsRegions.on('region-updated', (region) => {
        setTrimRegion({ start: region.start, end: region.end });
        // Auto-Reset result if user changes trim
        setDownloadUrl(null);
    });
  }, [setDownloadUrl]);

  // NEW: Zoom Function
  const setZoom = (value: number) => {
      setZoomLevel(value);
      if (wavesurfer.current) {
          wavesurfer.current.zoom(value);
      }
  };

  const togglePlay = () => wavesurfer.current?.playPause();

  // UPDATED: Accepts Format and Quality
  const cutAudio = async (
      file: File, 
      options: { 
          denoise?: boolean, 
          normalize?: boolean, 
          format?: string,
          quality?: number 
      }
    ) => {
      
      const filters: ('denoise' | 'normalize')[] = [];
      if (options.denoise) filters.push('denoise');
      if (options.normalize) filters.push('normalize');

      // Default to input format if not specified, OR force mp3 if user wants
      const targetFormat = options.format || file.name.split('.').pop() || 'mp3';

      await convertFile(file, targetFormat, {
          trimStart: trimRegion.start,
          trimEnd: trimRegion.end,
          audioFilters: filters,
          quality: options.quality // Pass bitrate/quality setting
      });
  };

  useEffect(() => {
      return () => wavesurfer.current?.destroy();
  }, []);

  return { 
    containerRef, 
    loadAudio, 
    togglePlay, 
    isPlaying, 
    isReady,
    currentTime,
    trimRegion,
    zoomLevel,
    setZoom, // Expose Zoom
    cutAudio,
    status,     
    progress,   
    downloadUrl,
    setDownloadUrl, // Expose Reset
    outputFileName // FIX: Export this so the UI can use it
  };
}