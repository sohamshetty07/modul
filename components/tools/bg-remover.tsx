"use client";

import { Sparkles, Wrench, AlertTriangle } from "lucide-react";

export default function BgRemover() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="text-center space-y-2">
           <h2 className="text-3xl font-bold text-white flex items-center justify-center gap-2">
               <Sparkles className="text-purple-500" /> 
               Magic Remover
           </h2>
           <p className="text-slate-400">Remove backgrounds instantly (Local Mode).</p>
      </div>

      {/* Maintenance Card */}
      <div className="p-12 text-center border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/50">
        <div className="w-20 h-20 mx-auto bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
            <Wrench className="text-purple-400" size={40} />
        </div>
        
        <h3 className="text-2xl font-bold text-white mb-3">Feature Under Maintenance</h3>
        
        <p className="text-slate-400 max-w-lg mx-auto mb-8 leading-relaxed">
            We are upgrading our local AI engine to improve performance and compatibility. 
            This tool is temporarily unavailable while we migrate our model hosting.
        </p>

        <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-900/20 border border-yellow-800/50 rounded-lg text-yellow-500 text-sm">
            <AlertTriangle size={16} />
            <span>The Video Converter and PDF Tools are fully operational.</span>
        </div>
      </div>
    </div>
  );
}