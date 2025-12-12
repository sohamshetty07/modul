"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { CloudUpload, FileUp, Music, Video, Image as ImageIcon, FileType } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast"; // Ensure this path matches where Shadcn put the toast hook

interface DropzoneProps {
  onFilesDropped: (files: File[]) => void;
}

export default function Dropzone({ onFilesDropped }: DropzoneProps) {
  const [isHovering, setIsHovering] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFilesDropped(acceptedFiles);
      toast({
        title: "Files received",
        description: `Ready to convert ${acceptedFiles.length} files.`,
      });
    }
  }, [onFilesDropped]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDragEnter: () => setIsHovering(true),
    onDragLeave: () => setIsHovering(false),
    onDropAccepted: () => setIsHovering(false),
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative group cursor-pointer w-full max-w-2xl mx-auto h-64 rounded-3xl border-2 border-dashed transition-all duration-300 ease-in-out",
        isDragActive
          ? "border-orange-500 bg-orange-500/10 scale-105"
          : "border-slate-700 bg-slate-900/50 hover:bg-slate-800/50"
      )}
    >
      <input {...getInputProps()} />
      
      <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 text-center p-6">
        {/* Animated Icon Container */}
        <div className={cn(
          "p-4 rounded-full transition-all duration-300",
          isDragActive ? "bg-orange-500 text-white animate-bounce" : "bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-white"
        )}>
           {isDragActive ? <FileUp size={40} /> : <CloudUpload size={40} />}
        </div>

        <div className="space-y-1">
          <h3 className={cn("text-xl font-bold transition-colors", isDragActive ? "text-orange-500" : "text-slate-200")}>
            {isDragActive ? "Drop it like it's hot!" : "Drag & Drop files here"}
          </h3>
          <p className="text-sm text-slate-400">
            or click to select files
          </p>
        </div>

        {/* Supported Types Badges */}
        <div className="flex gap-3 text-xs text-slate-500 mt-4 opacity-60 group-hover:opacity-100 transition-opacity">
           <span className="flex items-center gap-1"><Video size={14} /> Video</span>
           <span className="flex items-center gap-1"><ImageIcon size={14} /> Image</span>
           <span className="flex items-center gap-1"><Music size={14} /> Audio</span>
        </div>
      </div>
    </div>
  );
}