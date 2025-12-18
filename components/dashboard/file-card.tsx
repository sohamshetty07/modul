"use client";

import { useState, useEffect } from "react";
import { 
  FileText, Image as ImageIcon, Video, Music, X, RotateCw, 
  Settings2, TerminalSquare, Pencil, Check, ChevronUp 
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { formatBytes, getFileCategory, getFileExtension } from "@/core/utils";
import { useConversion } from "@/hooks/use-conversion";
import ImageSettings from "@/components/settings/image-settings";
import VideoSettings from "@/components/settings/video-settings";
import Terminal from "@/components/dashboard/terminal";
import { cn } from "@/lib/utils"; 

interface FileCardProps {
  file: File;
  onRemove: () => void;
  onConvert?: (format: string, settings: any) => void;
  status?: string;
  progress?: number;
  downloadUrl?: string | null;
}

export default function FileCard({ file, onRemove }: FileCardProps) {
  const [format, setFormat] = useState<string>(""); 
  const [showSettings, setShowSettings] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  
  // --- GENERAL SETTINGS ---
  const [quality, setQuality] = useState(90);
  const [resize, setResize] = useState(1);
  const [muteAudio, setMuteAudio] = useState(false);

  // --- PDF PRO SETTINGS ---
  const [pdfFit, setPdfFit] = useState<'fit' | 'a4' | 'letter'>('fit'); 
  const [pdfMargin, setPdfMargin] = useState(10);
  const [pdfPageScale, setPdfPageScale] = useState(1); 
  const [pdfAlignX, setPdfAlignX] = useState<'left'|'center'|'right'>('center');
  const [pdfAlignY, setPdfAlignY] = useState<'top'|'center'|'bottom'>('center');
  
  // --- RENAMING STATE ---
  const [isRenaming, setIsRenaming] = useState(false);
  const [fileNameDisplay, setFileNameDisplay] = useState(file.name);
  
  const category = getFileCategory(file);
  const { status, progress, convertFile, downloadUrl, outputFileName, setOutputFileName, logs } = useConversion();

  const getOutputFormats = () => {
      if (category === "video") return ["mp4", "mov", "mkv", "gif", "mp3"];
      if (category === "image") return ["jpg", "png", "webp", "pdf"];
      if (category === "audio") return ["mp3", "wav", "aac"];
      if (category === "pdf") return ["pdf", "jpg", "png"];
      return [];
  };

  const availableFormats = getOutputFormats();

  useEffect(() => {
      if (availableFormats.length > 0 && !format) {
          setFormat(availableFormats[0]);
      }
  }, [availableFormats, format]);

  useEffect(() => {
    if (outputFileName) {
        setFileNameDisplay(outputFileName);
    }
  }, [outputFileName]);

  const handleConvert = () => {
    setShowTerminal(false);
    convertFile(file, format, { 
        quality, 
        resize, 
        mute: muteAudio,
        pdfFit,
        pdfMargin,
        pdfPageScale,
        pdfAlignX,
        pdfAlignY
    });
  };

  const handleDownload = () => {
    if (downloadUrl) {
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = fileNameDisplay; 
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const saveRename = () => {
      setIsRenaming(false);
      if (outputFileName) {
          setOutputFileName(fileNameDisplay);
      }
  };

  const iconMap: Record<string, React.ReactNode> = {
    video: <Video className="text-orange-500" />,
    audio: <Music className="text-blue-500" />,
    image: <ImageIcon className="text-purple-500" />,
    pdf: <FileText className="text-red-500" />,
    text: <FileText className="text-slate-500" />,
    unknown: <FileText className="text-slate-500" />,
  };

  return (
    // FIX: Using 'h-auto' and 'min-h-min' forces the container to respect content height. 
    // Removed all transition classes from the card container to prevent height locking.
    <Card className="bg-slate-900 border-slate-800 hover:border-slate-700 h-auto min-h-min w-full overflow-visible">
      <CardContent className="p-4 flex flex-col gap-0">
        
        {/* RESPONSIVE CONTAINER */}
        <div className="flex flex-col md:flex-row md:items-center gap-4">
            
            {/* TOP ROW: Icon + Info */}
            <div className="flex items-center gap-4 w-full md:w-auto flex-1">
                <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
                        {iconMap[category] || <FileText />}
                    </div>
                    {status === "done" && (
                        <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1 shadow-lg shadow-green-900/50">
                             <Check size={10} className="text-black font-bold" />
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    {isRenaming ? (
                        <div className="flex items-center gap-2">
                            <Input 
                                value={fileNameDisplay}
                                onChange={(e) => setFileNameDisplay(e.target.value)}
                                className="h-7 text-xs bg-slate-950 border-slate-700 text-white placeholder:text-slate-500 w-full"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && saveRename()}
                            />
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-green-500 shrink-0 hover:bg-green-500/10" onClick={saveRename}>
                                <Check size={14} />
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 mb-1 group cursor-pointer" onClick={() => setIsRenaming(true)}>
                            <h4 className="font-medium text-slate-200 truncate max-w-[150px] md:max-w-[200px] text-sm" title={fileNameDisplay}>
                                {fileNameDisplay}
                            </h4>
                            <Pencil size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-orange-500" />
                        </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-mono">{formatBytes(file.size)}</span>
                        {status === "converting" && <span className="text-orange-500 animate-pulse hidden sm:inline font-bold uppercase tracking-wider">• Processing {progress}%</span>}
                    </div>
                    
                    {status === "converting" && (
                        <Progress value={progress} className="h-1 mt-2 bg-slate-800" indicatorColor="bg-orange-500" />
                    )}
                </div>
            </div>

            {/* ACTIONS */}
            <div className="flex items-center justify-between md:justify-end gap-2 w-full md:w-auto border-t border-slate-800 pt-3 md:border-0 md:pt-0 mt-1 md:mt-0">
                {status === "idle" && (
                    <>
                        <div className="flex items-center gap-2">
                            <Select value={format} onValueChange={setFormat}>
                                <SelectTrigger className="w-[85px] h-8 bg-slate-950 border-slate-700 text-slate-200 text-[10px] font-bold uppercase tracking-wider focus:ring-orange-500/50">
                                <SelectValue placeholder="FMT" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-800 text-slate-300">
                                    {availableFormats.map((fmt) => (
                                        <SelectItem key={fmt} value={fmt} className="text-xs focus:bg-slate-800 focus:text-white">
                                            {fmt.toUpperCase()}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {(category === 'image' || category === 'video' || category === 'pdf') && (
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className={cn(
                                        "h-8 w-8 border transition-all",
                                        showSettings ? "bg-slate-800 border-orange-500/50 text-orange-500" : "border-slate-700 bg-slate-900 text-slate-400 hover:text-white"
                                    )}
                                    onClick={() => setShowSettings(!showSettings)}
                                >
                                    <Settings2 size={14} />
                                </Button>
                            )}
                        </div>

                        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                            <Button onClick={handleConvert} size="sm" className="bg-orange-600 hover:bg-orange-500 text-white h-8 px-4 text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-orange-900/20">
                                Convert
                            </Button>
                            
                            <button onClick={onRemove} className="text-slate-600 hover:text-red-400 ml-1 p-1 transition-colors">
                                <X size={16} />
                            </button>
                        </div>
                    </>
                )}

                {/* Download Area */}
                {status === "done" && (
                    <div className="flex items-center gap-2 w-full justify-end animate-in fade-in">
                        <Button 
                            variant="ghost" 
                            size="icon"
                            className={cn("h-8 w-8", showTerminal ? 'text-green-500 bg-green-500/10' : 'text-slate-500 hover:text-white')}
                            onClick={() => setShowTerminal(!showTerminal)}
                            title="View Logs"
                        >
                            <TerminalSquare size={14} />
                        </Button>

                        <Button onClick={handleDownload} size="sm" className="bg-green-600 hover:bg-green-500 text-white h-8 px-4 text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-green-900/20">
                            Download
                        </Button>
                        <button onClick={onRemove} className="text-slate-600 hover:text-red-400 ml-2 transition-colors">
                            <X size={16} />
                        </button>
                    </div>
                )}
            </div>
        </div>

        {/* SETTINGS DRAWER */}
        {/* FIX: Removed 'animate-in' to prevent height locking. Added explicit padding 'pb-4'. */}
        {showSettings && status === "idle" && (
            <div className="mt-4 pt-4 border-t border-slate-800 h-auto">
                 <div className="space-y-6">
                     {(category === 'image' || category === 'pdf') && (
                         <ImageSettings 
                            quality={quality} setQuality={setQuality} 
                            resize={resize} setResize={setResize} 
                            format={format}
                            originalSize={file.size}
                            pdfFit={pdfFit} setPdfFit={setPdfFit}
                            pdfMargin={pdfMargin} setPdfMargin={setPdfMargin}
                            pdfPageScale={pdfPageScale} setPdfPageScale={setPdfPageScale}
                            pdfAlignX={pdfAlignX} setPdfAlignX={setPdfAlignX}
                            pdfAlignY={pdfAlignY} setPdfAlignY={setPdfAlignY}
                         />
                     )}
                     {category === 'video' && (
                         <VideoSettings 
                            quality={quality} setQuality={setQuality}
                            resize={resize} setResize={setResize}
                            mute={muteAudio} setMute={setMuteAudio}
                         />
                     )}
                 </div>
                 
                 <div className="flex justify-center mt-6 pb-2">
                     <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setShowSettings(false)}
                        className="h-6 text-[10px] uppercase text-slate-500 hover:text-slate-300"
                     >
                        <ChevronUp size={12} className="mr-1" /> Close Settings
                     </Button>
                 </div>
            </div>
        )}

        {/* TERMINAL DRAWER (Local) */}
        {showTerminal && logs.length > 0 && (
            <div className="mt-4 p-3 bg-black rounded-lg border border-slate-800 font-mono text-[10px] h-32 overflow-y-auto">
                {logs.map((log, i) => (
                    <div key={i} className="text-slate-400 border-b border-slate-900/50 pb-1 mb-1 last:border-0">
                        {log}
                    </div>
                ))}
            </div>
        )}
      </CardContent>
    </Card>
  );
}