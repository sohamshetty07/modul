"use client";

import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatBytes } from "@/core/utils"; // Make sure to import this!

interface ImageSettingsProps {
  quality: number;
  setQuality: (val: number) => void;
  resize: number;
  setResize: (val: number) => void;
  format: string;
  originalSize: number; // New Prop!
}

export default function ImageSettings({ quality, setQuality, resize, setResize, format, originalSize }: ImageSettingsProps) {
  
  // Simple math estimation
  // JPG/WEBP usually scale linearly with Quality. Resize scales by square (area).
  const estimateSize = () => {
     // Format Factor: Switching from PNG to JPG/PDF saves ~85% of size immediately
     const isPngToLossy = (format === 'jpg' || format === 'pdf') && originalSize > 0;
     const formatFactor = isPngToLossy ? 0.15 : 1.0; 

     // Resize Factor: Area scales by square (0.5 scale = 0.25 area)
     const resizeFactor = resize * resize;
     
     // Quality Factor: 
     // For JPG: 90% quality is ~100% of "base optimized size". 
     // 10% quality is ~10% size.
     const qualityFactor = format === 'png' ? 1 : (quality / 100);

     return originalSize * formatFactor * resizeFactor * qualityFactor;
  };

  return (
    <div className="p-4 bg-slate-950/50 rounded-xl space-y-4 border border-slate-800 animate-in slide-in-from-top-2">
      <div className="grid grid-cols-2 gap-4">
        
        {/* Quality Slider */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label className="text-xs text-slate-400">Quality</Label>
            <span className="text-xs text-orange-500 font-mono">{quality}%</span>
          </div>
          <Slider 
            value={[quality]} 
            onValueChange={(val: number[]) => setQuality(val[0])} 
            max={100} 
            step={1}
            className="[&_.bg-primary]:bg-orange-500" 
          />
        </div>

        {/* Resize Dropdown (Fixed Dark Text) */}
        <div className="space-y-3">
          <Label className="text-xs text-slate-400">Resize</Label>
          <Select value={resize.toString()} onValueChange={(val) => setResize(Number(val))}>
            <SelectTrigger className="h-8 text-xs bg-slate-900 border-slate-700 text-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
              <SelectItem value="1">Original (100%)</SelectItem>
              <SelectItem value="0.75">75% Scale</SelectItem>
              <SelectItem value="0.5">50% Scale</SelectItem>
              <SelectItem value="0.25">25% Scale</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* The "Estimated Size" Display */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/50">
          <span className="text-[10px] text-slate-500">Estimated Output:</span>
          <span className="text-xs font-mono text-green-400">
             ~{formatBytes(estimateSize())}
          </span>
      </div>

      {format === 'pdf' && (
         <p className="text-[10px] text-slate-500 italic">
           * PDF pages will automatically adjust to image dimensions.
         </p>
      )}
    </div>
  );
}