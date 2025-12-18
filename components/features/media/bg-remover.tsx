"use client";

import { useEffect, useState } from "react";
import { Sparkles, Wrench, AlertTriangle, FileImage, X } from "lucide-react";
import { useFileStore } from "@/hooks/use-file-transfer";
import { Button } from "@/components/ui/button";

interface BgRemoverProps {
  initialFile?: File | null;
}

export default function BgRemover({ initialFile }: BgRemoverProps) {
  const [droppedFile, setDroppedFile] = useState<File | null>(null);
  const setPreloadedFile = useFileStore((state) => state.setPreloadedFile);

  // 1. THE CATCHER LOGIC:
  // Even during maintenance, we catch the file to show the system is alive.
  useEffect(() => {
    if (initialFile && initialFile.type.startsWith('image/')) {
      setDroppedFile(initialFile);
      
      // Clear global store so it doesn't re-trigger
      setPreloadedFile(null);
    }
  }, [initialFile, setPreloadedFile]);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HEADER */}
      <div className="text-center space-y-2">
           <h2 className="text-3xl font-bold text-white flex items-center justify-center gap-3 tracking-tighter">
               <Sparkles className="text-purple-500" size={28} /> 
               Magic Remover
           </h2>
           <p className="text-slate-400 text-sm">Remove backgrounds instantly via Local Edge AI.</p>
      </div>

      {/* MAINTENANCE WORKSPACE */}
      <div className="relative p-12 text-center border border-slate-800 rounded-3xl bg-slate-900/40 backdrop-blur-xl overflow-hidden">
        
        {/* Subtle Background Glow */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-purple-500/10 blur-3xl rounded-full pointer-events-none" />

        <div className="relative z-10">
            {/* If a file was dropped, show a "File Received" status instead of just a wrench */}
            {droppedFile ? (
                <div className="mb-8 animate-in zoom-in duration-300">
                    <div className="inline-flex items-center gap-3 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-2xl mb-4">
                        <FileImage size={18} className="text-purple-400" />
                        <span className="text-xs font-bold text-slate-200 uppercase tracking-widest truncate max-w-[200px]">
                            {droppedFile.name}
                        </span>
                        <button onClick={() => setDroppedFile(null)} className="text-slate-500 hover:text-white">
                            <X size={14} />
                        </button>
                    </div>
                    <p className="text-[10px] font-black text-purple-500 uppercase tracking-[0.3em]">File Cached locally</p>
                </div>
            ) : (
                <div className="w-20 h-20 mx-auto bg-slate-800/50 rounded-2xl flex items-center justify-center mb-6 border border-slate-700/50 shadow-inner">
                    <Wrench className="text-purple-400" size={32} />
                </div>
            )}
            
            <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">AI Engine Upgrade in Progress</h3>
            
            <p className="text-slate-400 max-w-lg mx-auto mb-8 text-sm leading-relaxed">
                We are migrating our background removal logic to <span className="text-slate-200">RMBG-1.4</span> (quantized) to ensure 
                it runs smoothly on your device without server calls. 
            </p>

            <div className="flex flex-col items-center gap-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-900/20 border border-yellow-800/30 rounded-full text-yellow-500 text-[10px] font-bold uppercase tracking-widest">
                    <AlertTriangle size={12} />
                    <span>Bunker Mode Migration Active</span>
                </div>
                
                <p className="text-[10px] text-slate-600 uppercase font-bold tracking-widest">
                    Try the <span className="text-orange-500/50">Video Converter</span> in the meantime.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
}