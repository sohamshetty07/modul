"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileAudio, Loader2, Copy, Download, RefreshCw, Music, Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useFileStore } from "@/hooks/use-file-transfer"; // <--- Added for hand-off

// 1. Define Props to accept initialFile
interface TranscriberProps {
  initialFile?: File | null;
}

export default function Transcriber({ initialFile }: TranscriberProps) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState("");
  const setPreloadedFile = useFileStore((state) => state.setPreloadedFile); // <--- Added
  
  const [status, setStatus] = useState<"idle" | "initiating" | "loading_model" | "decoding" | "done" | "error">("idle");
  const [progress, setProgress] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const worker = useRef<Worker | null>(null);

  // 2. THE CATCHER LOGIC: Handle file from home page
  useEffect(() => {
    if (initialFile && initialFile.type.startsWith('audio/')) {
        processFile(initialFile);
        
        // Clear global store so it doesn't re-trigger
        setPreloadedFile(null);
        
        toast({ 
            title: "Audio Received", 
            description: "Neural Engine initializing for local transcription." 
        });
    }
  }, [initialFile, setPreloadedFile]);

  useEffect(() => {
    if (!worker.current) {
      worker.current = new Worker('/worker.js', { type: 'module' });
    }

    const onMessage = (e: MessageEvent) => {
      const { status, progress, output, error } = e.data;
      if (status === 'initiate') setStatus('initiating');
      if (status === 'progress') { setStatus('loading_model'); setProgress(progress); }
      if (status === 'decoding') setStatus('decoding');
      if (status === 'complete') { setResult(output); setStatus('done'); }
      if (status === 'error') { setStatus('error'); toast({ title: "Error", variant: "destructive" }); }
    };

    worker.current.addEventListener('message', onMessage);
    return () => worker.current?.removeEventListener('message', onMessage);
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) processFile(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'audio/*': ['.mp3', '.wav', '.m4a'] },
    maxFiles: 1
  });

  const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        chunksRef.current = [];
        mediaRecorderRef.current.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
        mediaRecorderRef.current.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
            const recordedFile = new File([blob], "recording.webm", { type: "audio/webm" });
            processFile(recordedFile);
            stream.getTracks().forEach(track => track.stop());
        };
        mediaRecorderRef.current.start();
        setIsRecording(true);
        setRecordingTime(0);
        timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } catch (err) { toast({ title: "Microphone Denied", variant: "destructive" }); }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
          if (timerRef.current) clearInterval(timerRef.current);
      }
  };

  const processFile = async (inputAudio: File) => {
      setFile(inputAudio);
      setResult("");
      setProgress(0);
      if (!worker.current) return;
      try {
          setStatus("initiating");
          const arrayBuffer = await inputAudio.arrayBuffer();
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          const targetRate = 16000;
          const offlineCtx = new OfflineAudioContext(1, audioBuffer.duration * targetRate, targetRate);
          const source = offlineCtx.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(offlineCtx.destination);
          source.start(0);
          const renderedBuffer = await offlineCtx.startRendering();
          worker.current.postMessage({ audio: renderedBuffer.getChannelData(0) });
      } catch (err) { setStatus('error'); toast({ title: "Processing failed", variant: "destructive" }); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className="text-center space-y-2">
           <h2 className="text-3xl font-bold text-white flex items-center justify-center gap-2 tracking-tighter">
               <Music className="text-blue-500" /> 
               Audio Transcriber
           </h2>
           <p className="text-slate-400 text-sm">Convert speech to text locally using OpenAI Whisper.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="space-y-4">
             <div 
                {...getRootProps()} 
                className={`relative h-64 rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center overflow-hidden
                    ${isDragActive ? "border-blue-500 bg-blue-500/10" : "border-slate-800 bg-slate-900/50"}
                    ${!isRecording ? "cursor-pointer hover:bg-slate-800/50" : ""}
                `}
             >
                {!isRecording && <input {...getInputProps()} />}
                {isRecording ? (
                    <div className="space-y-4 animate-pulse">
                         <div className="w-20 h-20 mx-auto bg-red-500/20 text-red-500 rounded-full flex items-center justify-center border border-red-500/50">
                             <Mic size={40} />
                         </div>
                         <div className="space-y-1">
                             <p className="font-bold text-2xl text-white">{recordingTime}s</p>
                             <p className="text-[10px] font-bold uppercase tracking-widest text-red-400">Bunker Recording...</p>
                         </div>
                    </div>
                ) : file ? (
                    <div className="space-y-4">
                         <div className="w-16 h-16 mx-auto bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center">
                             <FileAudio size={32} />
                         </div>
                         <p className="text-xs font-bold text-slate-200 uppercase tracking-widest truncate max-w-[200px]">{file.name}</p>
                    </div>
                ) : (
                    <div className="space-y-4 p-6">
                        <div className="w-16 h-16 mx-auto bg-slate-800 rounded-2xl flex items-center justify-center">
                            <Upload className="text-slate-400" size={32} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-200 uppercase tracking-[0.2em]">Drop Audio</p>
                            <p className="text-[10px] text-slate-500 font-mono mt-1">MP3 • WAV • M4A</p>
                        </div>
                    </div>
                )}
             </div>

             {status === 'idle' && !isRecording && !file && (
                 <Button onClick={(e) => { e.stopPropagation(); startRecording(); }} className="w-full bg-slate-900 hover:bg-slate-800 h-12 text-[10px] font-bold uppercase tracking-widest border border-slate-800">
                     <Mic className="mr-2 text-red-500" size={14} /> Start Voice Record
                 </Button>
             )}
             
             {isRecording && (
                 <Button onClick={stopRecording} className="w-full bg-red-600 hover:bg-red-500 h-12 text-[10px] font-bold uppercase tracking-widest">
                     <Square className="mr-2 fill-current" size={14} /> Stop & Transcribe
                 </Button>
             )}

             {status === 'initiating' && (
                 <Button disabled className="w-full bg-slate-900 text-blue-400 h-12 text-[10px] font-bold uppercase tracking-widest border border-slate-800">
                     <Loader2 className="animate-spin mr-2" size={14} /> Booting Neural Engine
                 </Button>
             )}

             {status === 'loading_model' && (
                 <div className="space-y-3 p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
                     <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                         <span>Syncing Weights</span>
                         <span>{Math.round(progress)}%</span>
                     </div>
                     <Progress value={progress} className="h-1.5" />
                 </div>
             )}

             {status === 'decoding' && (
                 <Button disabled className="w-full bg-slate-900 text-green-400 h-12 text-[10px] font-bold uppercase tracking-widest border border-slate-800">
                     <Loader2 className="animate-spin mr-2" size={14} /> Decoding Binary
                 </Button>
             )}
          </div>

          <div className="space-y-4">
               <div className="relative">
                   <Textarea 
                       value={result}
                       readOnly
                       placeholder="Neural output will appear here..."
                       className="min-h-[400px] bg-slate-950 border-slate-800 text-slate-300 p-6 text-sm leading-relaxed resize-none focus-visible:ring-blue-500/50"
                   />
                   {status === 'done' && (
                       <div className="absolute bottom-4 right-4 flex gap-2">
                           <Button size="icon" variant="secondary" onClick={() => { navigator.clipboard.writeText(result); toast({ title: "Copied" }); }} className="h-8 w-8 bg-slate-800 text-slate-200"><Copy size={14} /></Button>
                           <Button size="icon" variant="secondary" onClick={() => { /* download logic */ }} className="h-8 w-8 bg-slate-800 text-slate-200"><Download size={14} /></Button>
                       </div>
                   )}
               </div>
               {status === 'done' && (
                   <Button variant="outline" onClick={() => { setFile(null); setStatus('idle'); setResult(""); }} className="w-full border-slate-800 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                       <RefreshCw size={14} className="mr-2" /> New Transcription
                   </Button>
               )}
          </div>
      </div>
    </div>
  );
}