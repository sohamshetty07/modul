"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"; 
import { useFileStore } from "@/hooks/use-file-transfer";
import { cn } from "@/lib/utils";
import { 
  FileVideo, 
  FileText, 
  Mic, 
  Wand2, 
  ShieldAlert, 
  Database,
  ArrowRight,
  AudioLines,
  UploadCloud,
  Video
} from "lucide-react";

interface ToolCardProps {
  name: string;
  desc: string;
  icon: any;
  route: string;
  colorClass: string;      
  hoverBorderClass: string; 
  className?: string;
  isLarge?: boolean;
  tag?: string;
  disabled?: boolean;
}

export default function BentoGrid() {
  const router = useRouter();
  const setPreloadedFile = useFileStore((state) => state.setPreloadedFile);
  const [activeDrop, setActiveDrop] = useState<string | null>(null);

  const handleFileDrop = (e: React.DragEvent, route: string) => {
    e.preventDefault();
    setActiveDrop(null);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      // 1. Pass the dropped file to global state
      setPreloadedFile(files[0]);
      // 2. Redirect to the tool immediately
      router.push(`/studio/${route}`);
    }
  };

  const ToolCard = ({ 
    name, desc, icon: Icon, route, colorClass, hoverBorderClass, 
    className, isLarge, tag, disabled 
  }: ToolCardProps) => (
    <div 
      onDragOver={(e) => { e.preventDefault(); !disabled && setActiveDrop(name); }}
      onDragLeave={() => setActiveDrop(null)}
      onDrop={(e) => !disabled && handleFileDrop(e, route)}
      onClick={() => !disabled && router.push(`/studio/${route}`)}
      className={cn(
        "group relative overflow-hidden transition-all duration-500 border rounded-3xl cursor-pointer",
        disabled ? "bg-slate-950/30 border-slate-800/50 cursor-not-allowed" : "bg-slate-900/50 border-slate-800 hover:bg-slate-900/80",
        !disabled && hoverBorderClass,
        activeDrop === name && "scale-[0.98] ring-4 ring-white/10 z-50",
        isLarge ? "p-8 col-span-1 md:col-span-2 lg:col-span-2 row-span-2" : "p-6 col-span-1 row-span-1 flex flex-col justify-between",
        className
      )}
    >
      {/* 1. DRAG OVERLAY */}
      {activeDrop === name && (
        <div className="absolute inset-0 z-30 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in zoom-in-95">
          <UploadCloud className={cn("w-12 h-12 animate-bounce mb-3", colorClass)} />
          <span className={cn("text-[10px] font-bold uppercase tracking-[0.2em]", colorClass)}>
            Drop to Process
          </span>
        </div>
      )}

      {/* 2. HEADER & ICON */}
      <div className="flex justify-between items-start relative z-10">
        <div className={cn(
          "rounded-xl transition-all duration-300",
          isLarge ? "p-3 bg-orange-500/10" : "p-2.5 bg-slate-800 group-hover:bg-slate-700"
        )}>
          <Icon className={cn(
            isLarge ? "w-8 h-8" : "w-6 h-6",
            colorClass,
            "transition-transform group-hover:scale-110"
          )} />
        </div>
        {!disabled && (
          <ArrowRight className="w-5 h-5 text-slate-600 -rotate-45 group-hover:rotate-0 group-hover:text-white transition-all duration-300" />
        )}
        {tag && (
          <span className="text-[10px] font-mono text-slate-700 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            {tag}
          </span>
        )}
      </div>

      {/* 3. CONTENT */}
      <div className="mt-4 relative z-10">
        <h3 className={cn("font-bold text-slate-100 tracking-tight", isLarge ? "text-2xl" : "text-lg")}>
          {name}
        </h3>
        <p className={cn("text-slate-500 mt-1 leading-relaxed", isLarge ? "text-sm max-w-xs" : "text-xs")}>
          {desc}
        </p>
        
        {isLarge && (
          <div className="flex gap-2 mt-8">
            <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-2.5 py-1 rounded-lg border border-slate-700">
              FFMPEG.WASM
            </span>
            <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-2.5 py-1 rounded-lg border border-slate-700">
              LOCAL-ONLY
            </span>
          </div>
        )}
      </div>

      {/* Background Glow */}
      {isLarge && (
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-orange-500/10 blur-3xl rounded-full pointer-events-none transition-opacity group-hover:opacity-100 opacity-50" />
      )}
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full max-w-7xl mx-auto h-full pb-10 px-4">
      {/* Row 1 & 2 Left */}
      <ToolCard 
        name="Universal Converter" 
        desc="Convert video, audio, and images locally. Supports MP4, MP3, WAV, GIF, and more." 
        icon={FileVideo} 
        route="video-converter" 
        colorClass="text-orange-500"
        hoverBorderClass="hover:border-orange-500/30"
        isLarge 
      />
      
      {/* Tools Grid */}
      <ToolCard 
        name="Transcriber" desc="Speech to Text via Whisper AI." 
        icon={Mic} route="audio-transcriber" 
        colorClass="text-blue-500"
        hoverBorderClass="hover:border-blue-500/30"
      />
      <ToolCard 
        name="PDF Tools" desc="Merge, Split & Compress." 
        icon={FileText} route="pdf-tools" 
        colorClass="text-red-500"
        hoverBorderClass="hover:border-red-500/30"
      />
      <ToolCard 
        name="Magic Remover" desc="Redact & Obfuscate Photos." 
        icon={Wand2} route="magic-remover" 
        colorClass="text-purple-500"
        hoverBorderClass="hover:border-purple-500/30"
      />
      <ToolCard 
        name="The Vault" desc="Encryption & Metadata." 
        icon={ShieldAlert} route="vault" 
        colorClass="text-green-500"
        hoverBorderClass="hover:border-green-500/30"
      />
      <ToolCard 
        name="Audio Studio" desc="Trim, Denoise & Master." 
        icon={AudioLines} route="audio-cutter" 
        colorClass="text-pink-500"
        hoverBorderClass="hover:border-pink-500/30"
      />

      {/* Utility Module - NOW ENABLED */}
      <ToolCard 
        name="Dev Utilities" 
        desc="JSON, Base64, QR Gen." 
        icon={Database} 
        route="utilities" 
        className="md:col-span-2" 
        // Disabled tag removed
        // Color opacity removed
        colorClass="text-yellow-500"
        hoverBorderClass="hover:border-yellow-500/30"
        // Disabled prop removed
      />
      {/* NEW: Screen Recorder */}
      <ToolCard 
        name="Screen Recorder" 
        desc="Capture screen & mic locally." 
        icon={Video} // Import { Video } from 'lucide-react'
        route="screen-recorder" 
        colorClass="text-cyan-500"
        hoverBorderClass="hover:border-cyan-500/30"
      />
    </div>
  );
}