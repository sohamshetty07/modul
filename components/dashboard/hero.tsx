"use client";

import TechModal from "@/components/dashboard/tech-modal";
import { ShieldCheck, Zap, Cpu, Github } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    // REDUCED PADDING HERE (py-10 instead of py-20)
    <div className="text-center space-y-4 py-8 md:py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 1. TRUST BADGE */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] uppercase tracking-wider font-medium text-slate-400 mb-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        Local Browser Processing
      </div>

      {/* 2. HEADLINE - Slightly smaller on mobile to save space */}
      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white max-w-3xl mx-auto leading-tight">
        The <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">Privacy-First</span> <br />
        Media Studio.
      </h1>

      {/* 3. SUBTEXT - Removed the badges row to save space, integrated into text */}
      <p className="text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
        Convert, Edit, and Transcribe without your data leaving your device. <br className="hidden md:block"/>
        Powered by <span className="text-slate-300">WebAssembly</span> and <span className="text-slate-300">Edge AI</span>.
      </p>

      {/* 4. CTA - Made button smaller (h-9) */}
      <div className="pt-4 flex justify-center gap-3">
        <a href="https://github.com/sohamshetty07/modul" target="_blank" rel="noreferrer">
          <Button variant="outline" size="sm" className="gap-2 border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-300 h-9 text-xs">
            <Github size={14} /> Star on GitHub
          </Button>
        </a>
        
        {/* The new modal trigger */}
        <TechModal />
      </div>
    </div>
  );
}