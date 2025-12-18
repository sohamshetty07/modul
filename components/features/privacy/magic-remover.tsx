"use client";

import { useState, useEffect } from "react";
import { useMagicRemover } from "@/hooks/use-magic-remover";
import { useFileStore } from "@/hooks/use-file-transfer"; // <--- Added for hand-off logic
import Dropzone from "@/components/dashboard/dropzone";
import { Button } from "@/components/ui/button";
import { 
    Eraser, EyeOff, Download, Undo2, 
    ScanFace, FileSignature, Loader2
} from "lucide-react";

// 1. Define Props to accept initialFile from ToolSwitcher
interface MagicRemoverProps {
  initialFile?: File | null;
}

export default function MagicRemover({ initialFile }: MagicRemoverProps) {
  const {
      canvasRef, containerRef, loadImage, 
      startDrawing, drawMove, stopDrawing, 
      setMode, mode, undo, download, hasImage, canUndo
  } = useMagicRemover();

  const setPreloadedFile = useFileStore((state) => state.setPreloadedFile); // <--- Added

  // 2. THE CATCHER LOGIC: Automatically load file dropped from home page
  useEffect(() => {
    if (initialFile && initialFile.type.startsWith('image/')) {
        loadImage(initialFile);
        
        // Clear global store so it doesn't re-trigger on subsequent visits
        setPreloadedFile(null);
    }
  }, [initialFile, loadImage, setPreloadedFile]);

  const handleFile = (files: File[]) => {
      if (files[0]) loadImage(files[0]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* HEADER */}
        <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-white flex items-center justify-center gap-2 tracking-tighter">
                <ScanFace className="text-purple-500" /> Magic Remover
            </h2>
            <p className="text-slate-400 text-sm">Redact sensitive info. Blur faces or blackout text locally.</p>
        </div>

        {/* WORKSPACE */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-1 shadow-2xl overflow-hidden min-h-[500px] flex flex-col backdrop-blur-xl">
            
            {/* 1. TOOLBAR (Only visible if image loaded) */}
            {hasImage && (
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-slate-800 bg-slate-950/50">
                    
                    {/* Tools */}
                    <div className="flex gap-2">
                        <Button 
                            onClick={() => setMode('blur')}
                            variant={mode === 'blur' ? 'default' : 'secondary'}
                            className={`h-9 text-[10px] font-bold uppercase tracking-widest transition-all ${
                                mode === 'blur' ? 'bg-purple-600 hover:bg-purple-500' : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                        >
                            <Eraser className="mr-2 h-4 w-4" /> Pixelate
                        </Button>
                        <Button 
                            onClick={() => setMode('blackout')}
                            variant={mode === 'blackout' ? 'default' : 'secondary'}
                            className={`h-9 text-[10px] font-bold uppercase tracking-widest transition-all ${
                                mode === 'blackout' ? 'bg-white text-black hover:bg-slate-200' : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                        >
                            <EyeOff className="mr-2 h-4 w-4" /> Blackout
                        </Button>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <Button 
                            onClick={undo} 
                            disabled={!canUndo}
                            variant="ghost" 
                            size="icon"
                            className="text-slate-500 hover:text-white h-9 w-9 border border-slate-800"
                        >
                            <Undo2 size={16} />
                        </Button>
                        <Button onClick={download} className="h-9 bg-green-600 hover:bg-green-500 text-[10px] font-bold uppercase tracking-widest px-6">
                            <Download className="mr-2 h-4 w-4" /> Save
                        </Button>
                    </div>
                </div>
            )}

            {/* 2. CANVAS AREA */}
            <div className="flex-1 bg-slate-950 relative flex items-center justify-center p-4">
                {!hasImage ? (
                    <div className="w-full max-w-xl">
                        <Dropzone onFilesDropped={handleFile} accept={{ 'image/*': [] }} />
                        
                        {/* Features List */}
                        <div className="grid grid-cols-3 gap-4 mt-8 text-center">
                            <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800 transition-colors hover:border-slate-700">
                                <ScanFace className="w-8 h-8 mx-auto text-purple-500 mb-3" />
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Face Blur</p>
                            </div>
                            <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800 transition-colors hover:border-slate-700">
                                <FileSignature className="w-8 h-8 mx-auto text-blue-500 mb-3" />
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Redact Text</p>
                            </div>
                            <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800 transition-colors hover:border-slate-700">
                                <EyeOff className="w-8 h-8 mx-auto text-slate-200 mb-3 opacity-50" />
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Privacy</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div 
                        ref={containerRef} 
                        className="relative w-full h-full flex items-center justify-center cursor-crosshair overflow-hidden"
                    >
                        <canvas
                            ref={canvasRef}
                            onMouseDown={startDrawing}
                            onMouseMove={drawMove}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={drawMove}
                            onTouchEnd={stopDrawing}
                            className="max-w-full max-h-[70vh] shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-lg border border-slate-800"
                        />
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}