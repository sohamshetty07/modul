"use client";

import { useState } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { loadFFmpeg } from "@/core/ffmpeg-load";
import { getFileExtension } from "@/core/utils";
import { jsPDF } from "jspdf";

export type ConversionStatus = "idle" | "converting" | "done" | "error";

export interface ConversionSettings {
  quality?: number; // 0-100
  resize?: number;  // 0.25, 0.5, 0.75, 1
  mute?: boolean;   // Remove Audio
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

  const convertFile = async (file: File, toFormat: string, settings: ConversionSettings = {}) => {
    setStatus("converting");
    setProgress(0);
    setError(null);
    setDownloadUrl(null);
    setLogs([]);

    // 1. Safe Naming Logic
    const inputExt = getFileExtension(file.name).toLowerCase(); // Force lowercase
    let actualOutputExt = toFormat;
    
    // PDF -> JPG Edge Case
    if (file.type === 'application/pdf' && (toFormat === 'jpg' || toFormat === 'jpeg')) {
        actualOutputExt = 'jpg';
    }

    const outputName = file.name.replace(new RegExp(`\\.${inputExt}$`, 'i'), `.${actualOutputExt}`);
    
    const quality = settings.quality ?? 90;
    const resize = settings.resize ?? 1;

    const log = (msg: string) => setLogs(prev => [...prev, `> ${msg}`]);

    try {
      // --- STRATEGY: PDF INPUT ---
      if (file.type === 'application/pdf') {
          log("Detected PDF input. Initializing PDF Engine...");
          setProgress(10);
          
          const pdfjsLib = await loadPdfLib();
          log("PDF Engine loaded successfully.");
          
          const arrayBuffer = await file.arrayBuffer();
          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          const totalPages = pdf.numPages;
          log(`PDF loaded. Pages: ${totalPages}`);

          if (toFormat === 'pdf') {
              log("Mode: PDF Compression via Re-rendering");
              const newPdf = new jsPDF();
              
              for (let i = 1; i <= totalPages; i++) {
                  log(`Processing page ${i}/${totalPages}...`);
                  setProgress(10 + Math.round((i / totalPages) * 80));
                  
                  const page = await pdf.getPage(i);
                  const viewport = page.getViewport({ scale: 1.5 });
                  
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');
                  canvas.width = viewport.width;
                  canvas.height = viewport.height;
                  
                  if (ctx) {
                      await page.render({ canvasContext: ctx, viewport }).promise;
                      
                      const finalWidth = canvas.width * resize;
                      const finalHeight = canvas.height * resize;
                      const tempCanvas = document.createElement('canvas');
                      tempCanvas.width = finalWidth;
                      tempCanvas.height = finalHeight;
                      const tCtx = tempCanvas.getContext('2d');
                      
                      if(tCtx) {
                          tCtx.fillStyle = '#FFFFFF';
                          tCtx.fillRect(0, 0, finalWidth, finalHeight);
                          tCtx.drawImage(canvas, 0, 0, finalWidth, finalHeight);
                          
                          const compressedData = tempCanvas.toDataURL('image/jpeg', quality / 100);
                          const pdfW = newPdf.internal.pageSize.getWidth();
                          const pdfH = newPdf.internal.pageSize.getHeight();
                          
                          if (i > 1) newPdf.addPage();
                          newPdf.addImage(compressedData, 'JPEG', 0, 0, pdfW, pdfH);
                      }
                  }
              }
              const blob = newPdf.output("blob");
              setDownloadUrl(URL.createObjectURL(blob));
              log("PDF Generation complete.");
          } 
          else {
              log(`Mode: Converting Page 1 to ${toFormat.toUpperCase()}`);
              const page = await pdf.getPage(1);
              const viewport = page.getViewport({ scale: 2.0 });
              
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              canvas.width = viewport.width;
              canvas.height = viewport.height;
              
              if(ctx) {
                  await page.render({ canvasContext: ctx, viewport }).promise;
                  
                  const finalWidth = canvas.width * resize;
                  const finalHeight = canvas.height * resize;
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
                      const dataUrl = tempCanvas.toDataURL(mimeType, quality / 100);
                      
                      const byteString = atob(dataUrl.split(',')[1]);
                      const ab = new ArrayBuffer(byteString.length);
                      const ia = new Uint8Array(ab);
                      for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
                      
                      const blob = new Blob([ab], { type: mimeType });
                      setDownloadUrl(URL.createObjectURL(blob));
                  }
              }
              log("Image rendered and encoded.");
          }

          setOutputFileName(outputName);
          setStatus("done");
          setProgress(100);
          return;
      }

      // --- STRATEGY: IMAGE PROCESSING ---
      if (file.type.startsWith("image/")) {
         log("Detected Image input. Using Canvas Engine.");
         setProgress(20);
         const reader = new FileReader();
         reader.readAsDataURL(file);
         
         reader.onload = () => {
             const img = new Image();
             img.src = reader.result as string;
             
             img.onload = () => {
                 log(`Image Loaded. Dimensions: ${img.width}x${img.height}`);
                 setProgress(40);
                 const scale = settings.resize || 1;
                 const finalWidth = img.width * scale;
                 const finalHeight = img.height * scale;

                 const canvas = document.createElement('canvas');
                 canvas.width = finalWidth;
                 canvas.height = finalHeight;
                 const ctx = canvas.getContext('2d');
                 
                 if (!ctx) { setStatus("error"); return; }
                 
                 if (toFormat === 'jpg' || toFormat === 'pdf' || toFormat === 'jpeg') {
                     ctx.fillStyle = '#FFFFFF';
                     ctx.fillRect(0, 0, finalWidth, finalHeight);
                 }
                 
                 ctx.drawImage(img, 0, 0, finalWidth, finalHeight);

                 if (toFormat === 'pdf') {
                     log("Generating PDF from image...");
                     const qualityParam = (settings.quality || 90) / 100;
                     const compressedData = canvas.toDataURL('image/jpeg', qualityParam);
                     
                     const pdf = new jsPDF();
                     const pdfWidth = pdf.internal.pageSize.getWidth();
                     const pdfHeight = pdf.internal.pageSize.getHeight();
                     
                     const imgProps = pdf.getImageProperties(compressedData);
                     const pdfImgHeight = (imgProps.height * pdfWidth) / imgProps.width;
                     
                     let renderHeight = pdfImgHeight;
                     let renderWidth = pdfWidth;
                     
                     if (pdfImgHeight > pdfHeight) {
                         const ratio = pdfHeight / pdfImgHeight;
                         renderHeight = pdfHeight;
                         renderWidth = pdfWidth * ratio;
                     }
                     
                     pdf.addImage(compressedData, 'JPEG', 0, 0, renderWidth, renderHeight);
                     const blob = pdf.output("blob");
                     setDownloadUrl(URL.createObjectURL(blob));
                 } else {
                     log(`Encoding to ${toFormat.toUpperCase()}...`);
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
                 log("Done.");
                 setOutputFileName(outputName);
                 setStatus("done");
                 setProgress(100);
             };
         };
         return; 
      }

      // --- STRATEGY: VIDEO/AUDIO (FFmpeg) ---
      log("Video/Audio detected. Loading FFmpeg Core...");
      const ffmpeg = await loadFFmpeg();
      log("FFmpeg Ready.");
      
      ffmpeg.on("log", ({ message }) => log(message));
      ffmpeg.on("progress", ({ progress }) => setProgress(Math.round(progress * 100)));

      const inputName = `input.${inputExt}`;
      const ffmpegOutputName = `output.${toFormat}`;

      // 1. Cleanup Memory (Fixes "FS Error" from previous runs)
      try {
          await ffmpeg.deleteFile(inputName);
          await ffmpeg.deleteFile(ffmpegOutputName);
      } catch (e) { /* ignore cleanup errors */ }

      await ffmpeg.writeFile(inputName, await fetchFile(file));
      log(`File written to memory: ${inputName}`);

      let command = ["-i", inputName];

      // --- COMMAND GENERATION ---
      
      // Case 1: MP3 Audio Extraction
      if (toFormat === "mp3") {
          command = [...command, "-vn", "-acodec", "libmp3lame", "-q:a", "2"];
      }
      
      // Case 2: Video Conversion (MP4, MOV, MKV)
      else if (toFormat === "mp4" || toFormat === "mov" || toFormat === "mkv") {
          
          // A. Apply Resizing
          if (settings.resize && settings.resize !== 1) {
             const scale = settings.resize;
             command = [...command, "-vf", `scale=trunc(iw*${scale}/2)*2:trunc(ih*${scale}/2)*2`];
          }

          // B. Force H.264 Codec for ALL video formats (Safe & Reliable)
          // Previously this only ran for "mp4", causing MOV to crash
          const qualityVal = settings.quality ?? 90;
          const crf = Math.round(51 - (qualityVal * 0.33)); 
          
          command = [
              ...command, 
              "-vcodec", "libx264", 
              "-pix_fmt", "yuv420p", // Critical for QuickTime (MOV) compatibility
              "-crf", String(crf), 
              "-preset", "ultrafast"
          ];
          
          // C. Apply Mute
          if (settings.mute) {
             command = [...command, "-an"];
          }
      }
      
      // Case 3: GIF (Smart Quality)
      else if (toFormat === "gif") {
          // Map Quality (0-100) to FPS (5-30)
          const qualityVal = settings.quality ?? 90;
          const fps = Math.max(5, Math.round((qualityVal / 100) * 30));
          
          // Map Resize to Width (default 100% is original width, but capped for safety)
          // If user picked 100% (val 1), we use -1 (auto). 
          // If user picked 50%, we use scale filter.
          const scaleFilter = (settings.resize && settings.resize !== 1) 
              ? `scale=trunc(iw*${settings.resize}/2)*2:trunc(ih*${settings.resize}/2)*2` 
              : "scale=trunc(iw/2)*2:trunc(ih/2)*2"; // Default to original (ensure even dimensions)

          command = [...command, "-vf", `fps=${fps},${scaleFilter}:flags=lanczos`];
      }

      // Finalize command
      command.push(ffmpegOutputName);

      log(`Executing: ffmpeg ${command.join(" ")}`);
      await ffmpeg.exec(command);
      log("Processing complete. Reading output...");
      
      // Check if output exists (Fixes blind crash)
      try {
          const data = await ffmpeg.readFile(ffmpegOutputName);
          
          let mimeType = `video/${toFormat}`;
          if (toFormat === 'mp3') mimeType = 'audio/mpeg';
          if (toFormat === 'wav') mimeType = 'audio/wav';
          if (toFormat === 'gif') mimeType = 'image/gif';

          const blob = new Blob([data as any], { type: mimeType });
          setDownloadUrl(URL.createObjectURL(blob));
          setOutputFileName(outputName);
          setStatus("done");
          setProgress(100);

          // Cleanup
          await ffmpeg.deleteFile(inputName);
          await ffmpeg.deleteFile(ffmpegOutputName);
      } catch (readError) {
          log("CRITICAL: Output file not found. FFmpeg failed to generate file.");
          throw new Error("Conversion failed. Check logs.");
      }

    } catch (err: any) {
      console.error(err);
      log(`ERROR: ${err.message}`);
      setError(err.message || "Conversion failed");
      setStatus("error");
    }
  };

  return { status, progress, error, downloadUrl, outputFileName, setOutputFileName, convertFile, logs };
}