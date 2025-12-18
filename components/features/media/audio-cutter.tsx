"use client";

import { useState, useEffect } from "react";
import { useAudioCutter } from "@/hooks/use-audio-cutter";
import { useFileStore } from "@/hooks/use-file-transfer"; // <--- Add this
import Dropzone from "@/components/dashboard/dropzone";
import { Button } from "@/components/ui/button";
import { 
    Scissors, Play, Pause, Download, Loader2, Music, 
    Wand2, Volume2, AudioLines, Settings2, ZoomIn, ZoomOut, RefreshCcw 
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

type AudioTool = 'trim' | 'enhance' | 'convert';

// 1. Define Props to accept initialFile
interface AudioStudioProps {
  initialFile?: File | null;
}

export default function AudioStudio({ initialFile }: AudioStudioProps) {
  const { 
      containerRef, loadAudio, togglePlay, isPlaying, isReady, 
      trimRegion, zoomLevel, setZoom, cutAudio, status, progress, 
      downloadUrl, setDownloadUrl, outputFileName 
  } = useAudioCutter();

  const [file, setFile] = useState<File | null>(null);
  const setPreloadedFile = useFileStore((state) => state.setPreloadedFile); // <--- Add this
  const [activeTool, setActiveTool] = useState<AudioTool>('trim');
  
  // Enhancement States
  const [useDenoise, setUseDenoise] = useState(false);
  const [useNormalize, setUseNormalize] = useState(false);

  // Export States
  const [exportFormat, setExportFormat] = useState('mp3');
  const [exportQuality, setExportQuality] = useState(90); 

  // 2. THE CATCHER LOGIC
  useEffect(() => {
    if (initialFile && initialFile.type.startsWith('audio/')) {
        // Push the preloaded file into local state
        setFile(initialFile);
        
        // Clear global store to prevent re-triggering
        setPreloadedFile(null);
        
        toast({ title: "Audio Loaded", description: "Bunker Mode: Processing locally." });
    }
  }, [initialFile, setPreloadedFile]);

  const handleFile = (files: File[]) => {
      const f = files[0];
      if (f && f.type.startsWith('audio/')) {
          setFile(f);
      } else {
          toast({ title: "Invalid File", description: "Please upload an audio file.", variant: "destructive" });
      }
  };

  useEffect(() => {
    if (file && containerRef.current) {
        loadAudio(file);
    }
  }, [file, containerRef, loadAudio]);

  useEffect(() => {
      if (downloadUrl) setDownloadUrl(null);
  }, [useDenoise, useNormalize, exportFormat, exportQuality]);

  const processAudio = async () => {
      if (!file) return;
      await cutAudio(file, {
          denoise: useDenoise,
          normalize: useNormalize,
          format: exportFormat,
          quality: exportQuality
      });
  };

  const formatTime = (s: number) => {
      const mins = Math.floor(s / 60);
      const secs = Math.floor(s % 60);
      const ms = Math.floor((s % 1) * 10);
      return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
        
        {/* HEADER */}
        <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-white flex items-center justify-center gap-2 tracking-tighter">
                <AudioLines className="text-pink-500" /> Audio Studio
            </h2>
            <p className="text-slate-400 text-sm">Trim, Enhance, and Master your audio locally.</p>
        </div>

        {/* MAIN WORKSPACE */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-1 shadow-2xl overflow-hidden backdrop-blur-xl">
            
            {/* 1. VISUALIZER AREA */}
            <div className={`bg-slate-950 relative transition-all duration-500 ${file ? 'h-80 border-b border-slate-800' : 'h-auto'}`}>
                {!file ? (
                    <div className="p-12">
                         <Dropzone onFilesDropped={handleFile} accept={{ 'audio/*': [] }} />
                    </div>
                ) : (
                    <div className="h-full flex flex-col">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-900 bg-slate-950/50">
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500 ring-1 ring-pink-500/20">
                                    <Music size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-200">{file.name}</p>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                                        <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                        <span>•</span>
                                        <span>Bunker Mode</span>
                                    </div>
                                </div>
                             </div>
                             
                             {isReady && (
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 bg-slate-900 rounded-full p-1 border border-slate-800">
                                        <ZoomOut size={14} className="text-slate-500 ml-2" />
                                        <input 
                                            type="range" 
                                            min="10" 
                                            max="200" 
                                            value={zoomLevel} 
                                            onChange={(e) => setZoom(Number(e.target.value))}
                                            className="w-24 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
                                        />
                                        <ZoomIn size={14} className="text-slate-500 mr-2" />
                                    </div>

                                    <Button 
                                        onClick={togglePlay}
                                        className="w-12 h-12 rounded-full bg-pink-600 hover:bg-pink-500 text-white shadow-lg shadow-pink-900/20 transition-all hover:scale-105"
                                    >
                                        {isPlaying ? <Pause size={20} className="fill-current" /> : <Play size={20} className="fill-current ml-1" />}
                                    </Button>
                                </div>
                             )}
                        </div>

                        <div className="flex-1 relative group overflow-hidden">
                             {!isReady && (
                                <div className="absolute inset-0 flex items-center justify-center z-10 text-slate-500 gap-2 bg-slate-950/80 backdrop-blur-sm uppercase text-[10px] font-bold tracking-[0.3em]">
                                    <Loader2 className="animate-spin text-pink-500" size={16} /> Generating Waveform...
                                </div>
                             )}
                             <div ref={containerRef} className="absolute inset-0 top-0 h-full w-full" />
                        </div>
                    </div>
                )}
            </div>

            {/* 2. TOOL RACK */}
            {file && (
                <div className="grid md:grid-cols-[240px_1fr] min-h-[300px]">
                    <div className="border-r border-slate-800 bg-slate-950 p-4 space-y-2">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 px-2">Studio Tools</p>
                        <button
                            onClick={() => setActiveTool('trim')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                                activeTool === 'trim' ? 'bg-slate-800 text-pink-400 ring-1 ring-slate-700' : 'text-slate-500 hover:text-slate-200 hover:bg-slate-900'
                            }`}
                        >
                            <Scissors size={16} /> Trimmer
                        </button>
                        <button
                            onClick={() => setActiveTool('enhance')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                                activeTool === 'enhance' ? 'bg-slate-800 text-blue-400 ring-1 ring-slate-700' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                            }`}
                        >
                            <Wand2 size={16} /> Enhancer
                        </button>
                        <button
                            onClick={() => setActiveTool('convert')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                                activeTool === 'convert' ? 'bg-slate-800 text-green-400 ring-1 ring-slate-700' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                            }`}
                        >
                            <Settings2 size={16} /> Export
                        </button>
                    </div>

                    <div className="p-8 bg-slate-900/20 flex flex-col relative">
                        
                        {activeTool === 'trim' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-left-2">
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Precision Trimmer</h3>
                                    <p className="text-slate-400 text-sm">Drag the pink brackets on the waveform to set your cut.</p>
                                </div>
                                
                                <div className="flex items-center justify-between bg-slate-950/50 p-6 rounded-2xl border border-slate-800 max-w-lg">
                                    <div className="text-center">
                                        <p className="text-[9px] uppercase text-slate-500 font-bold tracking-widest mb-1">Start Time</p>
                                        <p className="font-mono text-2xl text-pink-500">{formatTime(trimRegion.start)}</p>
                                    </div>
                                    <div className="h-12 w-px bg-slate-800" />
                                    <div className="text-center">
                                        <p className="text-[9px] uppercase text-slate-500 font-bold tracking-widest mb-1">Duration</p>
                                        <p className="font-mono text-2xl text-white">{(trimRegion.end - trimRegion.start).toFixed(2)}s</p>
                                    </div>
                                    <div className="h-12 w-px bg-slate-800" />
                                    <div className="text-center">
                                        <p className="text-[9px] uppercase text-slate-500 font-bold tracking-widest mb-1">End Time</p>
                                        <p className="font-mono text-2xl text-pink-500">{formatTime(trimRegion.end)}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTool === 'enhance' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-left-2">
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Audio Enhancement</h3>
                                    <p className="text-slate-400 text-sm">Apply filters to clean up recordings without data leaving your device.</p>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div 
                                        className={`p-5 rounded-2xl border cursor-pointer transition-all ${useDenoise ? 'bg-blue-500/10 border-blue-500/50 ring-1 ring-blue-500/20' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                                        onClick={() => setUseDenoise(!useDenoise)}
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${useDenoise ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                                                <Wand2 size={14} />
                                            </div>
                                            <span className="text-xs font-bold text-slate-200 uppercase tracking-widest">Vocal Clarifier</span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 leading-relaxed uppercase font-medium">
                                            High-Pass Filter (200Hz). Removes rumble, wind noise, and muddiness.
                                        </p>
                                    </div>

                                    <div 
                                        className={`p-5 rounded-2xl border cursor-pointer transition-all ${useNormalize ? 'bg-green-500/10 border-green-500/50 ring-1 ring-green-500/20' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                                        onClick={() => setUseNormalize(!useNormalize)}
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${useNormalize ? 'bg-green-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                                                <Volume2 size={14} />
                                            </div>
                                            <span className="text-xs font-bold text-slate-200 uppercase tracking-widest">Normalizer</span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 leading-relaxed uppercase font-medium">
                                            Dynamic Gain. Boosts quiet parts and limits loud peaks for consistent volume.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTool === 'convert' && (
                             <div className="space-y-8 animate-in fade-in slide-in-from-left-2">
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Export Settings</h3>
                                    <p className="text-slate-400 text-sm">Customize your final mixdown. FFmpeg runs in your browser.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-6 max-w-xl">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Format</label>
                                        <div className="grid grid-cols-1 gap-2">
                                            {['mp3', 'wav', 'm4a'].map((fmt) => (
                                                <button 
                                                    key={fmt}
                                                    onClick={() => setExportFormat(fmt)}
                                                    className={`px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest text-left border transition-all ${
                                                        exportFormat === fmt ? 'bg-slate-800 border-slate-600 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                                                    }`}
                                                >
                                                    {fmt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Quality</label>
                                        <div className="grid grid-cols-1 gap-2">
                                            {[
                                                { label: 'High (320k)', val: 95 },
                                                { label: 'Med (192k)', val: 70 },
                                                { label: 'Low (128k)', val: 40 }
                                            ].map((q) => (
                                                <button 
                                                    key={q.val}
                                                    onClick={() => setExportQuality(q.val)}
                                                    className={`px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest text-left border transition-all ${
                                                        exportQuality === q.val ? 'bg-slate-800 border-slate-600 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                                                    }`}
                                                >
                                                    {q.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                             </div>
                        )}

                        <div className="mt-auto pt-8 border-t border-slate-800 flex items-center justify-end gap-4">
                            
                            {downloadUrl && (
                                <Button 
                                    onClick={() => setDownloadUrl(null)} 
                                    variant="ghost" 
                                    className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-white"
                                >
                                    <RefreshCcw size={14} className="mr-2" /> Reset
                                </Button>
                            )}

                            {downloadUrl ? (
                                <a href={downloadUrl} download={outputFileName || `studio_mix_${file.name}`} className="w-full sm:w-auto">
                                    <Button className="w-full bg-green-600 hover:bg-green-500 h-12 px-8 text-xs font-bold uppercase tracking-widest shadow-lg shadow-green-900/20 animate-in zoom-in">
                                        <Download className="mr-2 h-4 w-4" /> Download Mix
                                    </Button>
                                </a>
                            ) : (
                                <Button 
                                    onClick={processAudio} 
                                    disabled={status === 'converting'}
                                    className="w-full sm:w-auto bg-pink-600 hover:bg-pink-500 h-12 px-8 text-xs font-bold uppercase tracking-widest shadow-lg shadow-pink-900/20 transition-all hover:scale-105"
                                >
                                    {status === 'converting' ? (
                                        <><Loader2 className="animate-spin mr-2" size={14} /> Processing {progress}%</>
                                    ) : (
                                        <><AudioLines className="mr-2 h-4 w-4" /> Process Mix</>
                                    )}
                                </Button>
                            )}
                        </div>

                    </div>
                </div>
            )}
        </div>
    </div>
  );
}