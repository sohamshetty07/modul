"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { 
    FileText, 
    Trash2, 
    Layers, 
    GripVertical, 
    Pencil, 
    GripHorizontal,
    Check, 
    X, 
    Plus, 
    CheckSquare, 
    Square, 
    MoveUp, 
    MoveDown,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { PDFDocument } from "pdf-lib";
import { jsPDF } from "jspdf";
import JSZip from "jszip";
import { toast } from "@/hooks/use-toast";
import { formatBytes } from "@/core/utils";
import { useFileStore } from "@/hooks/use-file-transfer";

// Interfaces
interface PDFPage {
    index: number;
    url: string;
    selected: boolean;
}

interface ManagedFile {
    id: string; 
    file: File;
    selected: boolean; 
}

interface PDFToolsProps {
  initialFile?: File | null;
}

export default function PDFTools({ initialFile }: PDFToolsProps) {
  const [activeTool, setActiveTool] = useState("merge");
  const [files, setFiles] = useState<ManagedFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const setPreloadedFile = useFileStore((state) => state.setPreloadedFile);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const [outputName, setOutputName] = useState("document");
  const [compressionQuality, setCompressionQuality] = useState(70); 
  const [splitPages, setSplitPages] = useState<PDFPage[]>([]);

  // 1. THE CATCHER LOGIC
  useEffect(() => {
    if (initialFile && initialFile.type === 'application/pdf') {
        const id = Math.random().toString(36).substr(2, 9);
        const newManagedFile = {
            id,
            file: initialFile,
            selected: true
        };

        setFiles((prev) => {
            const combined = [...prev, newManagedFile];
            if (prev.length === 0) {
                setActiveFileId(id);
                const baseName = initialFile.name.substring(0, initialFile.name.lastIndexOf('.'));
                setOutputName(activeTool === 'merge' ? "merged-document" : baseName);
            }
            return combined;
        });

        setPreloadedFile(null);
        
        toast({ 
            title: "PDF Loaded", 
            description: "Bunker Mode: Processing locally." 
        });
    }
  }, [initialFile, setPreloadedFile, activeTool]);

  const getActiveFile = () => files.find(f => f.id === activeFileId)?.file || null;
  const getSelectedFiles = () => files.filter(f => f.selected);

  const getPredictedSize = () => {
      const selected = getSelectedFiles();
      if (selected.length === 0) return "0 KB";
      const totalSize = selected.reduce((acc, f) => acc + f.file.size, 0);
      const ratio = 0.2 + (0.8 * Math.pow(compressionQuality / 100, 2));
      return formatBytes(totalSize * ratio);
  };

  // --- UPDATED: BUNKER MODE LOADER ---
  // Now loads from your local /public/libs folder instead of CDN
  const loadPdfJs = async () => {
    if ((window as any).pdfjsLib) return (window as any).pdfjsLib;
    
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        // CHANGE 1: Local path
        script.src = '/libs/pdf.min.js'; 
        
        script.onload = () => {
            const lib = (window as any).pdfjsLib;
            // CHANGE 2: Local worker path
            lib.GlobalWorkerOptions.workerSrc = '/libs/pdf.worker.min.js';
            resolve(lib);
        };
        
        script.onerror = () => {
            console.error("PDF Engine load failed. Check public/libs folder.");
            reject(new Error("Failed to load local PDF engine"));
        };
        
        document.head.appendChild(script);
    });
  };

  const generateThumbnails = useCallback(async (file: File) => {
    if (!file) return;
    setSplitPages([]); 
    try {
        const pdfjsLib = await loadPdfJs();
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        const totalPages = pdf.numPages;
        const pageList: PDFPage[] = [];

        for (let i = 1; i <= totalPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 0.3 }); 
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            // @ts-ignore
            await page.render({ canvasContext: ctx, viewport }).promise;
            pageList.push({ index: i - 1, url: canvas.toDataURL('image/jpeg', 0.6), selected: true });
        }
        setSplitPages(pageList);
    } catch (err) {
        console.error("Thumbnail generation failed:", err);
        toast({ title: "Preview Failed", description: "Could not render PDF pages.", variant: "destructive" });
    }
  }, []);

  useEffect(() => {
      if (activeTool === 'split' && activeFileId) {
          const f = getActiveFile();
          if (f) {
              generateThumbnails(f);
              setOutputName(f.name.substring(0, f.name.lastIndexOf('.')) + '-split');
          }
      }
  }, [activeFileId, activeTool, generateThumbnails]);

  const handleToolChange = (newTool: string) => {
      setActiveTool(newTool);
      if (newTool === 'merge' || newTool === 'compress') {
          setFiles(prev => prev.map(f => ({ ...f, selected: true })));
      }
      if ((newTool === 'split' || newTool === 'images') && files.length > 0) {
          setActiveFileId(files[0].id);
          const f = files[0].file;
          const baseName = f.name.substring(0, f.name.lastIndexOf('.'));
          setOutputName(baseName + (newTool === 'split' ? '-split' : ''));
      }
      if (files.length > 0 && newTool === 'merge') setOutputName("merged-document");
  };

  const { getRootProps, getInputProps, isDragActive, open: openDropzone } = useDropzone({
    onDrop: (acceptedFiles) => {
        const newManagedFiles = acceptedFiles.map(f => ({
            id: Math.random().toString(36).substr(2, 9),
            file: f,
            selected: true 
        }));
        setFiles((prev) => {
            const combined = [...prev, ...newManagedFiles];
            if (prev.length === 0 && combined.length > 0) {
                setActiveFileId(combined[0].id);
                if (activeTool === 'merge') setOutputName("merged-document");
                else {
                    const f = combined[0].file;
                    setOutputName(f.name.substring(0, f.name.lastIndexOf('.')));
                }
            }
            return combined;
        });
    },
    accept: { 'application/pdf': ['.pdf'] },
    multiple: true,
    noClick: true 
  });
  
  const downloadBlob = (data: Uint8Array | Blob | File, name: string, mimeType: string) => {
      const blob = data instanceof File ? data : new Blob([data as any], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
  };

  const toggleFileSelection = (id: string) => {
      setFiles(prev => prev.map(f => f.id === id ? { ...f, selected: !f.selected } : f));
  };

  const togglePageSelection = (index: number) => {
      setSplitPages(prev => prev.map(page => 
          page.index === index ? { ...page, selected: !page.selected } : page
      ));
  };

  const handleMerge = async () => {
      const selected = getSelectedFiles();
      if (selected.length < 2) return;
      setIsProcessing(true);
      try {
          const mergedPdf = await PDFDocument.create();
          for (const item of selected) {
              const arrayBuffer = await item.file.arrayBuffer();
              const pdf = await PDFDocument.load(arrayBuffer);
              const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
              copiedPages.forEach((page) => mergedPdf.addPage(page));
          }
          const pdfBytes = await mergedPdf.save();
          downloadBlob(pdfBytes, `${outputName}.pdf`, "application/pdf");
          toast({ title: "Merge Complete!", className: "bg-green-600 text-white border-none" });
      } catch (err) {
          toast({ title: "Merge Failed", variant: "destructive" });
      } finally { setIsProcessing(false); }
  };

  const handleCompress = async () => {
      const selected = getSelectedFiles();
      if (selected.length === 0) return;
      setIsProcessing(true); setProgress(0);
      const zip = new JSZip();
      const pdfjsLib = await loadPdfJs();
      try {
          for (let fIndex = 0; fIndex < selected.length; fIndex++) {
              const item = selected[fIndex];
              const arrayBuffer = await item.file.arrayBuffer();
              const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
              const totalPages = pdf.numPages;
              const newPdf = new jsPDF();
              for (let i = 1; i <= totalPages; i++) {
                  const totalProgress = ((fIndex * 100) + ((i / totalPages) * 100)) / selected.length;
                  setProgress(Math.round(totalProgress));
                  const page = await pdf.getPage(i);
                  const viewport = page.getViewport({ scale: 1.5 });
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');
                  canvas.width = viewport.width; canvas.height = viewport.height;
                  // @ts-ignore
                  await page.render({ canvasContext: ctx, viewport }).promise;
                  const compressedData = canvas.toDataURL('image/jpeg', compressionQuality / 100);
                  if (i > 1) newPdf.addPage();
                  newPdf.addImage(compressedData, 'JPEG', 0, 0, newPdf.internal.pageSize.getWidth(), newPdf.internal.pageSize.getHeight());
              }
              const compressedBlob = newPdf.output("blob");
              if (selected.length === 1) {
                  downloadBlob(compressedBlob, `${outputName}-compressed.pdf`, "application/pdf");
                  toast({ title: "Compression Complete", className: "bg-green-600 text-white border-none" });
                  setIsProcessing(false); return;
              }
              zip.file(`${item.file.name.replace('.pdf', '')}-opt.pdf`, compressedBlob);
          }
          const content = await zip.generateAsync({ type: "blob" });
          downloadBlob(content, `${outputName}-batch.zip`, "application/zip");
          toast({ title: "Batch Complete", className: "bg-green-600 text-white border-none" });
      } catch (err) { toast({ title: "Failed", variant: "destructive" }); } 
      finally { setIsProcessing(false); setProgress(0); }
  };

  const handleToImages = async () => {
    const file = getActiveFile(); if (!file) return;
    setIsProcessing(true); setProgress(0);
    try {
        const pdfjsLib = await loadPdfJs();
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        const zip = new JSZip();
        for (let i = 1; i <= pdf.numPages; i++) {
            setProgress(Math.round((i / pdf.numPages) * 100));
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 2.0 });
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = viewport.width; canvas.height = viewport.height;
            // @ts-ignore
            await page.render({ canvasContext: ctx, viewport }).promise;
            zip.file(`page-${i}.jpg`, canvas.toDataURL('image/jpeg', 0.9).split(',')[1], { base64: true });
        }
        downloadBlob(await zip.generateAsync({ type: "blob" }), `${outputName}-images.zip`, "application/zip");
        toast({ title: "Images Ready!", className: "bg-green-600 text-white border-none" });
    } finally { setIsProcessing(false); setProgress(0); }
  };

  const handleSplit = async () => {
      const file = getActiveFile(); if (!file) return;
      const selectedPages = splitPages.filter(p => p.selected);
      if (selectedPages.length === 0) return toast({ title: "Select pages", variant: "destructive" });
      setIsProcessing(true);
      try {
          const pdfDoc = await PDFDocument.load(await file.arrayBuffer());
          const newPdf = await PDFDocument.create();
          for (const index of selectedPages.map(p => p.index)) {
              const [copiedPage] = await newPdf.copyPages(pdfDoc, [index]);
              newPdf.addPage(copiedPage);
          }
          downloadBlob(await newPdf.save(), `${outputName}.pdf`, "application/pdf");
          toast({ title: "Split Complete!", className: "bg-green-600 text-white border-none" });
      } finally { setIsProcessing(false); }
  };
  
  const selectAllPages = () => setSplitPages(prev => prev.map(p => ({ ...p, selected: true })));
  const selectNonePages = () => setSplitPages(prev => prev.map(p => ({ ...p, selected: false })));

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <input {...getInputProps()} />

      <div className="text-center space-y-2">
           <h2 className="text-3xl font-bold text-white flex items-center justify-center gap-2 tracking-tighter">
               <FileText className="text-red-500" /> 
               PDF Tools
           </h2>
           <p className="text-slate-400 text-sm">Merge, Split, Compress, and Convert PDFs securely.</p>
      </div>

      <Tabs defaultValue="merge" value={activeTool} onValueChange={handleToolChange} className="w-full">
            <div className="flex justify-start md:justify-center mb-8 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                <TabsList className="bg-slate-900 border border-slate-800 h-10 p-1 flex-nowrap w-max md:w-auto">
                    <TabsTrigger value="merge" className="px-6 text-[10px] uppercase font-bold tracking-widest data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400">Merge</TabsTrigger>
                    <TabsTrigger value="split" className="px-6 text-[10px] uppercase font-bold tracking-widest data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400">Split</TabsTrigger>
                    <TabsTrigger value="compress" className="px-6 text-[10px] uppercase font-bold tracking-widest data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">Compress</TabsTrigger>
                    <TabsTrigger value="images" className="px-6 text-[10px] uppercase font-bold tracking-widest data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400">To Images</TabsTrigger>
                </TabsList>
            </div>

            <div className="space-y-6">
                 {files.length === 0 ? (
                     <div 
                        {...getRootProps()} 
                        onClick={openDropzone} 
                        className={`relative h-56 rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center cursor-pointer overflow-hidden
                            ${isDragActive ? "border-red-500 bg-red-500/10" : "border-slate-800 bg-slate-900/50 hover:bg-slate-800/50"}
                        `}
                     >
                        <div className="space-y-4">
                             <Layers className="mx-auto text-slate-400" size={32} />
                             <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-200">
                                    {activeTool === 'merge' ? "Drop PDFs to combine" : "Drop PDF for local processing"}
                                </p>
                                <p className="text-[10px] font-mono text-slate-500 mt-1 uppercase tracking-widest">Bunker Mode Active</p>
                             </div>
                        </div>
                     </div>
                 ) : (
                     <div className="space-y-4">
                         {(activeTool === 'split' || activeTool === 'images') && (
                             <div className="bg-slate-900/50 border border-slate-800 p-2 rounded-xl flex gap-2 overflow-x-auto">
                                 {files.map((f) => (
                                     <button key={f.id} onClick={() => setActiveFileId(f.id)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors ${activeFileId === f.id ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
                                         {f.file.name}
                                     </button>
                                 ))}
                                 <button onClick={openDropzone} className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-slate-800 text-slate-400 hover:text-white"><Plus size={14} /></button>
                             </div>
                         )}

                         {activeTool === 'split' && getActiveFile() && (
                            <div className="flex flex-col gap-4">
                                <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-3 rounded-xl">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300 truncate">{getActiveFile()?.name} ({splitPages.length} Pgs)</p>
                                    <div className="flex gap-2">
                                        <Button onClick={selectAllPages} size="sm" variant="outline" className="h-7 text-[9px] uppercase font-bold border-slate-700 text-green-400">All</Button>
                                        <Button onClick={selectNonePages} size="sm" variant="outline" className="h-7 text-[9px] uppercase font-bold border-slate-700 text-red-400">None</Button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2">
                                    {splitPages.map((page: PDFPage) => (
                                        <div key={page.index} onClick={() => togglePageSelection(page.index)} className={`relative aspect-[3/4] bg-slate-900 border-2 rounded-lg transition-all cursor-pointer overflow-hidden ${page.selected ? 'border-red-500 shadow-lg shadow-red-900/50' : 'border-slate-700 hover:border-red-500/50'}`}>
                                            <img src={page.url} alt={`Pg ${page.index + 1}`} className="w-full h-full object-contain pointer-events-none" />
                                            <div className={`absolute top-1 right-1 p-0.5 rounded-full ${page.selected ? 'bg-red-500' : 'bg-slate-700'}`}>
                                                {page.selected ? <Check size={10} className="text-white" /> : <X size={10} className="text-slate-400" />}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                         )}
                         
                         {activeTool !== 'split' && files.map((item, i) => (
                             <div key={item.id} className={`flex items-center gap-4 p-3 bg-slate-900 border rounded-xl group transition-all ${item.selected ? 'border-blue-500/30' : 'border-slate-800 hover:border-slate-700'}`}>
                                 {(activeTool === 'merge' || activeTool === 'compress') && (
                                     <button onClick={() => toggleFileSelection(item.id)} className={`shrink-0 ${item.selected ? 'text-blue-500' : 'text-slate-600 hover:text-slate-400'}`}>
                                         {item.selected ? <CheckSquare size={18} /> : <Square size={18} />}
                                     </button>
                                 )}
                                 {activeTool === 'merge' && <div className="text-slate-600 cursor-grab active:cursor-grabbing"><GripHorizontal size={14} /></div>}
                                 <div className="w-8 h-8 bg-red-500/10 rounded flex items-center justify-center text-red-500 font-bold text-[10px]">PDF</div>
                                 <div className="flex-1 min-w-0">
                                     <p className={`text-xs font-bold truncate ${item.selected ? 'text-slate-200' : 'text-slate-500'}`}>{item.file.name}</p>
                                     <p className="text-[10px] font-mono text-slate-500">{formatBytes(item.file.size)}</p>
                                 </div>
                                 <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 hover:text-red-400" onClick={() => {
                                     setFiles(prev => prev.filter(f => f.id !== item.id));
                                 }}><Trash2 size={14} /></Button>
                             </div>
                         ))}
                     </div>
                 )}

                 {files.length > 0 && (
                     <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 space-y-6">
                         {activeTool === 'compress' && (
                             <div className="space-y-4">
                                 <div className="flex justify-between items-end">
                                     <div>
                                         <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Compression Strength</span>
                                     </div>
                                     <div className="text-right">
                                         <span className="text-blue-400 font-bold text-lg">{compressionQuality}%</span>
                                         <p className="text-[10px] text-green-500 font-mono mt-1">Est: {getPredictedSize()}</p>
                                     </div>
                                 </div>
                                 <Slider value={[compressionQuality]} onValueChange={(v) => setCompressionQuality(v[0])} max={100} step={5} className="[&_.bg-primary]:bg-blue-500"/>
                             </div>
                         )}

                         <div className="flex flex-col sm:flex-row gap-4 items-end">
                             <div className="flex-1 w-full space-y-2">
                                 <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Output Filename</label>
                                 <div className="relative">
                                     <Input value={outputName} onChange={(e) => setOutputName(e.target.value)} className="bg-slate-950 border-slate-800 text-xs font-bold text-white h-10"/>
                                     <Pencil className="absolute right-3 top-3 text-slate-500" size={12} />
                                 </div>
                             </div>
                             
                             <Button 
                                onClick={() => {
                                    if (activeTool === 'merge') handleMerge();
                                    if (activeTool === 'compress') handleCompress();
                                    if (activeTool === 'images') handleToImages();
                                    if (activeTool === 'split') handleSplit();
                                }}
                                disabled={isProcessing}
                                className={`h-10 px-8 text-[10px] font-bold uppercase tracking-widest min-w-[160px] ${activeTool === 'merge' || activeTool === 'split' ? "bg-red-600 hover:bg-red-500" : activeTool === 'compress' ? "bg-blue-600 hover:bg-blue-500" : "bg-yellow-600 hover:bg-yellow-500 text-black"}`}
                             >
                                 {isProcessing ? <><Loader2 className="animate-spin mr-2" size={14} /> {progress > 0 ? `${progress}%` : 'Working'}</> : 
                                    activeTool === 'merge' ? `Merge ${getSelectedFiles().length} PDFs` : 
                                    activeTool === 'compress' ? `Compress PDF` :
                                    activeTool === 'split' ? "Split PDF" : "To Images"
                                 }
                             </Button>
                         </div>
                     </div>
                 )}
            </div>
      </Tabs>
    </div>
  );
}