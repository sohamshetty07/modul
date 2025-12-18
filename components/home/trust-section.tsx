"use client";

import { 
    Terminal, 
    WifiOff, 
    Ghost, 
    ShieldCheck, 
    Lock, 
    Cpu 
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function TrustSection() {
  return (
    <section className="relative py-24 px-4 overflow-hidden">
        
        {/* DECORATIVE BACKGROUND GRID */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black pointer-events-none" />

        <div className="relative max-w-6xl mx-auto space-y-12">
            
            {/* HEADER */}
            <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] font-bold uppercase tracking-widest animate-in fade-in slide-in-from-bottom-2">
                    <ShieldCheck size={12} />
                    <span>Security Protocol: Active</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter">
                    Ironclad <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">Privacy</span>
                </h2>
                <p className="text-slate-400 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
                    We don't just "promise" privacy. We engineered the architecture to make data exfiltration technically impossible.
                </p>
            </div>

            {/* THE GRID */}
            <div className="grid md:grid-cols-3 gap-6">
                
                {/* CARD 1: LOCAL PROCESSING */}
                <div className="group relative p-1 rounded-3xl bg-gradient-to-b from-slate-800 to-slate-900 hover:from-orange-500/50 hover:to-orange-600/50 transition-all duration-500">
                    <div className="absolute inset-0 bg-slate-950 rounded-[22px] m-[1px] z-10" />
                    <div className="relative z-20 h-full p-8 flex flex-col items-start space-y-4 rounded-3xl overflow-hidden">
                        {/* Glow Effect */}
                        <div className="absolute -right-12 -top-12 w-32 h-32 bg-orange-500/20 blur-[50px] group-hover:bg-orange-500/40 transition-all duration-500" />
                        
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                            <Terminal className="text-orange-500" size={24} />
                        </div>
                        
                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-white group-hover:text-orange-400 transition-colors">
                                Local Processing
                            </h3>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                Your files never touch a cloud server. FFmpeg and AI models run directly in your browser using <span className="text-slate-300 font-mono">WebAssembly</span>.
                            </p>
                        </div>
                        
                        <div className="mt-auto pt-4 flex items-center gap-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                            <span>Browser Only</span>
                        </div>
                    </div>
                </div>

                {/* CARD 2: OFFLINE CAPABLE */}
                <div className="group relative p-1 rounded-3xl bg-gradient-to-b from-slate-800 to-slate-900 hover:from-blue-500/50 hover:to-blue-600/50 transition-all duration-500">
                    <div className="absolute inset-0 bg-slate-950 rounded-[22px] m-[1px] z-10" />
                    <div className="relative z-20 h-full p-8 flex flex-col items-start space-y-4 rounded-3xl overflow-hidden">
                        {/* Glow Effect */}
                        <div className="absolute -right-12 -top-12 w-32 h-32 bg-blue-500/20 blur-[50px] group-hover:bg-blue-500/40 transition-all duration-500" />
                        
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                            <WifiOff className="text-blue-500" size={24} />
                        </div>
                        
                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                                Air-Gapped Ready
                            </h3>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                Disconnect from Wi-Fi and keep working. Modul caches essential engines to run in true <span className="text-slate-300 font-mono">"Bunker Mode"</span>.
                            </p>
                        </div>

                        <div className="mt-auto pt-4 flex items-center gap-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            <span>Offline First</span>
                        </div>
                    </div>
                </div>

                {/* CARD 3: ZERO EXFILTRATION */}
                <div className="group relative p-1 rounded-3xl bg-gradient-to-b from-slate-800 to-slate-900 hover:from-green-500/50 hover:to-green-600/50 transition-all duration-500">
                    <div className="absolute inset-0 bg-slate-950 rounded-[22px] m-[1px] z-10" />
                    <div className="relative z-20 h-full p-8 flex flex-col items-start space-y-4 rounded-3xl overflow-hidden">
                        {/* Glow Effect */}
                        <div className="absolute -right-12 -top-12 w-32 h-32 bg-green-500/20 blur-[50px] group-hover:bg-green-500/40 transition-all duration-500" />
                        
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                            <Ghost className="text-green-500" size={24} />
                        </div>
                        
                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-white group-hover:text-green-400 transition-colors">
                                Zero Footprint
                            </h3>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                We don't collect metadata, logs, or analytics. Your usage is invisible to us. What happens on <span className="text-slate-300 font-mono">localhost</span> stays there.
                            </p>
                        </div>

                        <div className="mt-auto pt-4 flex items-center gap-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span>No Analytics</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </section>
  );
}