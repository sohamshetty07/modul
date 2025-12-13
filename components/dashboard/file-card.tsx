"use client";

import { useState, useEffect } from "react";
import { FileText, Image as ImageIcon, Video, Music, X, RotateCw, Settings2, TerminalSquare, Pencil, Check } from "lucide-react";
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

interface FileCardProps {
  file: File;
  onRemove: () => void;
  onConvert?: (format: string) => void; 
}

export default function FileCard({ file, onRemove }: FileCardProps) {
  const [format, setFormat] = useState<string>(""); 
  const [showSettings, setShowSettings] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [quality, setQuality] = useState(90);
  const [resize, setResize] = useState(1);
  const [muteAudio, setMuteAudio] = useState(false);
  
  // Renaming State
  const [isRenaming, setIsRenaming] = useState(false);
  const [fileNameDisplay, setFileNameDisplay] = useState(file.name);
  
  const category = getFileCategory(file);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const currentExt = getFileExtension(file.name);
  
  const { status, progress, convertFile, downloadUrl, outputFileName, setOutputFileName, logs } = useConversion();

  const getOutputFormats = () => {
      if (category === "video") return ["mp4", "mov", "mk4", "gif", "mp3"];
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

  // Sync the display name with the output name when conversion finishes
  useEffect(() => {
    if (outputFileName) {
        setFileNameDisplay(outputFileName);
    }
  }, [outputFileName]);

  const handleConvert = () => {
    setShowTerminal(false);
    convertFile(file, format, { quality, resize, mute: muteAudio });
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
    <Card className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-all">
      <CardContent className="p-4">
        {/* RESPONSIVE CONTAINER: Flex column on Mobile, Row on Desktop */}
        <div className="flex flex-col md:flex-row md:items-center gap-4">
            
            {/* TOP ROW: Icon + Info */}
            <div className="flex items-center gap-4 w-full md:w-auto flex-1">
                {/* Icon Area */}
                <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center">
                        {iconMap[category] || <FileText />}
                    </div>
                    {status === "done" && (
                        <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1">
                        <RotateCw size={10} className="text-black font-bold animate-spin-once" />
                        </div>
                    )}
                </div>

                {/* Info Area */}
                <div className="flex-1 min-w-0">
                    {isRenaming ? (
                        <div className="flex items-center gap-2">
                            <Input 
                                value={fileNameDisplay}
                                onChange={(e) => setFileNameDisplay(e.target.value)}
                                className="h-7 text-xs bg-slate-950 border-slate-700 text-white placeholder:text-slate-500 w-full"
                                autoFocus
                            />
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-green-500 shrink-0" onClick={saveRename}>
                                <Check size={14} />
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 mb-1 group">
                            <h4 className="font-medium text-slate-200 truncate max-w-[150px] md:max-w-[200px]" title={fileNameDisplay}>
                                {fileNameDisplay}
                            </h4>
                            <button 
                                onClick={() => setIsRenaming(true)} 
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-orange-500"
                            >
                                <Pencil size={12} />
                            </button>
                        </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>{formatBytes(file.size)}</span>
                        {status === "converting" && <span className="text-orange-500 animate-pulse hidden sm:inline">• Converting... {progress}%</span>}
                    </div>
                    
                    {status === "converting" && (
                        <Progress value={progress} className="h-1 mt-2 bg-slate-800" indicatorColor="bg-orange-500" />
                    )}
                </div>
            </div>

            {/* BOTTOM ROW (Mobile) / RIGHT SIDE (Desktop): Actions */}
            {/* Added border-t for visual separation on mobile */}
            <div className="flex items-center justify-between md:justify-end gap-2 w-full md:w-auto border-t border-slate-800 pt-3 md:border-0 md:pt-0 mt-1 md:mt-0">
                {status === "idle" && (
                    <>
                        <div className="flex items-center gap-2">
                            <Select value={format} onValueChange={setFormat}>
                                <SelectTrigger className="w-[80px] h-8 bg-slate-800 border-slate-600 text-slate-200 text-xs focus:ring-orange-500 focus:ring-offset-0">
                                <SelectValue placeholder="Format" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableFormats.map((fmt) => (
                                        <SelectItem key={fmt} value={fmt}>
                                            {fmt.toUpperCase()}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {(category === 'image' || category === 'video' || category === 'pdf') && (
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className={`h-8 w-8 border border-slate-600 bg-slate-800 hover:bg-slate-700 hover:text-orange-500 ${showSettings ? 'text-orange-500 border-orange-500/50' : 'text-slate-400'}`}
                                    onClick={() => setShowSettings(!showSettings)}
                                >
                                    <Settings2 size={14} />
                                </Button>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <Button onClick={handleConvert} size="sm" className="bg-orange-600 hover:bg-orange-500 text-white h-8 px-3 text-xs">
                                Convert
                            </Button>
                            
                            <button onClick={onRemove} className="text-slate-500 hover:text-red-400 ml-1 p-1">
                                <X size={16} />
                            </button>
                        </div>
                    </>
                )}

                {/* Download Area */}
                {status === "done" && (
                    <div className="flex items-center gap-2 w-full justify-end">
                        <Button 
                            variant="ghost" 
                            size="icon"
                            className={`h-8 w-8 ${showTerminal ? 'text-green-500 bg-green-500/10' : 'text-slate-500'}`}
                            onClick={() => setShowTerminal(!showTerminal)}
                        >
                            <TerminalSquare size={14} />
                        </Button>

                        <Button onClick={handleDownload} size="sm" className="bg-green-600 hover:bg-green-500 text-white h-8 px-3 text-xs">
                            Download
                        </Button>
                        <button onClick={onRemove} className="text-slate-500 hover:text-red-400 ml-2">
                            <X size={16} />
                        </button>
                    </div>
                )}
            </div>
        </div>

        {/* Drawers Area */}
        {showSettings && status === "idle" && (
            <div className="mt-4 animate-in slide-in-from-top-2">
                 {(category === 'image' || category === 'pdf') && (
                     <ImageSettings 
                        quality={quality} setQuality={setQuality} 
                        resize={resize} setResize={setResize} 
                        format={format}
                        originalSize={file.size}
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
        )}

        {/* Terminal Drawer */}
        {(showTerminal || status === 'converting') && (
            <Terminal logs={logs} />
        )}
      </CardContent>
    </Card>
  );
}