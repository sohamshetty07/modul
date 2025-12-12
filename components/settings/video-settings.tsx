"use client";

import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface VideoSettingsProps {
  quality: number; // Used for CRF (Compression)
  setQuality: (val: number) => void;
  resize: number; // Used for Resolution scale
  setResize: (val: number) => void;
  mute: boolean;
  setMute: (val: boolean) => void;
}

export default function VideoSettings({ quality, setQuality, resize, setResize, mute, setMute }: VideoSettingsProps) {
  return (
    <div className="p-4 bg-slate-950/50 rounded-xl space-y-4 border border-slate-800 animate-in slide-in-from-top-2">
      <div className="grid grid-cols-2 gap-4">
        
        {/* Compression Level */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label className="text-xs text-slate-400">Compression (CRF)</Label>
            <span className="text-xs text-orange-500 font-mono">
                {quality > 80 ? 'Low' : quality > 50 ? 'Med' : 'High'}
            </span>
          </div>
          {/* Reverse slider: High value = Better Quality (Lower CRF) */}
          <Slider 
            value={[quality]} 
            onValueChange={(val) => setQuality(val[0])} 
            max={100} 
            step={1}
            className="[&_.bg-primary]:bg-orange-500" 
          />
        </div>

        {/* Resolution */}
        <div className="space-y-3">
          <Label className="text-xs text-slate-400">Resolution</Label>
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

      {/* Audio Toggle */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/50">
          <Label className="text-xs text-slate-400">Remove Audio</Label>
          <Switch 
             checked={mute} 
             onCheckedChange={setMute}
             className="data-[state=checked]:bg-orange-500" 
          />
      </div>
      
      <p className="text-[10px] text-slate-500 italic">
        * Lower resolution drastically improves conversion speed.
      </p>
    </div>
  );
}