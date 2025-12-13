"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Cpu, Lock, Layers, Zap, Code2 } from "lucide-react";

export default function TechModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 h-9 text-xs text-slate-400 hover:text-white hover:bg-white/10">
          <Code2 size={14} /> How it works
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-950 border-slate-800 text-slate-200 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
            <Cpu className="text-orange-500" /> Under the Hood
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          <p className="text-slate-400 leading-relaxed">
            Modul. Studio is a <strong>Serverless Application</strong>. Unlike traditional tools that upload your files to a cloud server for processing, Modul brings the server logic <em>to your browser</em>.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            {/* CARD 1: FFmpeg */}
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-blue-400 font-medium">
                    <Layers size={18} />
                    <span>The Engine: FFmpeg.wasm</span>
                </div>
                <p className="text-xs text-slate-500 leading-5">
                    We compile the industry-standard FFmpeg library to <strong>WebAssembly (WASM)</strong>. This allows your browser to decode, re-encode, and manipulate video/audio binary data at near-native speeds directly in V8.
                </p>
            </div>

            {/* CARD 2: AI */}
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-purple-400 font-medium">
                    <Zap size={18} />
                    <span>The Brain: ONNX Runtime</span>
                </div>
                <p className="text-xs text-slate-500 leading-5">
                    For AI tasks (transcription & background removal), we use <strong>Transformers.js</strong>. We load quantized ONNX models (Whisper & RMBG) directly into your device's memory, utilizing WebGL acceleration where available.
                </p>
            </div>
          </div>

          {/* PRIVACY SECTION */}
          <div className="p-4 rounded-xl border border-green-900/30 bg-green-900/10 space-y-2">
              <div className="flex items-center gap-2 text-green-400 font-medium">
                  <Lock size={18} />
                  <span>The Privacy Architecture</span>
              </div>
              <ul className="text-xs text-slate-400 space-y-1 list-disc pl-4">
                  <li>Your files never leave the <code>localhost</code> environment.</li>
                  <li>All heavy processing runs in isolated <strong>WebWorkers</strong> to prevent UI freezing.</li>
                  <li>External network requests are strictly limited to downloading the AI models (once) and CDN assets.</li>
              </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}