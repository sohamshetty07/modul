"use client";

import { useState, useRef } from "react";
import { 
    Video, Mic, MicOff, Monitor, StopCircle, 
    Download, RefreshCw, Circle, Square, Pencil 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // 1. Import Input
import { cn } from "@/lib/utils";
import { formatTime, formatBytes } from "@/core/utils"; // 2. Import formatBytes

export default function ScreenRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaBlobUrl, setMediaBlobUrl] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);
  const [hasAudio, setHasAudio] = useState(true);
  
  // 3. New State for File Metadata
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true 
      });

      let finalStream = displayStream;
      // Note: If you want to mix mic audio, you'd add logic here to combine tracks.
      // For now, we rely on the system audio/mic selection in the browser prompt.

      const recorder = new MediaRecorder(displayStream, { mimeType: 'video/webm; codecs=vp9' });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        
        // 4. Set Metadata on Stop
        setMediaBlobUrl(url);
        setFileSize(blob.size);
        setFileName(`Screen Recording ${new Date().toLocaleTimeString()}`);
        
        displayStream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      mediaRecorderRef.current = recorder;

      if (videoRef.current) {
          videoRef.current.srcObject = displayStream;
      }

      setTimer(0);
      timerRef.current = setInterval(() => {
          setTimer(t => t + 1);
      }, 1000);

      displayStream.getVideoTracks()[0].onended = () => {
          stopRecording();
      };

    } catch (err) {
      console.error("Error starting screen record:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
  };

  const reset = () => {
      setMediaBlobUrl(null);
      setTimer(0);
      setFileSize(0);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
        
        {/* HEADER */}
        <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-white flex items-center justify-center gap-2 tracking-tighter">
                <Video className="text-cyan-500" /> Screen Recorder
            </h2>
            <p className="text-slate-400 text-sm">Capture screen & audio instantly. No cloud upload.</p>
        </div>

        {/* MAIN STAGE */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-1 shadow-2xl overflow-hidden backdrop-blur-xl relative min-h-[500px] flex flex-col">
            
            {/* VIEWPORT */}
            <div className="flex-1 bg-black relative flex items-center justify-center rounded-2xl overflow-hidden m-1 border border-slate-900">
                {!isRecording && !mediaBlobUrl && (
                    <div className="text-center space-y-6 p-8">
                        <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center mx-auto border border-slate-800">
                            <Monitor className="text-slate-600" size={40} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-white">Ready to Record?</h3>
                            <p className="text-slate-500 text-sm max-w-md mx-auto">
                                Grant permission to share your screen. Recordings are processed locally in your browser memory.
                            </p>
                        </div>
                        <div className="flex justify-center gap-4">
                             <Button 
                                variant="outline"
                                onClick={() => setHasAudio(!hasAudio)}
                                className={cn("border-slate-800 hover:bg-slate-800", hasAudio ? "text-cyan-400" : "text-slate-500")}
                             >
                                {hasAudio ? <Mic size={16} className="mr-2"/> : <MicOff size={16} className="mr-2"/>}
                                {hasAudio ? "Audio On" : "Audio Muted"}
                             </Button>
                             <Button 
                                onClick={startRecording}
                                className="bg-cyan-600 hover:bg-cyan-500 text-black font-bold px-8"
                             >
                                <Circle size={16} className="mr-2 fill-black" /> Start Recording
                             </Button>
                        </div>
                    </div>
                )}

                {isRecording && (
                    <div className="relative w-full h-full">
                        <video ref={videoRef} autoPlay muted className="w-full h-full object-contain" />
                        <div className="absolute top-4 right-4 bg-red-500/90 text-white px-3 py-1.5 rounded-full text-xs font-bold font-mono animate-pulse flex items-center gap-2">
                            <div className="w-2 h-2 bg-white rounded-full" />
                            REC {formatTime(timer)}
                        </div>
                    </div>
                )}

                {mediaBlobUrl && (
                    <video src={mediaBlobUrl} controls className="w-full h-full object-contain" />
                )}
            </div>

            {/* CONTROLS FOOTER */}
            {(isRecording || mediaBlobUrl) && (
                <div className="h-24 bg-slate-950 border-t border-slate-800 flex items-center justify-between px-8 gap-6">
                    
                    {/* LEFT: Status / Reset */}
                    <div className="flex items-center gap-4 min-w-[120px]">
                        {isRecording ? (
                             <div className="text-cyan-500 font-mono text-xl font-bold tracking-widest">
                                 {formatTime(timer)}
                             </div>
                        ) : (
                             <Button onClick={reset} variant="ghost" className="text-slate-500 hover:text-white">
                                 <RefreshCw size={16} className="mr-2" /> New
                             </Button>
                        )}
                    </div>

                    {/* CENTER: File Details (Only when review) */}
                    {!isRecording && mediaBlobUrl && (
                        <div className="flex-1 max-w-md flex items-center gap-3 bg-slate-900/50 p-2 rounded-xl border border-slate-800">
                            <div className="p-2 bg-slate-800 rounded-lg text-slate-400">
                                <Pencil size={14} />
                            </div>
                            <Input 
                                value={fileName}
                                onChange={(e) => setFileName(e.target.value)}
                                className="border-none bg-transparent h-8 text-sm font-bold text-white focus-visible:ring-0 px-0"
                                placeholder="Enter filename..."
                            />
                            <div className="px-3 py-1 bg-cyan-950/30 text-cyan-400 text-[10px] font-mono font-bold rounded-lg border border-cyan-500/20 whitespace-nowrap">
                                {formatBytes(fileSize)}
                            </div>
                        </div>
                    )}

                    {/* RIGHT: Action */}
                    <div className="min-w-[120px] flex justify-end">
                        {isRecording ? (
                            <Button onClick={stopRecording} className="bg-red-500 hover:bg-red-600 text-white font-bold px-8 rounded-full shadow-lg shadow-red-900/20">
                                <Square size={16} className="mr-2 fill-current" /> Stop
                            </Button>
                        ) : (
                            <a href={mediaBlobUrl!} download={`${fileName}.webm`}>
                                <Button className="bg-cyan-600 hover:bg-cyan-500 text-black font-bold px-8 shadow-lg shadow-cyan-900/20">
                                    <Download size={16} className="mr-2" /> Download
                                </Button>
                            </a>
                        )}
                    </div>
                </div>
            )}
        </div>
    </div>
  );
}