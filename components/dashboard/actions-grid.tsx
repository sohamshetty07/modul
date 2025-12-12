"use client";

import { Search, Video, FileText, Sparkles, Music, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

// FIX 1: Explicitly define the Tool structure
interface Tool {
    id: string;
    title: string;
    desc: string;
    icon: React.ReactNode;
    keywords: string[];
    disabled?: boolean; // Optional property
}

interface ActionsGridProps {
  onSelectTool: (tool: string) => void;
}

export default function ActionsGrid({ onSelectTool }: ActionsGridProps) {
  const [query, setQuery] = useState("");

  const tools: Tool[] = [
    {
      id: "convert",
      title: "Universal Converter",
      desc: "Convert Video, Audio, Images & PDFs.",
      icon: <Video className="text-orange-500" />,
      keywords: ["convert", "mp4", "mp3", "mov", "pdf", "change", "format"]
    },
    {
      id: "remove-bg",
      title: "Magic Remover",
      desc: "Remove backgrounds locally using AI.",
      icon: <Sparkles className="text-purple-500" />,
      keywords: ["remove", "background", "ai", "transparent", "cutout", "delete"]
    },
    {
      id: "transcribe",
      title: "Audio Transcriber",
      desc: "Turn speech into text instantly.",
      icon: <Music className="text-blue-500" />,
      keywords: ["transcribe", "text", "speech", "audio"]
    },
    {
      id: "pdf-tools",
      title: "PDF Tools",
      desc: "Merge, Split & Sign PDFs.",
      icon: <FileText className="text-red-500" />,
      keywords: ["pdf", "merge", "split", "sign"]
    }
  ];

  const filteredTools = tools.filter(t => 
      t.title.toLowerCase().includes(query.toLowerCase()) || 
      t.desc.toLowerCase().includes(query.toLowerCase()) ||
      t.keywords.some(k => k.includes(query.toLowerCase()))
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      <div className="relative max-w-2xl mx-auto group">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-purple-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all opacity-50" />
        <div className="relative flex items-center bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-2 shadow-2xl">
            <Search className="ml-4 text-slate-500" />
            <Input 
                className="border-none bg-transparent text-lg h-12 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-slate-500 w-full text-white"
                placeholder="What do you want to do? (e.g. 'Remove background')" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
            />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
         {filteredTools.map((tool) => (
             <div 
                key={tool.id}
                onClick={() => !tool.disabled && onSelectTool(tool.id)}
                className={`group p-6 rounded-3xl border border-slate-800 bg-slate-900/40 hover:bg-slate-800/60 transition-all cursor-pointer flex items-center gap-6
                    ${tool.disabled ? "opacity-50 grayscale cursor-not-allowed" : "hover:scale-[1.02] hover:shadow-xl hover:shadow-orange-500/5 hover:border-slate-700"}
                `}
             >
                <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center shadow-inner">
                    {tool.icon}
                </div>
                <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-200 group-hover:text-white transition-colors flex items-center gap-2">
                        {tool.title}
                        {tool.disabled && <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full text-slate-500">Soon</span>}
                    </h3>
                    <p className="text-sm text-slate-500 group-hover:text-slate-400">
                        {tool.desc}
                    </p>
                </div>
                {!tool.disabled && (
                    <ArrowRight className="text-slate-600 group-hover:text-orange-500 transform group-hover:translate-x-1 transition-all" />
                )}
             </div>
         ))}
      </div>
    </div>
  );
}