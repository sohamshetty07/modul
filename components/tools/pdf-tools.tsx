"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { FileText, Trash2, Layers, MoveUp, MoveDown, GripVertical, Pencil, Image as ImageIcon, Minimize2, Scissors, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { PDFDocument } from "pdf-lib";
import { jsPDF } from "jspdf";
import JSZip from "jszip";
import { toast } from "@/hooks/use-toast";
import { formatBytes } from "@/core/utils";

// Interface for page thumbnails
interface PDFPage {
    index: number;
    url: string;
    selected: boolean;
}

export default function PDFTools() {
  const [activeTool, setActiveTool] = useState("merge");
  // UNIFIED STATE: We use 'files' for everything. 
  // For Split/Compress/Images, we just use files[0].
  const [files, setFiles] = useState<File[]>([]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Settings
  const [outputName, setOutputName] = useState("document");
  const [compressionQuality, setCompressionQuality] = useState(70); 

  // Splitter State
  const [splitPages, setSplitPages] = useState<PDFPage[]>([]);

  // --- THUMBNAIL GENERATION ---
  const generateThumbnails = useCallback(async (file: File) => {
    if (!file) return;
    try {
        const pdfjsLib = await loadPdfJs();
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        const totalPages = pdf.numPages;
        const pageList: PDFPage[] = [];

        for (let i = 1; i <= totalPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 0.5 }); 
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

  // --- TAB SWITCH HANDLER (FIXED) ---
  const handleToolChange = (newTool: string) => {
      setActiveTool(newTool);
      // DO NOT clear 'files'. Keep them!
      
      // If switching TO split and we have a file, generate thumbnails immediately
      if (newTool === 'split' && files.length > 0) {
          generateThumbnails(files[0]);
          setOutputName(files[0].name.substring(0, files[0].name.lastIndexOf('.')) + '-split');
      } else if (files.length > 0) {
          // Reset name for other tools
          const f = files[0];
          const baseName = f.name.substring(0, f.name.lastIndexOf('.'));
          if (newTool === 'merge') setOutputName("merged-document");
          else setOutputName(baseName);
      }
  };

  // --- DROPZONE ---
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
        const f = acceptedFiles[0];
        if (activeTool === 'merge') {
            setFiles((prev) => [...prev, ...acceptedFiles]);
            if (files.length === 0) setOutputName("merged-document");
        } else {
            // For Split, Compress, Images -> Replace the file
            setFiles([f]);
            const baseName = f.name.substring(0, f.name.lastIndexOf('.'));
            
            if (activeTool === 'split') {
                setOutputName(baseName + '-split');
                generateThumbnails(f);
            } else {
                setOutputName(baseName);
            }
        }
    },
    accept: { 'application/pdf': ['.pdf'] },
    multiple: activeTool === 'merge'
  });

  // --- HELPER: Load PDF.js ---
  const loadPdfJs = async () => {
    if ((window as any).pdfjsLib) return (window as any).pdfjsLib;
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.onload = () => {
            const lib = (window as any).pdfjsLib;
            lib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            resolve(lib);
        };
        script.onerror = () => reject(new Error("Failed to load PDF engine"));
        document.head.appendChild(script);
    });
  };
  
  // --- UTILS ---
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

  const moveFile = (index: number, direction: -1 | 1) => {
      const newFiles = [...files];
      if (index + direction < 0 || index + direction >= newFiles.length) return;
      const temp = newFiles[index];
      newFiles[index] = newFiles[index + direction];
      newFiles[index + direction] = temp;
      setFiles(newFiles);
  };

  const togglePageSelection = (index: number) => {
      setSplitPages(prev => prev.map(page => 
          page.index === index ? { ...page, selected: !page.selected } : page
      ));
  };
  
  // --- ACTION 1: MERGE ---
  const handleMerge = async () => {
      if (files.length < 2) return;
      setIsProcessing(true);
      try {
          const mergedPdf = await PDFDocument.create();
          for (const file of files) {
              const arrayBuffer = await file.arrayBuffer();
              const pdf = await PDFDocument.load(arrayBuffer);
              const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
              copiedPages.forEach((page) => mergedPdf.addPage(page));
          }
          const pdfBytes = await mergedPdf.save();
          downloadBlob(pdfBytes, `${outputName}.pdf`, "application/pdf");
          toast({ title: "Merge Complete!", className: "bg-green-600 text-white border-none" });
      } catch (err) {
          console.error(err);
          toast({ title: "Merge Failed", variant: "destructive" });
      } finally { setIsProcessing(false); }
  };

  // --- ACTION 2: COMPRESS ---
  const handleCompress = async () => {
      if (files.length === 0) return;
      setIsProcessing(true);
      setProgress(0);
      try {
          const originalFile = files[0];
          const pdfjsLib = await loadPdfJs();
          const arrayBuffer = await originalFile.arrayBuffer();
          const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
          const totalPages = pdf.numPages;
          const newPdf = new jsPDF();
          
          for (let i = 1; i <= totalPages; i++) {
              setProgress(Math.round((i / totalPages) * 100));
              const page = await pdf.getPage(i);
              const viewport = page.getViewport({ scale: 1.5 });
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              canvas.width = viewport.width;
              canvas.height = viewport.height;
              // @ts-ignore
              await page.render({ canvasContext: ctx, viewport }).promise;
              const compressedData = canvas.toDataURL('image/jpeg', compressionQuality / 100);
              const pdfW = newPdf.internal.pageSize.getWidth();
              const pdfH = newPdf.internal.pageSize.getHeight();
              if (i > 1) newPdf.addPage();
              newPdf.addImage(compressedData, 'JPEG', 0, 0, pdfW, pdfH);
          }
          const pdfBlob = newPdf.output("blob");
          if (pdfBlob.size > originalFile.size) {
              downloadBlob(originalFile, originalFile.name, originalFile.type);
              toast({ title: "Compression Skipped", description: `Output larger than original.`, className: "bg-orange-600 text-white border-none" });
          } else {
              downloadBlob(pdfBlob, `${outputName}-compressed.pdf`, "application/pdf");
              toast({ title: "Complete!", description: `Saved ${formatBytes(originalFile.size - pdfBlob.size)}.`, className: "bg-green-600 text-white border-none" });
          }
      } catch (err) {
          console.error(err);
          toast({ title: "Failed to compress", variant: "destructive" });
      } finally { setIsProcessing(false); setProgress(0); }
  };

  // --- ACTION 3: TO IMAGES ---
  const handleToImages = async () => {
      if (files.length === 0) return;
      setIsProcessing(true);
      setProgress(0);
      try {
          const file = files[0];
          const pdfjsLib = await loadPdfJs();
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
          const totalPages = pdf.numPages;
          const zip = new JSZip();

          for (let i = 1; i <= totalPages; i++) {
              setProgress(Math.round((i / totalPages) * 100));
              const page = await pdf.getPage(i);
              const viewport = page.getViewport({ scale: 2.0 });
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              canvas.width = viewport.width;
              canvas.height = viewport.height;
              // @ts-ignore
              await page.render({ canvasContext: ctx, viewport }).promise;
              const imgData = canvas.toDataURL('image/jpeg', 0.9);
              zip.file(`page-${i}.jpg`, imgData.split(',')[1], { base64: true });
          }
          const content = await zip.generateAsync({ type: "blob" });
          downloadBlob(content, `${outputName}-images.zip`, "application/zip");
          toast({ title: "Images Ready!", className: "bg-green-600 text-white border-none" });
      } catch (err) {
          console.error(err);
          toast({ title: "Conversion Failed", variant: "destructive" });
      } finally { setIsProcessing(false); setProgress(0); }
  };

  // --- ACTION 4: SPLIT ---
  const handleSplit = async () => {
      if (files.length === 0) return;
      const selectedPages = splitPages.filter(p => p.selected);
      if (selectedPages.length === 0) {
          toast({ title: "No Pages Selected", variant: "destructive" });
          return;
      }
      setIsProcessing(true);
      try {
          const pdfBytes = await files[0].arrayBuffer();
          const pdfDoc = await PDFDocument.load(pdfBytes);
          const pageIndicesToKeep = selectedPages.map(p => p.index);
          const newPdf = await PDFDocument.create();
          for (const index of pageIndicesToKeep) {
              const [copiedPage] = await newPdf.copyPages(pdfDoc, [index]);
              newPdf.addPage(copiedPage);
          }
          const finalPdfBytes = await newPdf.save();
          downloadBlob(finalPdfBytes, `${outputName}.pdf`, "application/pdf");
          toast({ title: "Split Complete!", className: "bg-green-600 text-white border-none" });
      } catch (err) {
          console.error(err);
          toast({ title: "Split Failed", variant: "destructive" });
      } finally { setIsProcessing(false); }
  };
  
  const selectAll = () => setSplitPages(prev => prev.map(p => ({ ...p, selected: true })));
  const selectNone = () => setSplitPages(prev => prev.map(p => ({ ...p, selected: false })));

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="text-center space-y-2">
           <h2 className="text-3xl font-bold text-white flex items-center justify-center gap-2">
               <FileText className="text-red-500" /> 
               PDF Tools
           </h2>
           <p className="text-slate-400">Merge, Split, Compress, and Convert PDFs securely.</p>
      </div>

      <Tabs defaultValue="merge" value={activeTool} onValueChange={handleToolChange} className="w-full">
            {/* SCROLLABLE TABS FOR MOBILE */}
            <div className="flex justify-start md:justify-center mb-8 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                <TabsList className="bg-slate-900 border border-slate-800 h-10 p-1 flex-nowrap w-max md:w-auto">
                    <TabsTrigger value="merge" className="px-6 whitespace-nowrap data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400">Merge</TabsTrigger>
                    <TabsTrigger value="split" className="px-6 whitespace-nowrap data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400">Split</TabsTrigger>
                    <TabsTrigger value="compress" className="px-6 whitespace-nowrap data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">Compress</TabsTrigger>
                    <TabsTrigger value="images" className="px-6 whitespace-nowrap data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400">To Images</TabsTrigger>
                </TabsList>
            </div>

            {/* CONTENT AREA */}
            <div className="space-y-6">
                 {/* 1. DROPZONE */}
                 {files.length === 0 ? (
                     <div 
                        {...getRootProps()} 
                        className={`relative h-56 rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center cursor-pointer overflow-hidden
                            ${isDragActive ? "border-red-500 bg-red-500/10" : "border-slate-800 bg-slate-900/50 hover:bg-slate-800/50"}
                        `}
                     >
                        <input {...getInputProps()} />
                        <div className="space-y-4">
                             <div className="w-16 h-16 mx-auto bg-slate-800 rounded-2xl flex items-center justify-center">
                                 {activeTool === 'merge' && <Layers className="text-slate-400" size={32} />}
                                 {activeTool === 'split' && <Scissors className="text-slate-400" size={32} />}
                                 {activeTool === 'compress' && <Minimize2 className="text-slate-400" size={32} />}
                                 {activeTool === 'images' && <ImageIcon className="text-slate-400" size={32} />}
                             </div>
                             <div>
                                <p className="text-lg font-medium text-slate-200">
                                    {activeTool === 'merge' ? "Drop PDFs to combine" : "Drop a PDF to process"}
                                </p>
                                <p className="text-sm text-slate-500">Processing locally</p>
                             </div>
                        </div>
                     </div>
                 ) : (
                     // 2. FILE LIST / THUMBNAIL VIEW
                     <div className="space-y-4">
                         {/* Split View */}
                         {activeTool === 'split' && files.length > 0 && (
                            <div className="flex flex-col gap-4">
                                <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-3 rounded-xl">
                                    <p className="text-sm text-slate-300 font-medium truncate">{files[0].name} ({splitPages.length} Pgs)</p>
                                    <div className="flex gap-2">
                                        <Button onClick={selectAll} size="sm" variant="outline" className="h-7 text-xs border-slate-700 text-green-400 hover:text-green-300">All</Button>
                                        <Button onClick={selectNone} size="sm" variant="outline" className="h-7 text-xs border-slate-700 text-red-400 hover:text-red-300">None</Button>
                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-500 hover:text-red-400" onClick={() => setFiles([])}>
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2">
                                    {splitPages.map((page) => (
                                        <div 
                                            key={page.index} 
                                            onClick={() => togglePageSelection(page.index)}
                                            className={`relative aspect-[3/4] bg-slate-900 border-2 rounded-lg transition-all cursor-pointer overflow-hidden group 
                                                ${page.selected ? 'border-red-500 shadow-lg shadow-red-900/50' : 'border-slate-700 hover:border-red-500/50'}
                                            `}
                                        >
                                            <img src={page.url} alt={`Page ${page.index + 1}`} className="w-full h-full object-contain pointer-events-none" />
                                            <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[10px] px-1 rounded">
                                                {page.index + 1}
                                            </span>
                                            <div className={`absolute top-1 right-1 p-0.5 rounded-full ${page.selected ? 'bg-red-500' : 'bg-slate-700'}`}>
                                                {page.selected ? <Check size={12} className="text-white" /> : <X size={12} className="text-slate-400" />}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                         )}
                         
                         {/* Standard List View */}
                         {activeTool !== 'split' && files.map((file, i) => (
                             <div key={i} className="flex items-center gap-4 p-3 bg-slate-900 border border-slate-800 rounded-xl group hover:border-slate-700 transition-all">
                                 {activeTool === 'merge' && (
                                    <div className="text-slate-600 cursor-grab active:cursor-grabbing">
                                        <GripVertical size={16} />
                                    </div>
                                 )}
                                 <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center text-red-500 font-bold text-xs">PDF</div>
                                 <div className="flex-1 min-w-0">
                                     <p className="text-sm font-medium text-slate-200 truncate">{file.name}</p>
                                     <p className="text-xs text-slate-500">{formatBytes(file.size)}</p>
                                 </div>
                                 {activeTool === 'merge' && (
                                     <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                         <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-white" onClick={() => moveFile(i, -1)}><MoveUp size={14} /></Button>
                                         <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-white" onClick={() => moveFile(i, 1)}><MoveDown size={14} /></Button>
                                     </div>
                                 )}
                                 <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-red-950/30" onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}>
                                     <Trash2 size={16} />
                                 </Button>
                             </div>
                         ))}
                     </div>
                 )}

                 {/* 3. SETTINGS & ACTIONS */}
                 {files.length > 0 && (
                     <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 space-y-6 animate-in slide-in-from-top-2">
                         {activeTool === 'compress' && (
                             <div className="space-y-3">
                                 <div className="flex justify-between text-sm">
                                     <span className="text-slate-400">Quality Level</span>
                                     <span className="text-blue-400">{compressionQuality}%</span>
                                 </div>
                                 <Slider value={[compressionQuality]} onValueChange={(v) => setCompressionQuality(v[0])} max={100} step={5} className="[&_.bg-primary]:bg-blue-500"/>
                             </div>
                         )}

                         <div className="flex flex-col sm:flex-row gap-4 items-end">
                             <div className="flex-1 w-full space-y-2">
                                 <label className="text-xs text-slate-500 font-medium uppercase tracking-wider">Output Filename</label>
                                 <div className="relative">
                                     <Input value={outputName} onChange={(e) => setOutputName(e.target.value)} className="bg-slate-950 border-slate-700 text-white pr-10"/>
                                     <Pencil className="absolute right-3 top-2.5 text-slate-500" size={14} />
                                 </div>
                             </div>
                             <Button 
                                onClick={() => {
                                    if (activeTool === 'merge') return handleMerge();
                                    if (activeTool === 'compress') return handleCompress();
                                    if (activeTool === 'images') return handleToImages();
                                    if (activeTool === 'split') return handleSplit();
                                }}
                                disabled={isProcessing || (activeTool === 'merge' && files.length < 2) || (activeTool === 'split' && splitPages.filter(p => p.selected).length === 0)}
                                className={`h-10 px-8 font-medium min-w-[140px]
                                    ${activeTool === 'merge' || activeTool === 'split' ? "bg-red-600 hover:bg-red-500" : activeTool === 'compress' ? "bg-blue-600 hover:bg-blue-500" : "bg-yellow-600 hover:bg-yellow-500 text-black"}
                                `}
                             >
                                 {isProcessing ? `Processing ${progress > 0 ? `${progress}%` : '...'}` : activeTool === 'merge' ? "Merge PDFs" : activeTool === 'split' ? `Split Pages` : activeTool === 'compress' ? "Compress PDF" : "Convert to Images"}
                             </Button>
                         </div>
                     </div>
                 )}
            </div>
      </Tabs>
    </div>
  );
}