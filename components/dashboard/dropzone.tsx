"use client";

import { useState, useCallback } from "react";
import { useDropzone, Accept } from "react-dropzone"; 
import { CloudUpload, FileUp, Music, Video, Image as ImageIcon, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface DropzoneProps {
  onFilesDropped: (files: File[]) => void;
  accept?: Accept; 
}

export default function Dropzone({ onFilesDropped, accept }: DropzoneProps) {
  const [isHovering, setIsHovering] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFilesDropped(acceptedFiles);
      toast({
        title: "Files received",
        description: `Ready to process ${acceptedFiles.length} file(s).`,
      });
    }
  }, [onFilesDropped]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDragEnter: () => setIsHovering(true),
    onDragLeave: () => setIsHovering(false),
    onDropAccepted: () => setIsHovering(false),
    // FIX: Added 'application/pdf' to the default fallback
    accept: accept || {
      'image/*': ['.jpeg', '.png', '.jpg', '.webp', '.gif'],
      'video/*': ['.mp4', '.mov', '.mkv', '.webm'],
      'audio/*': ['.mp3', '.wav', '.aac', '.m4a'],
      'application/pdf': ['.pdf'] 
    }
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative group cursor-pointer w-full max-w-2xl mx-auto h-64 rounded-3xl border-2 border-dashed transition-all duration-300 ease-in-out animate-in fade-in zoom-in-95",
        isDragActive
          ? "border-orange-500 bg-orange-500/10 scale-[1.02]"
          : "border-slate-700 bg-slate-900/50 hover:bg-slate-800/50 hover:border-slate-600"
      )}
    >
      <input {...getInputProps()} />
      
      <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 text-center p-6">
        {/* Animated Icon Container */}
        <div className={cn(
          "p-4 rounded-full transition-all duration-300 shadow-xl",
          isDragActive ? "bg-orange-500 text-white animate-bounce" : "bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-white"
        )}>
           {isDragActive ? <FileUp size={40} /> : <CloudUpload size={40} />}
        </div>

        <div className="space-y-1">
          <h3 className={cn("text-xl font-bold transition-colors tracking-tight", isDragActive ? "text-orange-500" : "text-slate-200")}>
            {isDragActive ? "Drop to upload!" : "Drag & Drop files here"}
          </h3>
          <p className="text-sm text-slate-500 font-medium">
            or click to select files
          </p>
        </div>

        {/* Supported Types Badges */}
        <div className="flex flex-wrap justify-center gap-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-4 opacity-60 group-hover:opacity-100 transition-opacity">
           {/* DEFAULT MODE: Show all Universal Types */}
           {!accept && (
             <>
                <span className="flex items-center gap-1.5 bg-slate-800/50 px-2 py-1 rounded"><Video size={12} /> Video</span>
                <span className="flex items-center gap-1.5 bg-slate-800/50 px-2 py-1 rounded"><Music size={12} /> Audio</span>
                <span className="flex items-center gap-1.5 bg-slate-800/50 px-2 py-1 rounded"><ImageIcon size={12} /> Image</span>
                <span className="flex items-center gap-1.5 bg-slate-800/50 px-2 py-1 rounded"><FileText size={12} /> PDF</span>
             </>
           )}

           {/* CUSTOM MODE: Hints based on props */}
           {accept && Object.keys(accept).some(k => k.includes('audio')) && (
               <span className="flex items-center gap-1.5 text-pink-500"><Music size={12} /> Audio Only</span>
           )}
           {accept && Object.keys(accept).some(k => k.includes('image')) && !Object.keys(accept).some(k => k.includes('audio')) && (
               <span className="flex items-center gap-1.5 text-blue-500"><ImageIcon size={12} /> Images Only</span>
           )}
           {accept && Object.keys(accept).some(k => k.includes('pdf')) && (
               <span className="flex items-center gap-1.5 text-red-500"><FileText size={12} /> PDF</span>
           )}
        </div>
      </div>
    </div>
  );
}