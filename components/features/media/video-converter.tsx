"use client";

import { useState, useEffect, useRef } from "react";
import Dropzone from "@/components/dashboard/dropzone";
import FileCard from "@/components/dashboard/file-card";
import { Button } from "@/components/ui/button";
import { useConversion } from "@/hooks/use-conversion";
import { useFileStore } from "@/hooks/use-file-transfer";

interface VideoConverterProps {
  initialFile?: File | null;
}

export default function VideoConverter({ initialFile }: VideoConverterProps) {
  const [files, setFiles] = useState<File[]>([]);
  const setPreloadedFile = useFileStore((state) => state.setPreloadedFile);
  const conversion = useConversion(); 
  
  // Track if we have handled this specific file instance
  const handledFileRef = useRef<File | null>(null);

  useEffect(() => {
    if (initialFile && handledFileRef.current !== initialFile) {
      // 1. Mark this specific file object as handled immediately
      handledFileRef.current = initialFile;

      // 2. Add to state ONLY if it doesn't already exist (Double Check)
      setFiles((prev) => {
        const exists = prev.some(f => f.name === initialFile.name && f.size === initialFile.size);
        if (exists) return prev;
        return [...prev, initialFile];
      });
      
      // 3. Clear global store
      setPreloadedFile(null);
    }
  }, [initialFile, setPreloadedFile]);

  const handleFilesDropped = (newFiles: File[]) => {
    setFiles((prev) => {
      // Prevent duplicates from manual drops too
      const uniqueNew = newFiles.filter(nf => !prev.some(pf => pf.name === nf.name));
      return [...prev, ...uniqueNew];
    });
  };

  const handleRemove = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    // Reset ref if queue becomes empty to allow re-adding same file
    if (files.length <= 1) handledFileRef.current = null;
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-white tracking-tight">Universal Converter</h2>
        <p className="text-slate-400 text-sm">Convert Video, Audio, and Images locally.</p>
      </div>

      <Dropzone onFilesDropped={handleFilesDropped} />

      {files.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white tracking-tight">Your Queue ({files.length})</h2>
            <Button
              variant="ghost"
              onClick={() => { setFiles([]); handledFileRef.current = null; }}
              className="text-red-400 hover:text-red-300 h-8 text-xs hover:bg-red-950/30 font-bold uppercase tracking-widest"
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
                onConvert={(format, settings) => conversion.convertFile(file, format, settings)}
                status={conversion.status} 
                progress={conversion.progress}
                downloadUrl={conversion.downloadUrl}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}