"use client";

import { useState } from "react";
import { useNetworkShield } from "@/hooks/use-network-shield";
import { ShieldCheck, Globe, Lock, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function PrivacyShield() {
  const { totalLeaked, totalProcessed } = useNetworkShield();
  const [isOpen, setIsOpen] = useState(false);
  const isBunkerMode = totalLeaked === 0;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 1. EXPANDABLE STATS PANEL */}
      {isOpen && (
        <div className="bg-slate-950/90 backdrop-blur-2xl border border-slate-800 rounded-2xl p-4 shadow-2xl min-w-[280px] ring-1 ring-white/5 animate-in slide-in-from-bottom-2 duration-300">
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Network Monitor</span>
              <span className={cn(
                "text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase",
                isBunkerMode ? "text-green-500 border-green-500/30 bg-green-500/5" : "text-orange-500 border-orange-500/30 bg-orange-500/5"
              )}>
                {isBunkerMode ? "Zero Exfiltration" : "Traffic Detected"}
              </span>
            </div>
            
            <div className="space-y-2">
              {/* LOCAL PROCESSING LINE */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span className="flex items-center gap-1.5"><Lock size={10} className="text-green-500" /> Local</span>
                  <span>{(totalProcessed / (1024 * 1024)).toFixed(1)} MB</span>
                </div>
                <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 transition-all duration-500" 
                    style={{ width: totalProcessed > 0 ? '100%' : '0%' }}
                  />
                </div>
              </div>

              {/* OUTBOUND LINE */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span className="flex items-center gap-1.5"><Globe size={10} className="text-slate-600" /> Outbound</span>
                  <span className={isBunkerMode ? "text-slate-600" : "text-red-500"}>{totalLeaked} KB</span>
                </div>
                <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-500 transition-all duration-500" 
                    style={{ width: `${Math.min(totalLeaked * 10, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. MINIMALIST TOGGLE TRIGGER */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "group flex items-center gap-3 px-4 py-2 rounded-full border transition-all duration-300 shadow-xl",
          isOpen 
            ? "bg-slate-900 border-slate-700 text-white" 
            : "bg-slate-950/80 backdrop-blur-md border-slate-800 text-slate-400 hover:border-slate-700"
        )}
      >
        <div className="relative flex h-2 w-2">
          <span className={cn(
            "absolute inline-flex h-full w-full rounded-full opacity-75",
            isBunkerMode ? "animate-ping bg-green-400" : "bg-orange-400"
          )} />
          <span className={cn(
            "relative inline-flex rounded-full h-2 w-2",
            isBunkerMode ? "bg-green-500" : "bg-orange-500"
          )} />
        </div>

        <span className="text-[10px] font-bold uppercase tracking-[0.2em] select-none">
          {isBunkerMode ? "Bunker Mode" : "Network Active"}
        </span>

        {isOpen ? (
          <ChevronDown size={14} className="text-slate-600 group-hover:text-white transition-colors" />
        ) : (
          <ChevronUp size={14} className="text-slate-600 group-hover:text-white transition-colors" />
        )}
      </button>
    </div>
  );
}