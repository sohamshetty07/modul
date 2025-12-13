"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileAudio, Loader2, Copy, Download, RefreshCw, Music, Mic, Square, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

export default function Transcriber() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState("");
  const [status, setStatus] = useState<"idle" | "loading_model" | "decoding" | "done" | "error">("idle");
  const [progress, setProgress] = useState(0);
  
  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const worker = useRef<Worker | null>(null);

  useEffect(() => {
    if (!worker.current) {
      // Final fix: Using the absolute path string to ensure iOS finds the file
      worker.current = new Worker('/worker.js', {
        type: 'module'
      });
    }

    const onMessage = (e: MessageEvent) => {
      const { status, progress, output, error } = e.data;
      
      if (status === 'initiate') setStatus('loading_model');
      if (status === 'progress') setProgress(progress);
      if (status === 'decoding') setStatus('decoding');
      if (status === 'complete') {
          setResult(output);
          setStatus('done');
      }
      if (status === 'error') {
          console.error("Worker Error:", error);
          setStatus('error');
          toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
      }
    };

    worker.current.addEventListener('message', onMessage);
    return () => worker.current?.removeEventListener('message', onMessage);
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      processFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'audio/*': ['.mp3', '.wav', '.m4a'] },
    maxFiles: 1
  });

  // RECORDING LOGIC
  const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        chunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        mediaRecorderRef.current.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
            const recordedFile = new File([blob], "recording.webm", { type: "audio/webm" });
            processFile(recordedFile); // Reuse the processing logic
            
            // Cleanup stream
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
        setRecordingTime(0);
        
        // Start Timer
        timerRef.current = setInterval(() => {
            setRecordingTime(prev => prev + 1);
        }, 1000);

    } catch (err) {
        console.error(err);
        toast({ title: "Microphone Access Denied", variant: "destructive" });
    }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
          if (timerRef.current) clearInterval(timerRef.current);
      }
  };

  const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // UNIFIED PROCESSING LOGIC (Handles Uploads & Recordings)
  const processFile = async (inputAudio: File) => {
      setFile(inputAudio);
      setResult("");
      setProgress(0);
      
      if (!worker.current) return;
      
      try {
          setStatus("loading_model");
          
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
          const channelData = renderedBuffer.getChannelData(0);

          worker.current.postMessage({ audio: channelData });

      } catch (err) {
          console.error("Audio Processing Error:", err);
          setStatus('error');
          toast({ title: "Could not process audio", variant: "destructive" });
      }
  };

  const copyText = () => {
      navigator.clipboard.writeText(result);
      toast({ title: "Copied to clipboard!" });
  };

  const downloadText = () => {
      const blob = new Blob([result], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transcript.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
       <div className="text-center space-y-2">
           <h2 className="text-3xl font-bold text-white flex items-center justify-center gap-2">
               <Music className="text-blue-500" /> 
               Audio Transcriber
           </h2>
           <p className="text-slate-400">Convert speech to text locally using OpenAI Whisper.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          
          {/* Input Area */}
          <div className="space-y-4">
             {/* Dropzone with Conditional Recording View */}
             <div 
                {...getRootProps()} 
                className={`relative h-64 rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center overflow-hidden
                    ${isDragActive ? "border-blue-500 bg-blue-500/10" : "border-slate-800 bg-slate-900/50"}
                    ${!isRecording ? "cursor-pointer hover:bg-slate-800/50" : ""}
                `}
             >
                {!isRecording && <input {...getInputProps()} />}
                
                {isRecording ? (
                    // RECORDING STATE
                    <div className="space-y-4 animate-pulse">
                         <div className="w-20 h-20 mx-auto bg-red-500/20 text-red-500 rounded-full flex items-center justify-center border border-red-500/50">
                             <Mic size={40} />
                         </div>
                         <div className="space-y-1">
                             <p className="font-bold text-2xl text-white">{formatTime(recordingTime)}</p>
                             <p className="text-sm text-red-400">Recording in progress...</p>
                         </div>
                    </div>
                ) : file ? (
                    // FILE LOADED STATE
                    <div className="space-y-4">
                         <div className="w-16 h-16 mx-auto bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center">
                             <FileAudio size={32} />
                         </div>
                         <p className="font-medium text-slate-200 truncate max-w-[200px]">{file.name}</p>
                    </div>
                ) : (
                    // IDLE STATE
                    <div className="space-y-4 p-6">
                        <div className="w-16 h-16 mx-auto bg-slate-800 rounded-2xl flex items-center justify-center">
                            <Upload className="text-slate-400" size={32} />
                        </div>
                        <div>
                            <p className="text-lg font-medium text-slate-200">Drop audio file</p>
                            <p className="text-sm text-slate-500">MP3, WAV, M4A</p>
                        </div>
                    </div>
                )}
             </div>

             {/* Action Buttons */}
             {status === 'idle' && !isRecording && !file && (
                 <div className="grid grid-cols-1 gap-3">
                     <Button 
                        onClick={(e) => { e.stopPropagation(); startRecording(); }}
                        className="w-full bg-slate-800 hover:bg-slate-700 h-12 text-lg border border-slate-700"
                     >
                         <Mic className="mr-2 text-red-400" /> Record Audio
                     </Button>
                 </div>
             )}
             
             {isRecording && (
                 <Button onClick={stopRecording} className="w-full bg-red-600 hover:bg-red-500 h-12 text-lg animate-in fade-in">
                     <Square className="mr-2 fill-current" /> Stop & Transcribe
                 </Button>
             )}

             {status === 'loading_model' && (
                 <div className="space-y-2">
                     <div className="flex justify-between text-xs text-slate-400">
                         <span>Loading AI Model...</span>
                         <span>{Math.round(progress)}%</span>
                     </div>
                     <Progress value={progress} className="h-2" />
                 </div>
             )}

             {status === 'decoding' && (
                 <Button disabled className="w-full bg-slate-800 text-blue-400 h-12">
                     <Loader2 className="animate-spin mr-2" /> Deciphering Audio...
                 </Button>
             )}
          </div>

          {/* Output Area (Same as before) */}
          <div className="space-y-4">
               <div className="relative">
                   <Textarea 
                       value={result}
                       readOnly
                       placeholder="Transcription will appear here..."
                       className="min-h-[400px] bg-slate-950 border-slate-800 text-slate-300 p-6 text-lg leading-relaxed resize-none focus-visible:ring-blue-500/50"
                   />
                   
                   {status === 'done' && (
                       <div className="absolute bottom-4 right-4 flex gap-2">
                           <Button size="icon" variant="secondary" onClick={copyText} className="h-8 w-8 bg-slate-800 hover:bg-slate-700 text-slate-200">
                               <Copy size={14} />
                           </Button>
                           <Button size="icon" variant="secondary" onClick={downloadText} className="h-8 w-8 bg-slate-800 hover:bg-slate-700 text-slate-200">
                               <Download size={14} />
                           </Button>
                       </div>
                   )}
               </div>
               
               {status === 'done' && (
                   <Button variant="outline" onClick={() => { setFile(null); setStatus('idle'); setResult(""); }} className="w-full border-slate-800 text-slate-500 hover:text-white">
                       <RefreshCw size={14} className="mr-2" /> Transcribe Another
                   </Button>
               )}
          </div>
      </div>
    </div>
  );
}