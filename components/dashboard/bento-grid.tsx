"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation"; 
import { useFileStore } from "@/hooks/use-file-transfer";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
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
  Video,
  Search,
  Ghost,
  ArrowUpRight
} from "lucide-react";

// --- 1. INTELLIGENT TOOL REGISTRY ---
// We add a 'keywords' array to each tool for "semantic" search
const TOOLS = [
  {
    id: "converter",
    name: "Universal Converter",
    desc: "Convert video, audio, and images locally. Supports MP4, MP3, WAV, GIF, and more.",
    icon: FileVideo,
    route: "video-converter",
    colorClass: "text-orange-500",
    hoverBorderClass: "hover:border-orange-500/30",
    isLarge: true,
    keywords: ["compress", "shrink", "format", "change", "mp4", "mov", "avi", "gif", "webp", "transcode"]
  },
  {
    id: "transcriber",
    name: "Transcriber",
    desc: "Speech to Text via Whisper AI.",
    icon: Mic,
    route: "audio-transcriber",
    colorClass: "text-blue-500",
    hoverBorderClass: "hover:border-blue-500/30",
    keywords: ["subtitles", "captions", "speech", "text", "lyrics", "ai", "whisper", "meeting", "transcribe"]
  },
  {
    id: "pdf",
    name: "PDF Tools",
    desc: "Merge, Split & Compress.",
    icon: FileText,
    route: "pdf-tools",
    colorClass: "text-red-500",
    hoverBorderClass: "hover:border-red-500/30",
    keywords: ["document", "combine", "page", "extract", "zip", "reduce", "size", "merge", "split"]
  },
  {
    id: "magic",
    name: "Magic Remover",
    desc: "Redact & Obfuscate Photos.",
    icon: Wand2,
    route: "magic-remover",
    colorClass: "text-purple-500",
    hoverBorderClass: "hover:border-purple-500/30",
    keywords: ["blur", "pixelate", "hide", "face", "censor", "privacy", "erase", "clean", "redact"]
  },
  {
    id: "vault",
    name: "The Vault",
    desc: "Encryption & Metadata.",
    icon: ShieldAlert,
    route: "vault",
    colorClass: "text-green-500",
    hoverBorderClass: "hover:border-green-500/30",
    keywords: ["lock", "password", "secure", "aes", "protect", "safe", "private", "encrypt", "decrypt"]
  },
  {
    id: "audio",
    name: "Audio Studio",
    desc: "Trim, Denoise & Master.",
    icon: AudioLines,
    route: "audio-cutter",
    colorClass: "text-pink-500",
    hoverBorderClass: "hover:border-pink-500/30",
    keywords: ["cut", "crop", "sound", "music", "waveform", "edit", "volume", "normalize", "mp3"]
  },
  {
    id: "utils",
    name: "Dev Utilities",
    desc: "JSON, Base64, QR Gen.",
    icon: Database,
    route: "utilities",
    colorClass: "text-yellow-500",
    hoverBorderClass: "hover:border-yellow-500/30",
    className: "md:col-span-2",
    keywords: ["developer", "code", "debug", "csv", "wifi", "network", "encode", "decode", "json", "qr"]
  },
  {
    id: "screen",
    name: "Screen Recorder",
    desc: "Capture screen & mic locally.",
    icon: Video,
    route: "screen-recorder",
    colorClass: "text-cyan-500",
    hoverBorderClass: "hover:border-cyan-500/30",
    keywords: ["record", "monitor", "share", "stream", "clip", "meeting", "camera", "capture"]
  },
];

export default function BentoGrid() {
  const router = useRouter();
  const setPreloadedFile = useFileStore((state) => state.setPreloadedFile);
  const [activeDrop, setActiveDrop] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // --- 2. SEARCH LOGIC ---
  const filteredTools = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return TOOLS;

    return TOOLS.filter((tool) => {
      if (tool.name.toLowerCase().includes(q)) return true;
      if (tool.desc.toLowerCase().includes(q)) return true;
      if (tool.keywords.some(k => k.includes(q))) return true; // Intelligent Keyword Match
      return false;
    });
  }, [searchQuery]);

  const handleFileDrop = (e: React.DragEvent, route: string) => {
    e.preventDefault();
    setActiveDrop(null);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      setPreloadedFile(files[0]);
      router.push(`/studio/${route}`);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto h-full pb-10 px-4 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 3. SEARCH BAR UI */}
      <div className="relative max-w-lg mx-auto group">
         <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="text-slate-500 group-focus-within:text-orange-500 transition-colors" size={18} />
         </div>
         <Input 
            placeholder="Search tools (e.g., 'crop audio', 'compress pdf', 'blur face')..." 
            className="pl-10 h-12 bg-slate-900/50 border-slate-800 text-slate-200 focus-visible:ring-orange-500/50 rounded-xl transition-all hover:bg-slate-900"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
         />
         {/* Visual Hint */}
         <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
            <span className="text-[10px] font-mono text-slate-600 border border-slate-800 rounded px-1.5 py-0.5 opacity-50">/</span>
         </div>
      </div>

      {/* 4. GRID RENDER */}
      {filteredTools.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredTools.map((tool) => (
            <div 
              key={tool.id}
              onDragOver={(e) => { e.preventDefault(); setActiveDrop(tool.name); }}
              onDragLeave={() => setActiveDrop(null)}
              onDrop={(e) => handleFileDrop(e, tool.route)}
              onClick={() => router.push(`/studio/${tool.route}`)}
              className={cn(
                "group relative overflow-hidden transition-all duration-500 border rounded-3xl cursor-pointer bg-slate-900/50 border-slate-800 hover:bg-slate-900/80",
                tool.hoverBorderClass,
                activeDrop === tool.name && "scale-[0.98] ring-4 ring-white/10 z-50",
                tool.isLarge ? "p-8 col-span-1 md:col-span-2 lg:col-span-2 row-span-2" : "p-6 col-span-1 row-span-1 flex flex-col justify-between",
                tool.className // Handles span-2 logic for utilities
              )}
            >
              {/* DRAG OVERLAY */}
              {activeDrop === tool.name && (
                <div className="absolute inset-0 z-30 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in zoom-in-95">
                  <UploadCloud className={cn("w-12 h-12 animate-bounce mb-3", tool.colorClass)} />
                  <span className={cn("text-[10px] font-bold uppercase tracking-[0.2em]", tool.colorClass)}>
                    Drop to Process
                  </span>
                </div>
              )}

              {/* CARD HEADER */}
              <div className="flex justify-between items-start relative z-10">
                <div className={cn(
                  "rounded-xl transition-all duration-300",
                  tool.isLarge ? "p-3 bg-orange-500/10" : "p-2.5 bg-slate-800 group-hover:bg-slate-700"
                )}>
                  <tool.icon className={cn(
                    tool.isLarge ? "w-8 h-8" : "w-6 h-6",
                    tool.colorClass,
                    "transition-transform group-hover:scale-110"
                  )} />
                </div>
                <ArrowRight className="w-5 h-5 text-slate-600 -rotate-45 group-hover:rotate-0 group-hover:text-white transition-all duration-300" />
              </div>

              {/* CARD CONTENT */}
              <div className="mt-4 relative z-10">
                <h3 className={cn("font-bold text-slate-100 tracking-tight", tool.isLarge ? "text-2xl" : "text-lg")}>
                  {tool.name}
                </h3>
                <p className={cn("text-slate-500 mt-1 leading-relaxed", tool.isLarge ? "text-sm max-w-xs" : "text-xs")}>
                  {tool.desc}
                </p>
                
                {tool.isLarge && (
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

              {/* GLOW EFFECT (Large Only) */}
              {tool.isLarge && (
                <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-orange-500/10 blur-3xl rounded-full pointer-events-none transition-opacity group-hover:opacity-100 opacity-50" />
              )}
            </div>
          ))}
        </div>
      ) : (
        /* 5. EMPTY STATE */
        <div className="text-center py-20 border border-dashed border-slate-800 rounded-3xl bg-slate-900/20 animate-in zoom-in-95">
            <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-800">
                <Ghost className="text-slate-600" size={32} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No tools found for "{searchQuery}"</h3>
            <p className="text-slate-500 text-sm max-w-xs mx-auto mb-6">
                Our "Bunker Mode" doesn't have that feature yet. Try searching for "converter" or "recorder".
            </p>
            <button 
                onClick={() => setSearchQuery("")}
                className="text-orange-500 hover:text-orange-400 text-xs font-bold uppercase tracking-widest border-b border-orange-500/20 hover:border-orange-500 transition-all"
            >
                Clear Search
            </button>
        </div>
      )}
    </div>
  );
}