"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { FileText, Trash2, Layers, MoveUp, MoveDown, GripVertical, Pencil, Image as ImageIcon, Minimize2, Scissors, Check, X, Plus } from "lucide-react";
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
  const [files, setFiles] = useState<File[]>([]);
  
  // New: Track which file is currently active for Split/Preview views
  const [activeFileIndex, setActiveFileIndex] = useState(0);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Settings
  const [outputName, setOutputName] = useState("document");
  const [compressionQuality, setCompressionQuality] = useState(70); 

  // Splitter State
  const [splitPages, setSplitPages] = useState<PDFPage[]>([]);

  // --- PREDICTED SIZE CALCULATOR ---
  const getPredictedSize = () => {
      if (files.length === 0) return "0 KB";
      const totalSize = files.reduce((acc, f) => acc + f.size, 0);
      
      // Heuristic: PDF Size is mostly images. 
      // JPEG compression curve is roughly exponential, plus overhead (0.2 constant).
      const ratio = 0.2 + (0.8 * Math.pow(compressionQuality / 100, 2));
      const estimated = totalSize * ratio;
      
      return formatBytes(estimated);
  };

  // --- THUMBNAIL GENERATION ---
  const generateThumbnails = useCallback(async (file: File) => {
    if (!file) return;
    try {
        setSplitPages([]); // Clear previous
        const pdfjsLib = await loadPdfJs();
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        const totalPages = pdf.numPages;
        const pageList: PDFPage[] = [];

        for (let i = 1; i <= totalPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 0.4 }); // Low scale for speed
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

  // --- EFFECT: Handle File Switching in Split Mode ---
  useEffect(() => {
      if (activeTool === 'split' && files.length > 0) {
          generateThumbnails(files[activeFileIndex]);
          const fname = files[activeFileIndex].name;
          setOutputName(fname.substring(0, fname.lastIndexOf('.')) + '-split');
      }
  }, [activeFileIndex, activeTool, files.length, generateThumbnails]); // eslint-disable-line

  // --- TAB SWITCH HANDLER ---
  const handleToolChange = (newTool: string) => {
      setActiveTool(newTool);
      // Reset output name based on tool context
      if (files.length > 0) {
          const f = files[0];
          const baseName = f.name.substring(0, f.name.lastIndexOf('.'));
          if (newTool === 'merge') setOutputName("merged-document");
          else if (newTool === 'split') setOutputName(baseName + '-split');
          else setOutputName(baseName);
      }
  };

  // --- DROPZONE ---
  const { getRootProps, getInputProps, isDragActive, open: openDropzone } = useDropzone({
    onDrop: (acceptedFiles) => {
        // Always append files, never replace (unless user explicitly clears)
        setFiles((prev) => [...prev, ...acceptedFiles]);
        if (files.length === 0 && acceptedFiles.length > 0) {
             const f = acceptedFiles[0];
             const baseName = f.name.substring(0, f.name.lastIndexOf('.'));
             if (activeTool === 'merge') setOutputName("merged-document");
             else setOutputName(baseName);
        }
    },
    accept: { 'application/pdf': ['.pdf'] },
    multiple: true,
    noClick: files.length > 0 // Disable click on main area if files exist (we use button)
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

  // --- ACTION 2: COMPRESS (BATCH SUPPORT) ---
  const handleCompress = async () => {
      if (files.length === 0) return;
      setIsProcessing(true);
      setProgress(0);
      
      const zip = new JSZip();
      const pdfjsLib = await loadPdfJs();
      
      try {
          // Process files sequentially
          for (let fIndex = 0; fIndex < files.length; fIndex++) {
              const file = files[fIndex];
              const arrayBuffer = await file.arrayBuffer();
              const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
              const totalPages = pdf.numPages;
              const newPdf = new jsPDF();

              for (let i = 1; i <= totalPages; i++) {
                  // Calculate global progress
                  const fileProgress = (i / totalPages) * 100;
                  const totalProgress = ((fIndex * 100) + fileProgress) / files.length;
                  setProgress(Math.round(totalProgress));

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
              
              const compressedBlob = newPdf.output("blob");
              
              // If single file, download directly
              if (files.length === 1) {
                  downloadBlob(compressedBlob, `${outputName}-compressed.pdf`, "application/pdf");
                  toast({ title: "Compression Complete", description: `Saved ${formatBytes(file.size - compressedBlob.size)}`, className: "bg-green-600 text-white border-none" });
                  setIsProcessing(false);
                  return;
              }

              // If multiple, add to zip
              zip.file(`${file.name.replace('.pdf', '')}-compressed.pdf`, compressedBlob);
          }
          
          // Download Zip
          const content = await zip.generateAsync({ type: "blob" });
          downloadBlob(content, `${outputName}-compressed-batch.zip`, "application/zip");
          toast({ title: "Batch Compression Complete", className: "bg-green-600 text-white border-none" });

      } catch (err) {
          console.error(err);
          toast({ title: "Failed to compress", variant: "destructive" });
      } finally { setIsProcessing(false); setProgress(0); }
  };

  // --- ACTION 3: TO IMAGES ---
  const handleToImages = async () => {
    // Basic implementation for single file (files[activeFileIndex])
    const file = files[activeFileIndex]; 
    if (!file) return;
    setIsProcessing(true); setProgress(0);
    try {
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
    } catch (err) { console.error(err); } 
    finally { setIsProcessing(false); setProgress(0); }
  };

  // --- ACTION 4: SPLIT ---
  const handleSplit = async () => {
      const file = files[activeFileIndex];
      if (!file) return;
      const selectedPages = splitPages.filter(p => p.selected);
      if (selectedPages.length === 0) return toast({ title: "Select pages first", variant: "destructive" });
      
      setIsProcessing(true);
      try {
          const pdfBytes = await file.arrayBuffer();
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
      } catch (err) { console.error(err); } 
      finally { setIsProcessing(false); }
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
            <div className="flex justify-start md:justify-center mb-8 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                <TabsList className="bg-slate-900 border border-slate-800 h-10 p-1 flex-nowrap w-max md:w-auto">
                    <TabsTrigger value="merge" className="px-6 whitespace-nowrap data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400">Merge</TabsTrigger>
                    <TabsTrigger value="split" className="px-6 whitespace-nowrap data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400">Split</TabsTrigger>
                    <TabsTrigger value="compress" className="px-6 whitespace-nowrap data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">Compress</TabsTrigger>
                    <TabsTrigger value="images" className="px-6 whitespace-nowrap data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400">To Images</TabsTrigger>
                </TabsList>
            </div>

            <div className="space-y-6">
                 {/* 1. INITIAL DROPZONE (Only if empty) */}
                 {files.length === 0 ? (
                     <div 
                        {...getRootProps()} 
                        className={`relative h-56 rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center cursor-pointer overflow-hidden
                            ${isDragActive ? "border-red-500 bg-red-500/10" : "border-slate-800 bg-slate-900/50 hover:bg-slate-800/50"}
                        `}
                     >
                        <input {...getInputProps()} />
                        <div className="space-y-4">
                             <Layers className="mx-auto text-slate-400" size={32} />
                             <div>
                                <p className="text-lg font-medium text-slate-200">
                                    {activeTool === 'merge' ? "Drop PDFs to combine" : "Drop PDFs to process"}
                                </p>
                                <p className="text-sm text-slate-500">Processing locally</p>
                             </div>
                        </div>
                     </div>
                 ) : (
                     <div className="space-y-4">
                         
                         {/* --- NEW: FILE SELECTOR FOR SPLIT/IMAGES --- */}
                         {/* If we have multiple files but are in Split/Image mode, let user pick which one to work on */}
                         {(activeTool === 'split' || activeTool === 'images') && files.length > 1 && (
                             <div className="bg-slate-900/50 border border-slate-800 p-2 rounded-xl flex gap-2 overflow-x-auto">
                                 {files.map((f, i) => (
                                     <button
                                        key={i}
                                        onClick={() => setActiveFileIndex(i)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors
                                            ${activeFileIndex === i ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}
                                        `}
                                     >
                                         {f.name}
                                     </button>
                                 ))}
                             </div>
                         )}

                         {/* --- SPLIT VIEW (THUMBNAILS) --- */}
                         {activeTool === 'split' && files[activeFileIndex] && (
                            <div className="flex flex-col gap-4">
                                <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-3 rounded-xl">
                                    <p className="text-sm text-slate-300 font-medium truncate">{files[activeFileIndex].name} ({splitPages.length} Pgs)</p>
                                    <div className="flex gap-2">
                                        <Button onClick={selectAll} size="sm" variant="outline" className="h-7 text-xs border-slate-700 text-green-400 hover:text-green-300">All</Button>
                                        <Button onClick={selectNone} size="sm" variant="outline" className="h-7 text-xs border-slate-700 text-red-400 hover:text-red-300">None</Button>
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
                                            <div className={`absolute top-1 right-1 p-0.5 rounded-full ${page.selected ? 'bg-red-500' : 'bg-slate-700'}`}>
                                                {page.selected ? <Check size={12} className="text-white" /> : <X size={12} className="text-slate-400" />}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                         )}
                         
                         {/* --- LIST VIEW (MERGE / COMPRESS) --- */}
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
                                 
                                 <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-red-950/30" onClick={() => {
                                     const newFiles = files.filter((_, idx) => idx !== i);
                                     setFiles(newFiles);
                                     if (newFiles.length === 0) setSplitPages([]); // Cleanup
                                 }}>
                                     <Trash2 size={16} />
                                 </Button>
                             </div>
                         ))}
                         
                         {/* --- NEW: MINI DROPZONE (ADD MORE) --- */}
                         {/* Allows adding more files without clearing the list */}
                         <div 
                            onClick={openDropzone}
                            className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-800 rounded-xl cursor-pointer hover:bg-slate-900/50 hover:border-slate-700 text-slate-500 transition-all"
                         >
                            <Plus size={16} />
                            <span className="text-sm font-medium">Add another PDF</span>
                         </div>
                     </div>
                 )}

                 {/* 3. SETTINGS & ACTIONS */}
                 {files.length > 0 && (
                     <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 space-y-6 animate-in slide-in-from-top-2">
                         {activeTool === 'compress' && (
                             <div className="space-y-4">
                                 <div className="flex justify-between items-end">
                                     <div className="space-y-1">
                                         <span className="text-sm text-slate-400">Compression Strength</span>
                                         <p className="text-xs text-slate-500">Lower quality = Smaller size</p>
                                     </div>
                                     <div className="text-right">
                                         <span className="text-blue-400 font-bold text-lg">{compressionQuality}%</span>
                                         {/* PREDICTED SIZE BADGE */}
                                         <p className="text-xs text-green-400 font-mono mt-1">
                                             Est. Output: ~{getPredictedSize()}
                                         </p>
                                     </div>
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
                                disabled={isProcessing || (activeTool === 'merge' && files.length < 2)}
                                className={`h-10 px-8 font-medium min-w-[140px]
                                    ${activeTool === 'merge' || activeTool === 'split' ? "bg-red-600 hover:bg-red-500" : activeTool === 'compress' ? "bg-blue-600 hover:bg-blue-500" : "bg-yellow-600 hover:bg-yellow-500 text-black"}
                                `}
                             >
                                 {isProcessing ? `Processing ${progress > 0 ? `${progress}%` : '...'}` : 
                                    activeTool === 'merge' ? "Merge PDFs" : 
                                    activeTool === 'compress' ? (files.length > 1 ? `Compress ${files.length} Files` : "Compress PDF") :
                                    activeTool === 'split' ? "Split PDF" : "Convert to Images"
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