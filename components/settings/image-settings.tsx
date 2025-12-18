"use client";

import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatBytes } from "@/core/utils";
import { AlignCenter, AlignLeft, AlignRight, AlignJustify, ScanLine, FileText, ArrowUpFromLine, ArrowDownFromLine } from "lucide-react";

interface ImageSettingsProps {
  quality: number;
  setQuality: (val: number) => void;
  resize: number;
  setResize: (val: number) => void;
  format: string;
  originalSize: number;
  
  // PDF PRO Props
  pdfFit?: string;
  setPdfFit?: (val: 'fit' | 'a4') => void;
  pdfMargin?: number;
  setPdfMargin?: (val: number) => void;
  pdfPageScale?: number;
  setPdfPageScale?: (val: number) => void;
  pdfAlignX?: 'left' | 'center' | 'right';
  setPdfAlignX?: (val: 'left' | 'center' | 'right') => void;
  pdfAlignY?: 'top' | 'center' | 'bottom';
  setPdfAlignY?: (val: 'top' | 'center' | 'bottom') => void;
}

export default function ImageSettings({ 
  quality, setQuality, 
  resize, setResize, 
  format, originalSize,
  pdfFit = 'fit', setPdfFit,
  pdfMargin = 10, setPdfMargin,
  pdfPageScale = 1, setPdfPageScale,
  pdfAlignX = 'center', setPdfAlignX,
  pdfAlignY = 'center', setPdfAlignY
}: ImageSettingsProps) {
  
  const isPdf = format === 'pdf';
  const isProMode = isPdf && pdfFit === 'a4';

  // --- RE-IMPLEMENTED ESTIMATION LOGIC ---
  const estimateSize = () => {
     if (!originalSize) return 0;

     // 1. Format Factor: Switching from PNG to JPG/PDF usually saves ~80% immediately
     // We assume the input is likely PNG/High-Res if the user is converting it.
     const isLossyTarget = (format === 'jpg' || format === 'pdf' || format === 'jpeg');
     const formatFactor = isLossyTarget ? 0.3 : 1.0; 

     // 2. Resize Factor: Area scales by square (0.5 scale = 0.25 area)
     const resizeFactor = resize * resize;
     
     // 3. Quality Factor: Linear approx for JPG
     // PNG (lossless) doesn't respect quality slider the same way, so we ignore it for PNG
     const qualityFactor = format === 'png' ? 1 : (quality / 100);

     return originalSize * formatFactor * resizeFactor * qualityFactor;
  };

  const estimatedBytes = estimateSize();
  const savings = originalSize - estimatedBytes;
  const isSaving = savings > 0;
  const savingsPercent = Math.round((Math.abs(savings) / originalSize) * 100);

  return (
    <div className="bg-slate-950/50 rounded-xl border border-slate-800 animate-in slide-in-from-top-2 overflow-hidden">
      
      <div className="flex flex-col md:flex-row">
        {/* LEFT COLUMN: Controls */}
        <div className="p-4 space-y-5 flex-1">
            
            {/* 1. LAYOUT MODE */}
            {isPdf && setPdfFit && (
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-lg">
                    <button 
                        onClick={() => setPdfFit('fit')}
                        className={`text-xs py-2 rounded-md transition-all font-medium flex items-center justify-center gap-2 ${pdfFit === 'fit' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <ScanLine size={14} /> Fit to Image
                    </button>
                    <button 
                        onClick={() => setPdfFit('a4')}
                        className={`text-xs py-2 rounded-md transition-all font-medium flex items-center justify-center gap-2 ${pdfFit === 'a4' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <FileText size={14} /> A4 Document
                    </button>
                </div>
            )}

            {/* 2. QUALITY & RESIZE */}
            <div className="space-y-4">
                 <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Quality / Compression</span>
                        <span className="text-orange-500">{quality}%</span>
                    </div>
                    <Slider value={[quality]} onValueChange={(v) => setQuality(v[0])} max={100} step={5} className="[&_.bg-primary]:bg-orange-500" />
                 </div>
                 
                 {/* Hide resize in Pro Mode to keep UI clean, or keep if you want users to scale inside the A4 page */}
                 <div className="space-y-2">
                    <Label className="text-xs text-slate-400">Resize Scale</Label>
                    <Select value={resize.toString()} onValueChange={(v) => setResize(Number(v))}>
                        <SelectTrigger className="h-7 text-xs bg-slate-900 border-slate-700"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">Original (1x)</SelectItem>
                            <SelectItem value="0.75">75% Scale</SelectItem>
                            <SelectItem value="0.5">50% Scale</SelectItem>
                            <SelectItem value="0.25">25% Scale</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
            </div>

            {/* 3. PRO CONTROLS (Margins, Scale & Align) */}
            {isProMode && setPdfMargin && setPdfAlignX && setPdfAlignY && setPdfPageScale && (
                <div className="space-y-4 pt-4 border-t border-slate-800/50">
                    
                    {/* NEW: IMAGE SCALE SLIDER */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-400">Image Scale</span>
                            <span className="text-blue-400">{Math.round(pdfPageScale * 100)}%</span>
                        </div>
                        <Slider 
                            value={[pdfPageScale]} 
                            onValueChange={(v) => setPdfPageScale(v[0])} 
                            max={1} 
                            step={0.05} 
                            min={0.1}
                            className="[&_.bg-primary]:bg-blue-500" 
                        />
                    </div>

                    {/* MARGINS */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-400">Page Padding</span>
                            <span className="text-blue-400">{pdfMargin}mm</span>
                        </div>
                        <Slider value={[pdfMargin]} onValueChange={(v) => setPdfMargin(v[0])} max={50} step={5} className="[&_.bg-primary]:bg-blue-500" />
                    </div>

                    {/* ALIGNMENT */}
                    <div className="space-y-2">
                        <Label className="text-xs text-slate-400">Alignment</Label>
                        <div className="flex gap-4">
                            <div className="grid grid-cols-3 gap-1 w-fit bg-slate-900 p-1 rounded-lg">
                                {['left', 'center', 'right'].map((x) => (
                                    <button 
                                        key={x}
                                        onClick={() => setPdfAlignX(x as any)}
                                        className={`w-8 h-8 flex items-center justify-center rounded transition-all ${pdfAlignX === x ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-800'}`}
                                    >
                                        {x === 'left' ? <AlignLeft size={14}/> : x === 'center' ? <AlignCenter size={14}/> : <AlignRight size={14}/>}
                                    </button>
                                ))}
                            </div>
                            <div className="grid grid-cols-3 gap-1 w-fit bg-slate-900 p-1 rounded-lg">
                                {['top', 'center', 'bottom'].map((y) => (
                                    <button 
                                        key={y}
                                        onClick={() => setPdfAlignY(y as any)}
                                        className={`w-8 h-8 flex items-center justify-center rounded transition-all ${pdfAlignY === y ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-800'}`}
                                    >
                                        {y === 'top' ? <ArrowUpFromLine size={14}/> : y === 'center' ? <AlignJustify size={14}/> : <ArrowDownFromLine size={14}/>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* ESTIMATION DISPLAY (Mobile / Standard Mode) */}
            {!isProMode && (
                <div className="pt-2 border-t border-slate-800/50 flex justify-between items-center">
                    <span className="text-[10px] text-slate-500 uppercase">Est. Size</span>
                    <div className="text-right">
                        <span className="text-xs font-mono text-green-400">~{formatBytes(estimatedBytes)}</span>
                        {isSaving && <span className="text-[10px] text-slate-500 ml-2">(-{savingsPercent}%)</span>}
                    </div>
                </div>
            )}
        </div>

        {/* RIGHT COLUMN: LIVE PREVIEW + STATS (Pro Mode Only) */}
        {isProMode && (
            <div className="w-full md:w-56 bg-black/40 border-l border-slate-800 flex flex-col justify-between">
                 <div className="flex flex-col items-center justify-center p-6 gap-3 flex-1">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Live Layout</span>
                    
                    {/* A4 PAPER VISUALIZER */}
                    <div className="relative bg-white w-28 h-36 shadow-2xl transition-all duration-300" style={{ padding: `${pdfMargin/2.5}px` }}> {/* Fake scaling for margin */}
                        
                        {/* Flex container mimics PDF alignment logic */}
                        <div className={`w-full h-full flex ${
                            pdfAlignY === 'top' ? 'items-start' : pdfAlignY === 'bottom' ? 'items-end' : 'items-center'
                        } ${
                            pdfAlignX === 'left' ? 'justify-start' : pdfAlignX === 'right' ? 'justify-end' : 'justify-center'
                        }`}>
                            {/* THE IMAGE MOCK (SCALABLE) */}
                            <div 
                                className="bg-slate-200 border border-slate-300 rounded-sm flex items-center justify-center text-[8px] text-slate-400 shadow-sm overflow-hidden transition-all duration-300"
                                style={{
                                    width: `${64 * pdfPageScale}px`,  // Base width 64px * scale
                                    height: `${48 * pdfPageScale}px`  // Base height 48px * scale
                                }}
                            >
                                <div className="w-full h-full bg-slate-300/50 flex items-center justify-center">IMG</div>
                            </div>
                        </div>

                        {/* Margin Guides (Visual Only) */}
                        <div className="absolute inset-0 border border-blue-500/30 pointer-events-none transition-all duration-300" style={{ margin: `${pdfMargin/2.5}px` }} />
                    </div>
                    
                    <p className="text-[9px] text-slate-600 text-center px-2">
                        Alignment snaps to A4 grid.
                    </p>
                 </div>

                 {/* PRO MODE ESTIMATION DISPLAY (Bottom of Right Column) */}
                 <div className="p-3 bg-slate-900/50 border-t border-slate-800">
                    <div className="flex justify-between items-end">
                        <span className="text-[10px] text-slate-500">Output</span>
                        <div className="text-right flex flex-col">
                            <span className="text-xs font-mono text-green-400">~{formatBytes(estimatedBytes)}</span>
                            {isSaving && <span className="text-[10px] text-slate-500">Saved {savingsPercent}%</span>}
                        </div>
                    </div>
                 </div>
            </div>
        )}
      </div>
    </div>
  );
}