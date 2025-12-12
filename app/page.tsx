"use client";

import { useState } from "react";
import Dropzone from "@/components/dashboard/dropzone";
import FileCard from "@/components/dashboard/file-card";
import BgRemover from "@/components/tools/bg-remover"; 
import Transcriber from "@/components/tools/transcriber";
import PDFTools from "@/components/tools/pdf-tools";
import ActionsGrid from "@/components/dashboard/actions-grid"; // Import new component
import { Button } from "@/components/ui/button";
import { ArrowLeft, Layers } from "lucide-react";

export default function Home() {
  const [view, setView] = useState("home"); // 'home' | 'convert' | 'remove-bg'
  const [files, setFiles] = useState<File[]>([]);

  const handleFilesDropped = (newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleRemove = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Back Button Logic
  const goHome = () => {
      setView("home");
      setFiles([]); // Optional: Clear files when going back? Up to you.
  };

  return (
    <main className="min-h-screen bg-black text-slate-200 font-sans selection:bg-orange-500/30 pb-20">
      
      {/* 1. Modul Header */}
      <div className={`transition-all duration-700 ${view === 'home' ? 'pt-24 pb-12' : 'pt-8 pb-8'}`}>
        <div className="text-center space-y-4">
            <h1 
                className={`font-extrabold tracking-tight text-white cursor-pointer transition-all duration-700
                    ${view === 'home' ? 'text-6xl md:text-8xl' : 'text-3xl'}
                `}
                onClick={goHome}
            >
            Modul<span className="text-orange-500">.</span>
            </h1>
            
            {view === 'home' && (
                <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-100">
                    The privacy-first media studio. Run entirely on your device.
                </p>
            )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4">
        
        {/* VIEW 1: HOME (COMMAND CENTER) */}
        {view === 'home' && (
            <ActionsGrid onSelectTool={setView} />
        )}

        {/* VIEW 2: UNIVERSAL CONVERTER */}
        {view === 'convert' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500">
                <div className="flex items-center gap-4">
                    <Button onClick={goHome} variant="ghost" className="text-slate-500 hover:text-white">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Studio
                    </Button>
                </div>
                
                <Dropzone onFilesDropped={handleFilesDropped} />

                {files.length > 0 && (
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">Your Queue ({files.length})</h2>
                            <Button 
                                variant="ghost" 
                                onClick={() => setFiles([])}
                                className="text-red-400 hover:text-red-300 h-8 text-xs"
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
            <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500">
                 <div className="flex items-center gap-4">
                    <Button onClick={goHome} variant="ghost" className="text-slate-500 hover:text-white">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Studio
                    </Button>
                </div>
                <BgRemover />
            </div>
        )}

        {/* VIEW 4: TRANSCRIBER */}
        {view === 'transcribe' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500">
                 <div className="flex items-center gap-4">
                    <Button onClick={goHome} variant="ghost" className="text-slate-500 hover:text-white">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Studio
                    </Button>
                </div>
                <Transcriber />
            </div>
        )}

        {/* VIEW 5: PDF TOOLS */}
        {view === 'pdf-tools' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500">
                 <div className="flex items-center gap-4">
                    <Button onClick={goHome} variant="ghost" className="text-slate-500 hover:text-white">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Studio
                    </Button>
                </div>
                <PDFTools />
            </div>
        )}

      </div>
    </main>
  );
}