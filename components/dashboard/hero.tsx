"use client";

import { ShieldCheck, Zap, Cpu, Github } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <div className="text-center space-y-6 py-12 md:py-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 1. TRUST BADGE */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium text-slate-400 mb-4">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        All processing runs locally in your browser
      </div>

      {/* 2. HEADLINE */}
      <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white max-w-3xl mx-auto leading-tight">
        The <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">Privacy-First</span> <br />
        Media Studio.
      </h1>

      {/* 3. SUBTEXT */}
      <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
        Convert, Edit, and Transcribe without your data ever leaving your device. 
        Powered by <span className="text-slate-200 font-mono text-sm bg-slate-800 px-1 rounded">WebAssembly</span> and <span className="text-slate-200 font-mono text-sm bg-slate-800 px-1 rounded">Edge AI</span>.
      </p>

      {/* 4. FEATURE PILLS */}
      <div className="flex flex-wrap justify-center gap-4 pt-4 text-sm text-slate-400">
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 rounded-xl border border-slate-800/50">
            <ShieldCheck size={16} className="text-green-500" />
            <span>No Uploads</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 rounded-xl border border-slate-800/50">
            <Zap size={16} className="text-yellow-500" />
            <span>Zero Latency</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 rounded-xl border border-slate-800/50">
            <Cpu size={16} className="text-blue-500" />
            <span>Client-Side AI</span>
        </div>
      </div>

      {/* 5. CALL TO ACTION (GitHub / Info) */}
      <div className="pt-8 flex justify-center gap-4">
        <a 
          href="https://github.com/sohamshetty07/modul" 
          target="_blank" 
          rel="noreferrer"
        >
          <Button variant="outline" className="gap-2 border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300">
            <Github size={16} /> Star on GitHub
          </Button>
        </a>
      </div>
    </div>
  );
}