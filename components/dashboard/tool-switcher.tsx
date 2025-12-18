"use client";

import React, { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useFileStore } from '@/hooks/use-file-transfer';

// --- 1. Standard Imports ---
import AudioTranscriber from '@/components/features/media/audio-transcriber';
import VideoConverter from '@/components/features/media/video-converter';
import AudioCutter from '@/components/features/media/audio-cutter';
import PdfTools from '@/components/features/office/pdf-tools';
import Vault from '@/components/features/privacy/vault';
import MagicRemover from '@/components/features/privacy/magic-remover';
import DevTools from '@/components/features/utilities/dev-tools'; // Ensure file is at this path!
import ScreenRecorder from '@/components/features/media/screen-recorder';

// --- 2. Tool Registry ---
// We explicitly type this to allow any component to accept 'initialFile' without TS errors
const TOOLS: Record<string, React.ComponentType<any>> = {
  'audio-transcriber': AudioTranscriber,
  'video-converter': VideoConverter,
  'audio-cutter': AudioCutter, // Verify this matches your Bento Grid route (audio-studio vs audio-cutter)
  'audio-studio': AudioCutter, // Added Alias to be safe
  'pdf-tools': PdfTools,
  'vault': Vault,
  'magic-remover': MagicRemover,
  'utilities': DevTools,
  'screen-recorder': ScreenRecorder,
};

// Update props to accept EITHER toolSlug or tool (common mismatch fix)
interface ToolSwitcherProps {
  toolSlug?: string; 
  tool?: string;
}

export default function ToolSwitcher({ toolSlug, tool }: ToolSwitcherProps) {
  const { preloadedFile } = useFileStore();
  
  // 1. Resolve the active slug (Handle both prop names just in case)
  const activeSlug = toolSlug || tool || "";
  
  // 2. Find the component
  const ActiveTool = TOOLS[activeSlug];

  useEffect(() => {
    if (preloadedFile && activeSlug) {
      console.log(`Bunker Mode: Injecting ${preloadedFile.name} into ${activeSlug}`);
    }
  }, [preloadedFile, activeSlug]);

  if (!ActiveTool) {
    // Debugging Helper: Check console to see what slug is actually being received
    console.warn(`Tool Not Found. Received slug: "${activeSlug}". Available keys:`, Object.keys(TOOLS));
    
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 p-8">
        <AlertTriangle className="w-12 h-12 mb-4 text-orange-500" />
        <h3 className="text-xl font-bold text-white">Tool Not Found</h3>
        <p>The tool "{activeSlug}" is not registered in the switcher.</p>
        <p className="text-xs mt-4 text-slate-700 font-mono">
           Expected one of: {Object.keys(TOOLS).join(", ")}
        </p>
      </div>
    );
  }

  // Pass initialFile prop to whatever tool is active (TS ignored via 'any' type in TOOLS definition)
  return <ActiveTool initialFile={preloadedFile} />;
}