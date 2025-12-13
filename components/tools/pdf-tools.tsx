"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
// ADDED MoveUp and MoveDown back to imports
import { FileText, Trash2, Layers, GripVertical, Pencil, Image as ImageIcon, Minimize2, Scissors, Check, X, Plus, CheckSquare, Square, MoveUp, MoveDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { PDFDocument } from "pdf-lib";
import { jsPDF } from "jspdf";
import JSZip from "jszip";
import { toast } from "@/hooks/use-toast";
import { formatBytes } from "@/core/utils";

// Interface for page thumbnails (Splitter)
interface PDFPage {
    index: number;
    url: string;
    selected: boolean;
}

// Interface for File Management
interface ManagedFile {
    id: string; 
    file: File;
    selected: boolean; 
}

export default function PDFTools() {
  const [activeTool, setActiveTool] = useState("merge");
  const [files, setFiles] = useState<ManagedFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [progress, setProgress] = useState(0);
  
  // Settings
  const [outputName, setOutputName] = useState("document");
  const [compressionQuality, setCompressionQuality] = useState(70); 

  // Splitter State
  const [splitPages, setSplitPages] = useState<PDFPage[]>([]);

  // --- HELPER: Get currently active file object ---
  const getActiveFile = () => files.find(f => f.id === activeFileId)?.file || null;
  const getSelectedFiles = () => files.filter(f => f.selected);

  // --- PREDICTED SIZE CALCULATOR ---
  const getPredictedSize = () => {
      const selected = getSelectedFiles();
      if (selected.length === 0) return "0 KB";
      const totalSize = selected.reduce((acc, f) => acc + f.file.size, 0);
      const ratio = 0.2 + (0.8 * Math.pow(compressionQuality / 100, 2));
      return formatBytes(totalSize * ratio);
  };

  // --- THUMBNAIL GENERATION ---
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

  // --- EFFECT: Handle File Switching in Split Mode ---
  useEffect(() => {
      if (activeTool === 'split' && activeFileId) {
          const f = getActiveFile();
          if (f) {
              generateThumbnails(f);
              setOutputName(f.name.substring(0, f.name.lastIndexOf('.')) + '-split');
          }
      }
  }, [activeFileId, activeTool]); // eslint-disable-line

  // --- TAB SWITCH HANDLER ---
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

  // --- DROPZONE ---
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

  const toggleFileSelection = (id: string) => {
      setFiles(prev => prev.map(f => f.id === id ? { ...f, selected: !f.selected } : f));
  };

  // FIXED: Changed types to 'number' to allow -1 and 1 without strict check issues
  const moveFile = (index: number, direction: number) => {
      const newFiles = [...files];
      const newIndex = index + direction;
      
      // Bounds check
      if (newIndex < 0 || newIndex >= newFiles.length) return;
      
      const temp = newFiles[index];
      newFiles[index] = newFiles[newIndex];
      newFiles[newIndex] = temp;
      setFiles(newFiles);
  };

  const togglePageSelection = (index: number) => {
      setSplitPages(prev => prev.map(page => 
          page.index === index ? { ...page, selected: !page.selected } : page
      ));
  };

  // --- ACTION 1: MERGE ---
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
          console.error(err);
          toast({ title: "Merge Failed", variant: "destructive" });
      } finally { setIsProcessing(false); }
  };

  // --- ACTION 2: COMPRESS ---
  const handleCompress = async () => {
      const selected = getSelectedFiles();
      if (selected.length === 0) return;
      setIsProcessing(true);
      setProgress(0);
      
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
                  const fileProgress = (i / totalPages) * 100;
                  const totalProgress = ((fIndex * 100) + fileProgress) / selected.length;
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
              
              if (selected.length === 1) {
                  downloadBlob(compressedBlob, `${outputName}-compressed.pdf`, "application/pdf");
                  toast({ title: "Compression Complete", description: `Saved ${formatBytes(item.file.size - compressedBlob.size)}`, className: "bg-green-600 text-white border-none" });
                  setIsProcessing(false);
                  return;
              }
              zip.file(`${item.file.name.replace('.pdf', '')}-opt.pdf`, compressedBlob);
          }
          
          const content = await zip.generateAsync({ type: "blob" });
          downloadBlob(content, `${outputName}-batch.zip`, "application/zip");
          toast({ title: "Batch Compression Complete", className: "bg-green-600 text-white border-none" });

      } catch (err) {
          console.error(err);
          toast({ title: "Failed to compress", variant: "destructive" });
      } finally { setIsProcessing(false); setProgress(0); }
  };

  // --- ACTION 3: TO IMAGES ---
  const handleToImages = async () => {
    const file = getActiveFile(); 
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
      const file = getActiveFile();
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
  
  const selectAllPages = () => setSplitPages(prev => prev.map(p => ({ ...p, selected: true })));
  const selectNonePages = () => setSplitPages(prev => prev.map(p => ({ ...p, selected: false })));

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
      {/* GLOBAL INPUT */}
      <input {...getInputProps()} />

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
                 {/* 1. EMPTY STATE */}
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
                                <p className="text-lg font-medium text-slate-200">
                                    {activeTool === 'merge' ? "Drop PDFs to combine" : "Drop PDFs to process"}
                                </p>
                                <p className="text-sm text-slate-500">Processing locally</p>
                             </div>
                        </div>
                     </div>
                 ) : (
                     <div className="space-y-4">
                         
                         {/* TOP: FILE SELECTOR FOR SPLIT/IMAGES */}
                         {(activeTool === 'split' || activeTool === 'images') && files.length > 0 && (
                             <div className="bg-slate-900/50 border border-slate-800 p-2 rounded-xl flex gap-2 overflow-x-auto">
                                 {files.map((f) => (
                                     <button
                                        key={f.id}
                                        onClick={() => setActiveFileId(f.id)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-2
                                            ${activeFileId === f.id ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}
                                        `}
                                     >
                                         {f.file.name}
                                     </button>
                                 ))}
                                 <button onClick={openDropzone} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700">
                                     <Plus size={14} />
                                 </button>
                             </div>
                         )}

                         {/* SPLIT VIEW (THUMBNAILS) */}
                         {activeTool === 'split' && getActiveFile() && (
                            <div className="flex flex-col gap-4">
                                <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-3 rounded-xl">
                                    <p className="text-sm text-slate-300 font-medium truncate">{getActiveFile()?.name} ({splitPages.length} Pgs)</p>
                                    <div className="flex gap-2">
                                        <Button onClick={selectAllPages} size="sm" variant="outline" className="h-7 text-xs border-slate-700 text-green-400 hover:text-green-300">All</Button>
                                        <Button onClick={selectNonePages} size="sm" variant="outline" className="h-7 text-xs border-slate-700 text-red-400 hover:text-red-300">None</Button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2">
                                    {/* FIXED: Added types to map for TypeScript */}
                                    {splitPages.map((page: PDFPage) => (
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
                         
                         {/* LIST VIEW (MERGE / COMPRESS) */}
                         {activeTool !== 'split' && files.map((item, i) => (
                             <div key={item.id} className={`flex items-center gap-4 p-3 bg-slate-900 border rounded-xl group transition-all
                                ${item.selected ? 'border-blue-500/30' : 'border-slate-800 hover:border-slate-700'}
                             `}>
                                 {/* CHECKBOX */}
                                 {(activeTool === 'merge' || activeTool === 'compress') && (
                                     <button 
                                        onClick={() => toggleFileSelection(item.id)}
                                        className={`shrink-0 ${item.selected ? 'text-blue-500' : 'text-slate-600 hover:text-slate-400'}`}
                                     >
                                         {item.selected ? <CheckSquare size={20} /> : <Square size={20} />}
                                     </button>
                                 )}

                                 {activeTool === 'merge' && (
                                    <div className="text-slate-600 cursor-grab active:cursor-grabbing">
                                        <GripVertical size={16} />
                                    </div>
                                 )}
                                 
                                 <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center text-red-500 font-bold text-xs">PDF</div>
                                 <div className="flex-1 min-w-0">
                                     <p className={`text-sm font-medium truncate ${item.selected ? 'text-slate-200' : 'text-slate-500'}`}>
                                         {item.file.name}
                                     </p>
                                     <p className="text-xs text-slate-500">{formatBytes(item.file.size)}</p>
                                 </div>
                                 
                                 {activeTool === 'merge' && (
                                     <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                         <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-white" onClick={() => moveFile(i, -1)}><MoveUp size={14} /></Button>
                                         <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-white" onClick={() => moveFile(i, 1)}><MoveDown size={14} /></Button>
                                     </div>
                                 )}
                                 
                                 <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-red-950/30" onClick={() => {
                                     const newFiles = files.filter(f => f.id !== item.id);
                                     setFiles(newFiles);
                                     if (activeFileId === item.id && newFiles.length > 0) setActiveFileId(newFiles[0].id);
                                     if (newFiles.length === 0) setSplitPages([]);
                                 }}>
                                     <Trash2 size={16} />
                                 </Button>
                             </div>
                         ))}
                         
                         {/* MINI DROPZONE */}
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
                                disabled={
                                    isProcessing || 
                                    (activeTool === 'merge' && getSelectedFiles().length < 2) ||
                                    (activeTool === 'compress' && getSelectedFiles().length === 0) ||
                                    (activeTool === 'split' && splitPages.filter(p => p.selected).length === 0)
                                }
                                className={`h-10 px-8 font-medium min-w-[140px]
                                    ${activeTool === 'merge' || activeTool === 'split' ? "bg-red-600 hover:bg-red-500" : activeTool === 'compress' ? "bg-blue-600 hover:bg-blue-500" : "bg-yellow-600 hover:bg-yellow-500 text-black"}
                                `}
                             >
                                 {isProcessing ? `Processing ${progress > 0 ? `${progress}%` : '...'}` : 
                                    activeTool === 'merge' ? `Merge ${getSelectedFiles().length} PDFs` : 
                                    activeTool === 'compress' ? `Compress ${getSelectedFiles().length} Files` :
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