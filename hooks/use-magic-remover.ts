"use client";

import { useState, useRef, useEffect } from "react";

export type RedactionMode = 'blur' | 'blackout';

interface Region {
  x: number;
  y: number;
  w: number;
  h: number;
  mode: RedactionMode;
}

export function useMagicRemover() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentRect, setCurrentRect] = useState<Region | null>(null);
  const [mode, setMode] = useState<RedactionMode>('blur');
  const [history, setHistory] = useState<Region[][]>([]);

  // 1. Load Image onto Canvas
  const loadImage = (file: File) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      setImage(img);
      setRegions([]);
      setHistory([]);
    };
  };

  // 2. Draw Loop (Runs constantly to render image + rectangles)
  const draw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !image) return;

    // Reset Canvas Size to Match Image (Responsive)
    // We strictly match the image's natural aspect ratio, but fit it in the container width
    const container = containerRef.current;
    if (container) {
        const aspect = image.width / image.height;
        const targetWidth = container.clientWidth;
        const targetHeight = targetWidth / aspect;
        
        canvas.width = image.width;   // Actual resolution
        canvas.height = image.height; // Actual resolution
        
        // CSS handles the display size, we work in actual pixels for precision
    }

    // A. Draw Base Image
    ctx.drawImage(image, 0, 0);

    // B. Draw Completed Regions
    [...regions, currentRect].forEach((r) => {
        if (!r) return;
        
        if (r.mode === 'blackout') {
            ctx.fillStyle = '#000000';
            ctx.fillRect(r.x, r.y, r.w, r.h);
        } else {
            // Pixelate Effect
            const sampleSize = 20; // Pixel size
            for (let y = r.y; y < r.y + r.h; y += sampleSize) {
                for (let x = r.x; x < r.x + r.w; x += sampleSize) {
                    // Sample color from the center of the block
                    const p = ctx.getImageData(x + sampleSize/2, y + sampleSize/2, 1, 1).data;
                    ctx.fillStyle = `rgb(${p[0]},${p[1]},${p[2]})`;
                    ctx.fillRect(x, y, sampleSize, sampleSize);
                }
            }
        }
    });
  };

  // Trigger draw whenever state changes
  useEffect(() => {
      requestAnimationFrame(draw);
  }, [image, regions, currentRect]);

  // 3. Mouse Events
  const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      // Handle both mouse and touch
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

      return {
          x: (clientX - rect.left) * scaleX,
          y: (clientY - rect.top) * scaleY
      };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
      if (!image) return;
      const { x, y } = getCoords(e);
      setStartPos({ x, y });
      setIsDrawing(true);
  };

  const drawMove = (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing) return;
      const { x, y } = getCoords(e);
      setCurrentRect({
          x: Math.min(x, startPos.x),
          y: Math.min(y, startPos.y),
          w: Math.abs(x - startPos.x),
          h: Math.abs(y - startPos.y),
          mode
      });
  };

  const stopDrawing = () => {
      if (!isDrawing || !currentRect) return;
      
      // Save to history before adding
      setHistory([...history, regions]);
      setRegions([...regions, currentRect]);
      
      setCurrentRect(null);
      setIsDrawing(false);
  };

  // 4. Actions
  const undo = () => {
      if (history.length === 0) return;
      const previous = history[history.length - 1];
      setRegions(previous);
      setHistory(history.slice(0, -1));
  };

  const download = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const link = document.createElement('a');
      link.download = 'redacted_image.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
  };

  return {
      canvasRef,
      containerRef,
      loadImage,
      startDrawing,
      drawMove,
      stopDrawing,
      setMode,
      mode,
      undo,
      download,
      hasImage: !!image,
      canUndo: history.length > 0
  };
}