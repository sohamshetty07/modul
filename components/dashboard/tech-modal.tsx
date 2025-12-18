"use client";

import { 
  Dialog, 
  DialogContent, 
  DialogTrigger,
  DialogTitle,
  DialogClose // 1. Import DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Cpu, 
  Layers, 
  Zap, 
  Code2, 
  ShieldCheck, 
  ServerOff, 
  FileJson, 
  Database, 
  ArrowRight,
  X // 2. Import X Icon
} from "lucide-react";

interface TechModalProps {
  label?: string; 
}

export default function TechModal({ label = "How it works" }: TechModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 h-9 text-xs text-slate-500 hover:text-white hover:bg-white/5 font-bold uppercase tracking-[0.2em] transition-all">
          <Code2 size={14} className="text-orange-500/50" /> 
          {label}
        </Button>
      </DialogTrigger>
      
      {/* Added [&>button]:hidden to hide the default shadcn close button if it conflicts */}
      <DialogContent className="max-w-4xl bg-slate-950 border-slate-800 p-0 overflow-hidden shadow-2xl block sm:rounded-3xl [&>button]:hidden" aria-describedby={undefined}>
        
        {/* BACKGROUND GLOW EFFECTS */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-purple-500 to-blue-500 z-10" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-orange-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-20">
            {/* 1. HEADER */}
            <div className="flex items-center justify-between p-6 border-b border-slate-900 bg-slate-950/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                        <Cpu className="text-orange-500" size={20} />
                    </div>
                    <div>
                        <DialogTitle className="text-xl font-bold text-white tracking-tight">
                            System Architecture
                        </DialogTitle>
                        <p className="text-xs text-slate-500 font-mono uppercase tracking-widest">v2.0.0 • Local Processing Core</p>
                    </div>
                </div>

                {/* 3. EXPLICIT CLOSE BUTTON */}
                <DialogClose asChild>
                    <Button variant="ghost" size="icon" className="text-slate-500 hover:text-white hover:bg-slate-800 rounded-full">
                        <X size={20} />
                    </Button>
                </DialogClose>
            </div>

            {/* 2. MAIN BODY */}
            <div className="p-8 space-y-8 max-h-[80vh] overflow-y-auto">
                
                {/* SECTION A: VISUAL COMPARISON FLOWCHART */}
                <div className="grid md:grid-cols-2 gap-4">
                    {/* Traditional (The 'Bad' Way) */}
                    <div className="p-4 rounded-2xl border border-slate-800/50 bg-slate-900/20 opacity-50 grayscale hover:grayscale-0 transition-all duration-500 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-slate-950/80 z-10 flex items-center justify-center group-hover:opacity-0 transition-opacity">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Traditional Cloud Apps</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-700 space-x-2">
                             <div className="text-center">
                                <FileJson size={24} className="mx-auto mb-2"/>
                                <span className="text-[10px] font-bold">Your File</span>
                             </div>
                             <div className="flex-1 h-px bg-slate-800 relative">
                                <ArrowRight size={12} className="absolute -top-1.5 left-1/2 -translate-x-1/2"/>
                             </div>
                             <div className="text-center">
                                <Database size={24} className="mx-auto mb-2 text-red-900"/>
                                <span className="text-[10px] font-bold">Cloud Server</span>
                             </div>
                             <div className="flex-1 h-px bg-slate-800 relative">
                                <ArrowRight size={12} className="absolute -top-1.5 left-1/2 -translate-x-1/2"/>
                             </div>
                             <div className="text-center">
                                <FileJson size={24} className="mx-auto mb-2"/>
                                <span className="text-[10px] font-bold">Result</span>
                             </div>
                        </div>
                    </div>

                    {/* Modul (The 'Good' Way) */}
                    <div className="p-5 rounded-2xl border border-green-500/20 bg-green-500/5 relative overflow-hidden">
                        <div className="absolute top-2 right-2 flex gap-1">
                             <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-green-500/20 text-green-400 border border-green-500/20">NO UPLOAD</span>
                        </div>
                        <div className="flex items-center justify-between relative z-10">
                             <div className="text-center">
                                <div className="w-10 h-10 mx-auto bg-slate-900 rounded-full flex items-center justify-center border border-slate-800 shadow-xl mb-2">
                                    <FileJson size={16} className="text-slate-300"/>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Input</span>
                             </div>

                             <div className="flex-1 px-4 text-center">
                                 <div className="h-0.5 w-full bg-gradient-to-r from-slate-800 via-green-500 to-slate-800 relative">
                                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-black rounded-full border border-green-500 flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                                         <Zap size={14} className="text-green-500 fill-current" />
                                     </div>
                                 </div>
                                 <p className="text-[9px] font-bold text-green-500 mt-4 uppercase tracking-widest">WASM Engine</p>
                             </div>

                             <div className="text-center">
                                <div className="w-10 h-10 mx-auto bg-slate-900 rounded-full flex items-center justify-center border border-slate-800 shadow-xl mb-2">
                                    <Layers size={16} className="text-white"/>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Output</span>
                             </div>
                        </div>
                    </div>
                </div>

                {/* SECTION B: THE TECH STACK GRID */}
                <div className="grid md:grid-cols-3 gap-4">
                    {/* Card 1: FFmpeg */}
                    <div className="group p-5 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-orange-500/50 transition-all hover:bg-slate-900 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Layers size={80} />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-orange-400 transition-colors">FFmpeg.WASM</h3>
                            <p className="text-xs font-mono text-orange-500 mb-3">THE MEDIA ENGINE</p>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Compiled C++ media library running in WebAssembly. Decodes and encodes raw binary data in memory.
                            </p>
                        </div>
                    </div>

                    {/* Card 2: ONNX */}
                    <div className="group p-5 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-purple-500/50 transition-all hover:bg-slate-900 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Cpu size={80} />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-purple-400 transition-colors">ONNX Runtime</h3>
                            <p className="text-xs font-mono text-purple-500 mb-3">THE AI BRAIN</p>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Quantized Neural Networks loaded into browser memory via Transformers.js for offline AI inference.
                            </p>
                        </div>
                    </div>

                    {/* Card 3: Privacy */}
                    <div className="group p-5 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-green-500/50 transition-all hover:bg-slate-900 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <ShieldCheck size={80} />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-green-400 transition-colors">Sandbox Mode</h3>
                            <p className="text-xs font-mono text-green-500 mb-3">ZERO TRUST</p>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Execution in isolated WebWorkers. Network requests blocked by CSP. Data never leaves localhost.
                            </p>
                        </div>
                    </div>
                </div>

                {/* SECTION C: FOOTER BADGE */}
                <div className="flex justify-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 border border-slate-800">
                        <ServerOff size={14} className="text-slate-500" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Serverless Architecture</span>
                    </div>
                </div>

            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}