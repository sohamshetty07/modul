"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Download, Loader2, Sparkles, Layers, Pencil, Check, Copy, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast"; 
// We import the config type if available, or just use any to avoid TS hassle with the library
import type { Config } from "@imgly/background-removal";

export default function BgRemover() {
  const [file, setFile] = useState<File | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusText, setStatusText] = useState("");
  
  const [fileNameDisplay, setFileNameDisplay] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  // Note: We don't strictly need state for baseUrl if we access window inside the handler, 
  // but it's fine to keep if you use it elsewhere.

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const f = acceptedFiles[0];
      setFile(f);
      setProcessedImage(null);
      setProcessedBlob(null);
      setError(null);
      setFileNameDisplay(`nobg-${f.name.substring(0, f.name.lastIndexOf('.')) || f.name}.png`);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1
  });

  const handleRemoveBg = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    setStatusText("Initializing Engine...");

    try {
      const imgly = await import("@imgly/background-removal");
      
      let runModel = imgly.default;
      // @ts-ignore
      if (typeof runModel !== 'function') runModel = imgly.removeBackground;
      if (typeof runModel !== 'function') runModel = imgly;

      const config: Config = {
        // FIXED: Point to 'latest' so we get the missing 'resources.json' file
        publicPath: 'https://cdn.jsdelivr.net/npm/@imgly/background-removal-data@latest/dist/',
        
        progress: (key: string, current: number, total: number) => {
             const percent = total > 0 ? Math.round((current / total) * 100) : 0;
             setStatusText(`Downloading AI ${percent}%`);
        },
        
        debug: true,
        device: 'cpu',
        model: 'isnet_fp16'
      };

      // @ts-ignore
      const blob = await runModel(file, config);
      const url = URL.createObjectURL(blob);
      
      setProcessedImage(url);
      setProcessedBlob(blob); 
      setStatusText("Done!");
    } catch (err: any) {
      console.error("Full Error Object:", err);
      setError(`Processing Failed: ${err.message || "Check console"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (processedImage) {
      const a = document.createElement("a");
      a.href = processedImage;
      a.download = fileNameDisplay;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleCopy = async () => {
    if (!processedBlob) return; 
    try {
        await navigator.clipboard.write([
            new ClipboardItem({ [processedBlob.type]: processedBlob })
        ]);
        toast({ title: "Copied!", className: "bg-green-600 text-white border-none" });
    } catch (err) {
        console.error(err);
        toast({ title: "Copy failed", description: "Use download instead.", variant: "destructive" });
    }
  };

  const resetAll = () => {
      setFile(null);
      setProcessedImage(null);
      setProcessedBlob(null);
      setError(null);
      setStatusText("");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="text-center space-y-2">
           <h2 className="text-3xl font-bold text-white flex items-center justify-center gap-2">
               <Sparkles className="text-purple-500" /> 
               Magic Remover
           </h2>
           <p className="text-slate-400">Remove backgrounds instantly (Local Mode).</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-start">
          <div className="space-y-4">
             <div 
                {...getRootProps()} 
                className={`relative h-80 rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center cursor-pointer overflow-hidden
                    ${isDragActive ? "border-purple-500 bg-purple-500/10" : "border-slate-800 bg-slate-900/50 hover:bg-slate-800/50"}
                `}
             >
                <input {...getInputProps()} />
                {file ? (
                    <img src={URL.createObjectURL(file)} alt="Original" className="w-full h-full object-contain p-4"/>
                ) : (
                    <div className="space-y-4 p-6">
                        <div className="w-16 h-16 mx-auto bg-slate-800 rounded-2xl flex items-center justify-center">
                            <Upload className="text-slate-400" size={32} />
                        </div>
                        <div>
                            <p className="text-lg font-medium text-slate-200">Drop an image</p>
                            <p className="text-sm text-slate-500">JPG, PNG, WEBP</p>
                        </div>
                    </div>
                )}
                {file && !isProcessing && (
                    <button onClick={(e) => { e.stopPropagation(); resetAll(); }} className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-red-500/50 rounded-full text-white transition-colors">
                        <X size={16} />
                    </button>
                )}
             </div>

             {file && !processedImage && (
                 <Button onClick={handleRemoveBg} disabled={isProcessing} className="w-full bg-purple-600 hover:bg-purple-500 h-12 text-lg font-medium">
                    {isProcessing ? (
                        <span className="flex items-center gap-2">
                            <Loader2 className="animate-spin" /> {statusText}
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            <Sparkles size={18} /> Remove Background
                        </span>
                    )}
                 </Button>
             )}
             {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          </div>

          <div className="space-y-4">
            <div className={`relative h-80 rounded-3xl border-2 transition-all flex flex-col items-center justify-center overflow-hidden
                ${processedImage ? "border-green-500/50 bg-[url('https://media.discordapp.net/attachments/1008571060670967858/1129424751417536552/transparent-pattern.png?width=400&height=400')] bg-repeat" : "border-slate-800 bg-slate-900/20 border-dashed"}
            `}>
                {processedImage ? (
                    <img src={processedImage} alt="Processed" className="relative z-10 w-full h-full object-contain p-4 animate-in zoom-in-50 duration-500"/>
                ) : (
                    <div className="text-center text-slate-600 space-y-2">
                        <Layers size={48} className="mx-auto opacity-50" />
                        <p>Result will appear here</p>
                    </div>
                )}
            </div>
            {processedImage && (
                <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 space-y-4 animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-2">
                        {isRenaming ? (
                            <div className="flex items-center gap-2 flex-1">
                                <Input value={fileNameDisplay} onChange={(e) => setFileNameDisplay(e.target.value)} className="h-8 text-sm bg-slate-950 border-slate-700 text-white" autoFocus/>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500" onClick={() => setIsRenaming(false)}><Check size={16} /></Button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 flex-1 group">
                                <span className="text-slate-300 font-medium truncate max-w-[200px]" title={fileNameDisplay}>{fileNameDisplay}</span>
                                <button onClick={() => setIsRenaming(true)} className="text-slate-500 hover:text-orange-500 p-1"><Pencil size={14} /></button>
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <Button onClick={handleCopy} variant="secondary" className="bg-slate-800 text-slate-200 hover:bg-slate-700"><Copy size={16} className="mr-2" /> Copy</Button>
                        <Button onClick={handleDownload} className="bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20"><Download size={16} className="mr-2" /> Download</Button>
                    </div>
                    <Button onClick={resetAll} variant="ghost" className="w-full text-slate-500 hover:text-red-400 text-xs h-8"><RefreshCw size={12} className="mr-2" /> Process Another Image</Button>
                </div>
            )}
          </div>
      </div>
    </div>
  );
}