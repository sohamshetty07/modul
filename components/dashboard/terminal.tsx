"use client";

import { useEffect, useRef } from "react";
import { Terminal as TerminalIcon } from "lucide-react";

interface TerminalProps {
  logs: string[];
}

export default function Terminal({ logs }: TerminalProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  if (logs.length === 0) return null;

  return (
    <div className="mt-4 rounded-xl overflow-hidden border border-slate-800 bg-black/90 shadow-2xl animate-in slide-in-from-top-2">
      {/* Terminal Header */}
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 border-b border-slate-800">
        <TerminalIcon size={14} className="text-slate-400" />
        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
          System Logs
        </span>
      </div>

      {/* Logs Content */}
      <div className="p-4 h-32 overflow-y-auto font-mono text-[10px] space-y-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {logs.map((log, i) => (
          <div key={i} className="text-green-500/90 break-all">
            <span className="opacity-50 mr-2">[{new Date().toLocaleTimeString()}]</span>
            {log}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}