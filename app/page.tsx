"use client";

import { useState } from "react";
import Dropzone from "@/components/dashboard/dropzone";
import FileCard from "@/components/dashboard/file-card";
import BgRemover from "@/components/tools/bg-remover"; 
import Transcriber from "@/components/tools/transcriber";
import PDFTools from "@/components/tools/pdf-tools";
import ActionsGrid from "@/components/dashboard/actions-grid"; 
import Hero from "@/components/dashboard/hero"; // Ensure this file exists
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function Home() {
  const [view, setView] = useState("home"); // 'home' | 'convert' | 'remove-bg' | 'transcribe' | 'pdf-tools'
  const [files, setFiles] = useState<File[]>([]);

  // Universal Converter State Logic
  const handleFilesDropped = (newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleRemove = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const goHome = () => {
      setView("home");
      setFiles([]); // Clear converter files when leaving
  };

  return (
    <main className="min-h-screen bg-black text-slate-200 font-sans selection:bg-orange-500/30 pb-20 flex flex-col">
      
      {/* 1. GLOBAL NAVBAR */}
      <nav className="p-6 flex justify-between items-center max-w-6xl mx-auto w-full border-b border-white/5 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div 
            className="font-bold text-xl tracking-tighter flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={goHome}
        >
            Modul<span className="text-orange-500">.</span>
        </div>
        <div className="flex items-center gap-4">
             {view !== 'home' && (
                 <Button onClick={goHome} variant="ghost" className="h-8 text-slate-400 hover:text-white">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Studio
                 </Button>
             )}
             <div className="text-xs font-mono text-slate-600 border border-slate-800 px-2 py-1 rounded hidden sm:block">
                 v1.0.0
             </div>
        </div>
      </nav>

      {/* 2. MAIN CONTENT AREA */}
      <div className="max-w-5xl mx-auto px-4 w-full flex-1">
        
        {/* VIEW 1: HOME (LANDING PAGE) */}
        {view === 'home' && (
            <div className="space-y-12">
                <Hero />
                <div id="tools" className="scroll-mt-24">
                    <ActionsGrid onSelectTool={setView} />
                </div>
            </div>
        )}

        {/* VIEW 2: UNIVERSAL CONVERTER (Custom Logic) */}
        {view === 'convert' && (
            <div className="space-y-8 py-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center space-y-2">
                    <h2 className="text-3xl font-bold text-white">Universal Converter</h2>
                    <p className="text-slate-400">Convert Video, Audio, and Images locally.</p>
                </div>
                
                <Dropzone onFilesDropped={handleFilesDropped} />

                {files.length > 0 && (
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">Your Queue ({files.length})</h2>
                            <Button 
                                variant="ghost" 
                                onClick={() => setFiles([])}
                                className="text-red-400 hover:text-red-300 h-8 text-xs hover:bg-red-950/30"
                            >
                            Clear All
                            </Button>
                        </div>
                        <div className="grid gap-3">
                            {files.map((file, i) => (
                            <FileCard 
                                key={`${file.name}-${i}`} 
                                file={file} 
                                onRemove={() => handleRemove(i)}
                            />
                            ))}
                        </div>
                    </section>
                )}
            </div>
        )}

        {/* VIEW 3: BG REMOVER */}
        {view === 'remove-bg' && (
            <div className="py-10">
                <BgRemover />
            </div>
        )}

        {/* VIEW 4: TRANSCRIBER */}
        {view === 'transcribe' && (
            <div className="py-10">
                <Transcriber />
            </div>
        )}

        {/* VIEW 5: PDF TOOLS */}
        {view === 'pdf-tools' && (
            <div className="py-10">
                <PDFTools />
            </div>
        )}

      </div>

      {/* 3. GLOBAL FOOTER (Trust Badge) */}
      <footer className="mt-20 py-10 border-t border-slate-900 text-center space-y-4 bg-black">
            <p className="text-slate-500 text-sm">
                Built with Next.js, FFmpeg.wasm & Transformers.js
            </p>
            <p className="text-slate-600 text-xs max-w-md mx-auto px-4">
                Modul. does not collect any file data. All processing is performed locally on your device's hardware.
            </p>
      </footer>
    </main>
  );
}