"use client";

import { useState, useEffect, useRef } from "react";
import { useTerminal } from "@/hooks/use-terminal";
import { Terminal as TerminalIcon, ChevronUp, ChevronDown, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Terminal() {
  const { logs, clearLogs } = useTerminal();
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logic
  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isOpen]);

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out border-t border-slate-800 bg-black/95 backdrop-blur-xl shadow-2xl flex flex-col",
      // FIX: Force specific height classes
      isOpen ? "h-80" : "h-10"
    )}>
      {/* HEADER - Fixed Height */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex-none h-10 flex items-center justify-between px-4 cursor-pointer hover:bg-white/5 transition-colors border-b border-white/5"
      >
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${logs.length > 0 ? "bg-green-500 animate-pulse" : "bg-slate-600"}`} />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 select-none flex items-center gap-2">
            <TerminalIcon size={12} /> System Console
          </span>
        </div>
        
        <div className="flex items-center gap-3">
            {isOpen && logs.length > 0 && (
                <button 
                    onClick={(e) => { e.stopPropagation(); clearLogs(); }}
                    className="text-slate-600 hover:text-red-400 transition-colors p-1"
                    title="Clear Console"
                >
                    <Trash2 size={12} />
                </button>
            )}
            {isOpen ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronUp size={14} className="text-slate-500" />}
        </div>
      </div>

      {/* LOG OUTPUT AREA - Flexible Height with Scroll */}
      {isOpen && (
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 font-mono text-[10px] space-y-1 bg-black/50"
          style={{ scrollBehavior: 'smooth' }}
        >
          {logs.length === 0 ? (
            <div className="text-slate-700 italic opacity-50 pl-2">&gt; Waiting for process stream...</div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex gap-3 hover:bg-white/5 p-1 rounded px-2 transition-colors border-l-2 border-transparent hover:border-slate-700">
                <span className="text-slate-600 shrink-0 select-none w-24 text-right opacity-70 font-mono">
                    {log.timestamp}
                </span>
                <span className={cn(
                  "uppercase font-bold shrink-0 w-16 text-center select-none text-[9px] border rounded px-1 h-fit mt-0.5",
                  log.type === 'ffmpeg' && "text-blue-400 border-blue-900/50 bg-blue-900/10",
                  log.type === 'neural' && "text-purple-400 border-purple-900/50 bg-purple-900/10",
                  log.type === 'success' && "text-green-400 border-green-900/50 bg-green-900/10",
                  log.type === 'error' && "text-red-400 border-red-900/50 bg-red-900/10",
                  log.type === 'system' && "text-slate-500 border-slate-800 bg-slate-800/50",
                )}>
                  {log.type}
                </span>
                <span className="text-slate-300 break-all leading-relaxed opacity-90">
                    {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}