"use client";

import TechModal from "@/components/dashboard/tech-modal";
import { Search } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative w-full flex flex-col items-center pt-2 pb-0 overflow-hidden">
      
      {/* 1. STATUS BADGE */}
      <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-[9px] uppercase tracking-[0.3em] font-bold text-slate-500 mb-4">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
        </span>
        Bunker Mode
      </div>

      {/* 2. REFINED ONE-LINE HEADLINE */}
      {/* Optimized tracking and gradient for high-impact visual clarity */}
      <h1 className="text-[2.2rem] sm:text-6xl lg:text-[6.5rem] xl:text-[7.5rem] font-black tracking-[-0.05em] text-white leading-none mb-4 whitespace-nowrap px-4 pr-8 select-none">
        Privacy-First <span className="text-transparent bg-clip-text bg-gradient-to-br from-orange-400 to-orange-600 drop-shadow-[0_0_25px_rgba(249,115,22,0.3)]">Media OS.</span>
      </h1>

      {/* 3. MINIMAL SUBTEXT */}
      <p className="text-[10px] md:text-xs text-slate-500 font-medium tracking-wide mb-6 uppercase">
        Local Processing • Zero Data Exfiltration • Powered by WASM
      </p>

      {/* 4. SLIM SPOTLIGHT BAR */}
      <div className="w-full max-w-lg mx-auto px-6 mb-8">
        <div className="relative group">
          <div className="absolute inset-0 bg-orange-500/10 blur-xl group-focus-within:bg-orange-500/20 transition-all duration-500 opacity-0 group-focus-within:opacity-100" />
          <div className="relative flex items-center bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-xl p-1 transition-all group-hover:border-slate-700 focus-within:border-orange-500/40">
            <Search className="ml-3 text-slate-600 w-3.5 h-3.5" />
            <input 
              type="text" 
              placeholder="Search tools..." 
              className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder:text-slate-700 px-3 py-1.5 text-xs font-medium"
            />
          </div>
        </div>
      </div>

      {/* 5. TECH MODAL TRIGGER */}
      {/* Renamed to differentiate from the navbar scroll-to-section link */}
      <TechModal label="See Tech Stack" />
    </section>
  );
}