"use client";

import { useState } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { loadFFmpeg } from "@/core/media/ffmpeg-load";
import { getFileExtension } from "@/core/utils";
import { jsPDF } from "jspdf";
import JSZip from "jszip"; // <--- ADDED: For batch image downloads
import { useTerminal } from "./use-terminal"; 

export type ConversionStatus = "idle" | "converting" | "done" | "error";

export interface ConversionSettings {
  quality?: number;      // 0-100
  resize?: number;       // 0.25, 0.5, 0.75, 1
  mute?: boolean;        // Remove Audio
  
  // --- CUTTER & STUDIO SETTINGS ---
  trimStart?: number;    // Start time in seconds
  trimEnd?: number;      // End time in seconds
  audioFilters?: ('denoise' | 'normalize')[]; // Audio processing filters

  // --- PDF PRO SETTINGS ---
  pdfFit?: 'fit' | 'a4' | 'letter';
  pdfMargin?: number;    // in Millimeters (mm)
  pdfPageScale?: number; // 0.1 to 1.0 (Image scaling on page)
  pdfAlignX?: 'left' | 'center' | 'right'; 
  pdfAlignY?: 'top' | 'center' | 'bottom';
  pdfBgColor?: string;   // Hex code (e.g. #FFFFFF)
}

// --- HELPER: Load PDF.js from CDN ---
const loadPdfLib = async () => {
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

export function useConversion() {
  const [status, setStatus] = useState<ConversionStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [outputFileName, setOutputFileName] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  
  const { addLog } = useTerminal();

  const convertFile = async (file: File, targetFormat: string, settings: ConversionSettings = {}) => {
    setStatus("converting");
    setProgress(0);
    setError(null);
    setDownloadUrl(null);
    setLogs([]);

    const toFormat = targetFormat.toLowerCase();
    const inputExt = getFileExtension(file.name).toLowerCase(); 
    let actualOutputExt = toFormat;
    
    // Edge Case: PDF -> JPG detection
    if (file.type === 'application/pdf' && (toFormat === 'jpg' || toFormat === 'jpeg')) {
        actualOutputExt = 'jpg';
    }

    let outputName = file.name.replace(new RegExp(`\\.${inputExt}$`, 'i'), `.${actualOutputExt}`);
    
    // Log helper
    const log = (msg: string, type: 'system' | 'ffmpeg' | 'neural' | 'success' | 'error' = 'system') => {
        setLogs(prev => [...prev, `> ${msg}`]);
        addLog(msg, type);
    };

    try {
      // --- STRATEGY: PDF INPUT ---
      if (file.type === 'application/pdf') {
          log(`PDF Input: ${file.name}`, "system");
          setProgress(10);
          
          const pdfjsLib = await loadPdfLib();
          log("PDF Engine loaded successfully.", "success");
          
          const arrayBuffer = await file.arrayBuffer();
          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          const totalPages = pdf.numPages;
          log(`PDF loaded. Total Pages: ${totalPages}`, "system");

          // CASE A: PDF -> PDF (Compression)
          if (toFormat === 'pdf') {
              log("Mode: Local Compression via Canvas Re-render", "system");
              const newPdf = new jsPDF();
              
              for (let i = 1; i <= totalPages; i++) {
                  log(`Processing page ${i}/${totalPages}...`, "system");
                  setProgress(10 + Math.round((i / totalPages) * 80));
                  
                  const page = await pdf.getPage(i);
                  const viewport = page.getViewport({ scale: 1.5 });
                  
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');
                  canvas.width = viewport.width;
                  canvas.height = viewport.height;
                  
                  if (ctx) {
                      await page.render({ canvasContext: ctx, viewport }).promise;
                      
                      const finalWidth = canvas.width * (settings.resize || 1);
                      const finalHeight = canvas.height * (settings.resize || 1);
                      const tempCanvas = document.createElement('canvas');
                      tempCanvas.width = finalWidth;
                      tempCanvas.height = finalHeight;
                      const tCtx = tempCanvas.getContext('2d');
                      
                      if(tCtx) {
                          tCtx.fillStyle = '#FFFFFF';
                          tCtx.fillRect(0, 0, finalWidth, finalHeight);
                          tCtx.drawImage(canvas, 0, 0, finalWidth, finalHeight);
                          
                          const compressedData = tempCanvas.toDataURL('image/jpeg', (settings.quality || 90) / 100);
                          const pdfW = newPdf.internal.pageSize.getWidth();
                          const pdfH = newPdf.internal.pageSize.getHeight();
                          
                          if (i > 1) newPdf.addPage();
                          newPdf.addImage(compressedData, 'JPEG', 0, 0, pdfW, pdfH);
                      }
                  }
              }
              const blob = newPdf.output("blob");
              setDownloadUrl(URL.createObjectURL(blob));
              log("PDF Generation complete.", "success");
          } 
          // CASE B: PDF -> IMAGE (JPG/PNG)
          else {
              // 1. MULTI-PAGE HANDLING (ZIP)
              if (totalPages > 1) {
                  log(`Multi-page PDF detected (${totalPages} pages). Batch processing...`, "system");
                  const zip = new JSZip();
                  
                  for (let i = 1; i <= totalPages; i++) {
                      log(`Rendering Page ${i}/${totalPages} to ${toFormat.toUpperCase()}...`, "system");
                      setProgress(Math.round((i / totalPages) * 100));

                      const page = await pdf.getPage(i);
                      const viewport = page.getViewport({ scale: 2.0 }); // High Res
                      
                      const canvas = document.createElement('canvas');
                      const ctx = canvas.getContext('2d');
                      canvas.width = viewport.width; canvas.height = viewport.height;

                      if(ctx) {
                          await page.render({ canvasContext: ctx, viewport }).promise;

                          // Handle Resize if settings exist
                          let finalCanvas = canvas;
                          if (settings.resize && settings.resize !== 1) {
                              const tempCanvas = document.createElement('canvas');
                              tempCanvas.width = canvas.width * settings.resize;
                              tempCanvas.height = canvas.height * settings.resize;
                              const tCtx = tempCanvas.getContext('2d');
                              if(tCtx) {
                                  if (toFormat === 'jpg' || toFormat === 'jpeg') {
                                      tCtx.fillStyle = '#FFFFFF';
                                      tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
                                  }
                                  tCtx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);
                                  finalCanvas = tempCanvas;
                              }
                          } else if (toFormat === 'jpg' || toFormat === 'jpeg') {
                              const tempCanvas = document.createElement('canvas');
                              tempCanvas.width = canvas.width;
                              tempCanvas.height = canvas.height;
                              const tCtx = tempCanvas.getContext('2d');
                              if(tCtx) {
                                  tCtx.fillStyle = '#FFFFFF';
                                  tCtx.fillRect(0, 0, canvas.width, canvas.height);
                                  tCtx.drawImage(canvas, 0, 0);
                                  finalCanvas = tempCanvas;
                              }
                          }

                          const mimeType = toFormat === 'png' ? 'image/png' : 'image/jpeg';
                          const imgData = finalCanvas.toDataURL(mimeType, (settings.quality || 90) / 100);
                          
                          // Add to Zip
                          zip.file(`page_${i}.${actualOutputExt}`, imgData.split(',')[1], { base64: true });
                      }
                  }
                  
                  log("Generating ZIP archive...", "system");
                  const content = await zip.generateAsync({ type: "blob" });
                  setDownloadUrl(URL.createObjectURL(content));
                  outputName = file.name.replace(new RegExp(`\\.${inputExt}$`, 'i'), `.zip`);
                  log("Batch conversion complete.", "success");
              }
              // 2. SINGLE PAGE HANDLING (Direct Image)
              else {
                  log(`Single Page PDF. Converting to ${toFormat.toUpperCase()}...`, "system");
                  const page = await pdf.getPage(1);
                  const viewport = page.getViewport({ scale: 2.0 });
                  
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');
                  canvas.width = viewport.width; canvas.height = viewport.height;
                  
                  if(ctx) {
                      await page.render({ canvasContext: ctx, viewport }).promise;
                      
                      const scale = settings.resize || 1;
                      const finalWidth = canvas.width * scale;
                      const finalHeight = canvas.height * scale;
                      const tempCanvas = document.createElement('canvas');
                      tempCanvas.width = finalWidth;
                      tempCanvas.height = finalHeight;
                      const tCtx = tempCanvas.getContext('2d');
                      
                      if (tCtx) {
                          if (toFormat === 'jpg' || toFormat === 'jpeg') {
                              tCtx.fillStyle = '#FFFFFF';
                              tCtx.fillRect(0, 0, finalWidth, finalHeight);
                          }
                          tCtx.drawImage(canvas, 0, 0, finalWidth, finalHeight);
                          
                          const mimeType = toFormat === 'png' ? 'image/png' : 'image/jpeg';
                          const dataUrl = tempCanvas.toDataURL(mimeType, (settings.quality || 90) / 100);
                          
                          const byteString = atob(dataUrl.split(',')[1]);
                          const ab = new ArrayBuffer(byteString.length);
                          const ia = new Uint8Array(ab);
                          for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
                          
                          const blob = new Blob([ab], { type: mimeType });
                      setDownloadUrl(URL.createObjectURL(blob));
                      }
                  }
                  log("Frame rendering successful.", "success");
              }
          }

          setOutputFileName(outputName);
          setStatus("done");
          setProgress(100);
          return;
      }

      // --- STRATEGY: IMAGE PROCESSING (SMART PDF ENGINE) ---
      // Fix: Allow images destined for PDF to enter this block
      if (file.type.startsWith("image/")) {
         log("Detected Image input. Using Canvas Engine.", "system");
         setProgress(20);
         const reader = new FileReader();
         reader.readAsDataURL(file);
         
         reader.onload = () => {
             const img = new Image();
             img.src = reader.result as string;
             
             img.onload = () => {
                 log(`Image Loaded. Dimensions: ${img.width}x${img.height}`, "system");
                 setProgress(40);
                 
                 const scale = settings.resize || 1;
                 const finalWidth = img.width * scale;
                 const finalHeight = img.height * scale;

                 const canvas = document.createElement('canvas');
                 canvas.width = finalWidth;
                 canvas.height = finalHeight;
                 const ctx = canvas.getContext('2d');
                 
                 if (!ctx) { setStatus("error"); return; }
                 
                 // Background Color Handling
                 ctx.fillStyle = settings.pdfBgColor || '#FFFFFF';
                 // Ensure background is filled for formats that don't support transparency or if specifically requested
                 if (toFormat === 'jpg' || toFormat === 'pdf' || toFormat === 'jpeg') {
                    ctx.fillRect(0, 0, finalWidth, finalHeight);
                 }
                 
                 ctx.drawImage(img, 0, 0, finalWidth, finalHeight);

                 // --- SMART PDF GENERATION ---
                 if (toFormat === 'pdf') {
                     log("Generating Smart PDF...", "system");
                     const qualityParam = (settings.quality || 90) / 100;
                     
                     // Detect Orientation
                     const isLandscape = img.width > img.height;
                     const pdfOrientation = isLandscape ? 'l' : 'p';
                     
                     // MODE 1: FIT TO IMAGE (Simple)
                     if (settings.pdfFit === 'fit' || !settings.pdfFit) {
                         const pdf = new jsPDF({ 
                             orientation: pdfOrientation, 
                             unit: 'px', 
                             format: [finalWidth, finalHeight] 
                         });
                         
                         const compressedData = canvas.toDataURL('image/jpeg', qualityParam);
                         pdf.addImage(compressedData, 'JPEG', 0, 0, finalWidth, finalHeight);
                         
                         const blob = pdf.output("blob");
                         setDownloadUrl(URL.createObjectURL(blob));
                     } 
                     // MODE 2: PRO DOCUMENT (A4/Letter + Alignment + Scaling)
                     else {
                         const pageSize = settings.pdfFit; // 'a4' or 'letter'
                         const marginMm = settings.pdfMargin ?? 10; 
                         
                         const pdf = new jsPDF({ 
                             orientation: pdfOrientation, 
                             unit: 'mm', 
                             format: pageSize 
                         });

                         const pdfWidth = pdf.internal.pageSize.getWidth();
                         const pdfHeight = pdf.internal.pageSize.getHeight();
                         
                         // Available Content Area (Page minus margins)
                         const contentW = pdfWidth - (marginMm * 2);
                         const contentH = pdfHeight - (marginMm * 2);

                         // 1. Calculate Max "Fit" Dimensions
                         const imgRatio = finalWidth / finalHeight;
                         const pageRatio = contentW / contentH;
                         
                         let maxW, maxH;
                         
                         if (imgRatio > pageRatio) {
                             maxW = contentW;
                             maxH = contentW / imgRatio;
                         } else {
                             maxH = contentH;
                             maxW = contentH * imgRatio;
                         }

                         // 2. Apply User Scale (Default 1.0)
                         const pageScale = settings.pdfPageScale ?? 1;
                         const renderW = maxW * pageScale;
                         const renderH = maxH * pageScale;

                         // 3. Calculate Position based on Alignment
                         // Note: We use renderW/H now, not maxW/H
                         let x = marginMm; // Default Left
                         let y = marginMm; // Default Top

                         // X Axis Alignment
                         if (settings.pdfAlignX === 'center') x = (pdfWidth - renderW) / 2;
                         if (settings.pdfAlignX === 'right') x = pdfWidth - marginMm - renderW;
                         if (settings.pdfAlignX === 'left') x = marginMm;

                         // Y Axis Alignment
                         if (settings.pdfAlignY === 'center') y = (pdfHeight - renderH) / 2;
                         if (settings.pdfAlignY === 'bottom') y = pdfHeight - marginMm - renderH;
                         if (settings.pdfAlignY === 'top') y = marginMm;

                         const compressedData = canvas.toDataURL('image/jpeg', qualityParam);
                         pdf.addImage(compressedData, 'JPEG', x, y, renderW, renderH);
                         
                         const blob = pdf.output("blob");
                         setDownloadUrl(URL.createObjectURL(blob));
                     }
                 } 
                 // --- STANDARD IMAGE EXPORT ---
                 else {
                     log(`Encoding to ${toFormat.toUpperCase()}...`, "system");
                     const qualityParam = (settings.quality || 90) / 100;
                     const mimeType = toFormat === 'png' ? 'image/png' : 'image/jpeg';
                     const dataUrl = canvas.toDataURL(mimeType, qualityParam);
                     
                     const byteString = atob(dataUrl.split(',')[1]);
                     const ab = new ArrayBuffer(byteString.length);
                     const ia = new Uint8Array(ab);
                     for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
                     
                     const blob = new Blob([ab], { type: mimeType });
                     setDownloadUrl(URL.createObjectURL(blob));
                 }
                 log("Conversion finished.", "success");
                 setOutputFileName(outputName);
                 setStatus("done");
                 setProgress(100);
             };
         };
         return; 
      }

      // --- STRATEGY: VIDEO/AUDIO (FFmpeg) ---
      log("Media detected. Loading FFmpeg Core...", "system");
      const ffmpeg = await loadFFmpeg();
      log("FFmpeg Ready.", "success");
      
      ffmpeg.on("log", ({ message }) => log(message, "ffmpeg"));
      ffmpeg.on("progress", ({ progress }) => setProgress(Math.round(progress * 100)));

      const inputName = `input.${inputExt}`;
      const ffmpegOutputName = `output.${toFormat}`;

      // Cleanup Memory
      try {
          await ffmpeg.deleteFile(inputName);
          await ffmpeg.deleteFile(ffmpegOutputName);
      } catch (e) { /* ignore cleanup errors */ }

      await ffmpeg.writeFile(inputName, await fetchFile(file));
      log(`File written to memory: ${inputName}`, "system");

      let command = ["-i", inputName];

      // --- COMMAND GENERATION ---

      // 1. TRIM LOGIC (Applied before transcoding)
      if (settings.trimStart !== undefined) {
         command.push("-ss", settings.trimStart.toString());
      }
      if (settings.trimEnd !== undefined && settings.trimEnd > 0) {
         command.push("-to", settings.trimEnd.toString());
      }

      // 2. AUDIO & VIDEO FILTER LOGIC
      const filters: string[] = [];
      
      // Video/GIF resizing
      if ((toFormat === "mp4" || toFormat === "mov" || toFormat === "gif") && settings.resize && settings.resize !== 1) {
          const scale = settings.resize;
          filters.push(`scale=trunc(iw*${scale}/2)*2:trunc(ih*${scale}/2)*2`);
      }

      // Audio Filters (Denoise & Normalize)
      if (settings.audioFilters?.includes('denoise')) {
          filters.push("highpass=f=200,lowpass=f=3000");
      }
      if (settings.audioFilters?.includes('normalize')) {
          filters.push("dynaudnorm");
      }

      // Apply Filter Chain if exists
      if (filters.length > 0) {
          const isAudioOut = ['mp3', 'wav', 'aac', 'm4a'].includes(toFormat);
          command.push(isAudioOut ? "-af" : "-vf", filters.join(","));
      }
      
      // 3. FORMAT SPECIFIC ENCODING
      if (toFormat === "mp3") {
          // Force no video (-vn) to prevent cover art crashes
          command = [...command, "-vn", "-acodec", "libmp3lame", "-q:a", "2"];
      }
      else if (toFormat === "wav") {
          command = [...command, "-vn", "-acodec", "pcm_s16le"];
      }
      else if (toFormat === "m4a" || toFormat === "aac") {
          // FIX: Explicitly handle M4A/AAC using the native AAC encoder
          // -vn removes video (cover art) which causes crashes
          command = [...command, "-vn", "-acodec", "aac", "-strict", "experimental"];
      }
      else if (toFormat === "mp4" || toFormat === "mov" || toFormat === "mkv") {
          const qualityVal = settings.quality ?? 90;
          const crf = Math.round(51 - (qualityVal * 0.33)); 
          
          command = [
              ...command, 
              "-vcodec", "libx264", 
              "-pix_fmt", "yuv420p", // Critical for QuickTime compatibility
              "-crf", String(crf), 
              "-preset", "ultrafast"
          ];
          
          if (settings.mute) {
             command = [...command, "-an"];
          }
      }
      else if (toFormat === "gif") {
          const qualityVal = settings.quality ?? 90;
          const fps = Math.max(5, Math.round((qualityVal / 100) * 30));
          
          // Construct GIF filter chain
          const gifFilters = [...filters];
          gifFilters.push(`fps=${fps}`);
          gifFilters.push("flags=lanczos");
          
          // Remove previous -vf if set
          const vfIndex = command.indexOf("-vf");
          if (vfIndex > -1) {
              command.splice(vfIndex, 2); 
          }
          
          command.push("-vf", gifFilters.join(","));
      }

      command.push(ffmpegOutputName);

      log(`Executing: ffmpeg ${command.join(" ")}`, "ffmpeg");
      await ffmpeg.exec(command);
      log("Processing complete. Reading output...", "system");
      
      try {
          const data = await ffmpeg.readFile(ffmpegOutputName);
          
          // Map to correct MIME types
          const mimeMap: Record<string, string> = {
              mp3: 'audio/mpeg', 
              wav: 'audio/wav', 
              m4a: 'audio/mp4', // or audio/x-m4a
              aac: 'audio/aac',
              mp4: 'video/mp4', 
              mov: 'video/quicktime',
              gif: 'image/gif'
          };

          const blob = new Blob([data as any], { type: mimeMap[toFormat] || 'application/octet-stream' });
          setDownloadUrl(URL.createObjectURL(blob));
          setOutputFileName(outputName);
          setStatus("done");
          setProgress(100);
          log("Output verified and ready for download.", "success");

          await ffmpeg.deleteFile(inputName);
          await ffmpeg.deleteFile(ffmpegOutputName);
      } catch (readError) {
          log("CRITICAL: Output file not found. FFmpeg failed to generate file.", "error");
          throw new Error("Conversion failed. Check logs.");
      }

    } catch (err: any) {
      console.error(err);
      log(`ERROR: ${err.message}`, "error");
      setError(err.message || "Conversion failed");
      setStatus("error");
    }
  };

  return { 
      status, 
      progress, 
      error, 
      downloadUrl, 
      setDownloadUrl, 
      outputFileName, 
      setOutputFileName, 
      convertFile, 
      logs 
  };
}