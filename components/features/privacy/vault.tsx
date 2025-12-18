"use client";

import { useState, useEffect } from "react";
import { useVault } from "@/hooks/use-vault";
import { useFileStore } from "@/hooks/use-file-transfer"; 
import Dropzone from "@/components/dashboard/dropzone";
// FIX 1: Import 'Accept' type to satisfy the Dropzone prop definition
import { Accept } from "react-dropzone"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    Shield, Lock, Unlock, Download, FileKey, 
    AlertCircle, Loader2, CheckCircle2, Eraser, X 
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface VaultProps {
  initialFile?: File | null;
}

export default function Vault({ initialFile }: VaultProps) {
  const { encryptFile, decryptFile, scrubFile, isProcessing } = useVault();
  const setPreloadedFile = useFileStore((state) => state.setPreloadedFile);
  
  const [mode, setMode] = useState<'encrypt' | 'decrypt' | 'scrub'>('encrypt');
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [result, setResult] = useState<{ url: string; fileName: string } | null>(null);

  // --- 1. DYNAMIC DROPZONE RULES ---
  // FIX 2: Explicitly type the return value and populate arrays to avoid 'never[]' errors
  const getAcceptedFiles = (): Accept | undefined => {
      if (mode === 'decrypt') {
          // STRICT: Only allow .enc files
          return {
              'application/octet-stream': ['.enc'], 
              'application/encrypted': ['.enc']
          };
      }
      if (mode === 'scrub') {
          // FIX 3: Added specific extensions instead of empty [] to satisfy TypeScript
          return {
              'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.heic'],
              'video/*': ['.mp4', '.mov', '.avi']
          };
      }
      // Encrypt Mode: Return undefined to use Dropzone's default (All Media + PDF)
      return undefined; 
  };

  useEffect(() => {
    if (initialFile) {
        setFile(initialFile);
        
        if (initialFile.name.endsWith('.enc')) {
            setMode('decrypt');
        } else {
            setMode('encrypt');
        }

        setResult(null);
        setPreloadedFile(null); 

        toast({ 
            title: "Vault Secured", 
            description: "Bunker Mode: Ready for local processing." 
        });
    }
  }, [initialFile, setPreloadedFile]);

  // --- CONFIGURATION ---
  const modeConfig = {
    encrypt: {
      color: "text-blue-500",
      bg: "bg-blue-500",
      button: "bg-blue-600 hover:bg-blue-500",
      iconBg: "bg-blue-500/10",
      icon: <Lock className="mr-2 h-4 w-4" />,
      label: "Secure File"
    },
    decrypt: {
      color: "text-green-500",
      bg: "bg-green-500",
      button: "bg-green-600 hover:bg-green-500",
      iconBg: "bg-green-500/10",
      icon: <Unlock className="mr-2 h-4 w-4" />,
      label: "Unlock File"
    },
    scrub: {
      color: "text-purple-500",
      bg: "bg-purple-500",
      button: "bg-purple-600 hover:bg-purple-500",
      iconBg: "bg-purple-500/10",
      icon: <Eraser className="mr-2 h-4 w-4" />,
      label: "Scrub Metadata"
    }
  };

  const currentConfig = modeConfig[mode];

  const switchMode = (newMode: 'encrypt' | 'decrypt' | 'scrub') => {
      setResult(null);
      setPassword("");
      const isCompatible = (mode === 'encrypt' || mode === 'scrub') && (newMode === 'encrypt' || newMode === 'scrub');
      if (!isCompatible) setFile(null);
      setMode(newMode);
  };

  const handleFile = (files: File[]) => {
      setFile(files[0]);
      setResult(null);
  };

  const processVault = async () => {
      if (!file) return;
      let res;
      if (mode === 'encrypt') {
          if (!password) return;
          res = await encryptFile(file, password);
      } else if (mode === 'decrypt') {
          if (!password) return;
          res = await decryptFile(file, password);
      } else {
          res = await scrubFile(file);
      }
      if (res) setResult(res);
      else toast({ title: "Operation Failed", variant: "destructive" });
  };

  const reset = () => {
      setFile(null);
      setPassword("");
      setResult(null);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* HEADER */}
        <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-white flex items-center justify-center gap-2 tracking-tighter">
                <Shield className={currentConfig.color} /> 
                The Vault
            </h2>
            <p className="text-slate-400 text-sm">Privacy & Metadata Toolset (Bunker Mode).</p>
        </div>

        {/* MODE TOGGLE */}
        <div className="bg-slate-900/50 p-1 rounded-2xl flex border border-slate-800 gap-1 backdrop-blur-xl">
            {Object.keys(modeConfig).map((m) => (
                <button 
                    key={m}
                    onClick={() => switchMode(m as any)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                        mode === m ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                    }`}
                >
                    {m === 'encrypt' && <Lock size={12} />}
                    {m === 'decrypt' && <Unlock size={12} />}
                    {m === 'scrub' && <Eraser size={12} />}
                    {m}
                </button>
            ))}
        </div>

        {/* MAIN CARD */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
             
             <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[100px] opacity-10 pointer-events-none ${currentConfig.bg} transition-colors duration-700`} />

             {/* 1. FILE INPUT */}
             {!file ? (
                 <div className="relative z-10">
                     <Dropzone 
                        onFilesDropped={handleFile} 
                        accept={getAcceptedFiles()} 
                     />
                 </div>
             ) : (
                 <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center gap-4 relative z-10 animate-in zoom-in-95 duration-300">
                     <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${currentConfig.iconBg} ${currentConfig.color} transition-colors duration-300`}>
                         <FileKey size={24} />
                     </div>
                     <div className="flex-1 min-w-0">
                         <p className="text-xs font-bold text-slate-200 truncate uppercase tracking-widest">{file.name}</p>
                         <p className="text-[10px] font-mono text-slate-500 mt-1 uppercase">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                     </div>
                     <Button variant="ghost" size="icon" onClick={reset} className="text-slate-500 hover:text-red-400">
                         <X size={18} />
                     </Button>
                 </div>
             )}

             {/* 2. ACTIONS AREA */}
             {file && !result && (
                 <div className="pt-6 border-t border-slate-800/50 space-y-4 animate-in slide-in-from-bottom-2 relative z-10">
                     {mode !== 'scrub' && (
                         <div className="space-y-2">
                             <div className="flex justify-between items-center ml-1">
                                <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                                    {mode === 'encrypt' ? 'Set Encryption Key' : 'Enter Decryption Key'}
                                </label>
                                {mode === 'encrypt' && (
                                     <span className="text-[9px] text-orange-500 flex items-center gap-1 font-bold uppercase tracking-tighter">
                                         <AlertCircle size={10} /> Recovery Impossible
                                     </span>
                                 )}
                             </div>
                             <Input 
                                 type="password" 
                                 placeholder={mode === 'encrypt' ? "••••••••" : "Unlock code..."}
                                 value={password}
                                 onChange={(e) => setPassword(e.target.value)}
                                 className="bg-slate-950 border-slate-800 h-12 text-center text-xl tracking-[0.5em] focus:ring-blue-500/30"
                             />
                         </div>
                     )}

                     <Button 
                        disabled={(mode !== 'scrub' && !password) || isProcessing}
                        onClick={processVault}
                        className={`w-full h-12 text-[10px] font-bold uppercase tracking-[0.3em] transition-all shadow-lg ${currentConfig.button}`}
                     >
                        {isProcessing ? (
                            <><Loader2 className="animate-spin mr-2" size={14} /> Cryptographic Task active...</>
                        ) : (
                            <>{currentConfig.icon} {currentConfig.label}</>
                        )}
                     </Button>
                 </div>
             )}

             {/* 3. SUCCESS / DOWNLOAD */}
             {result && (
                 <div className="text-center space-y-6 animate-in zoom-in-95 duration-300 relative z-10 pt-4">
                     <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-2 ${currentConfig.bg} text-white shadow-xl shadow-${currentConfig.bg}/20`}>
                         <CheckCircle2 size={32} />
                     </div>
                     <div>
                         <h3 className="text-xl font-bold text-white tracking-tight">
                             {mode === 'encrypt' ? 'Encryption Complete' : mode === 'decrypt' ? 'Decryption Complete' : 'Metadata Purged'}
                         </h3>
                         <p className="text-slate-500 text-xs mt-1 uppercase font-bold tracking-widest">
                             {mode === 'scrub' ? 'EXIF & GPS removed locally.' : 'Task completed successfully.'}
                         </p>
                     </div>

                     <a href={result.url} download={result.fileName} className="block">
                         <Button className="w-full h-12 text-[10px] font-bold uppercase tracking-[0.2em] bg-slate-100 text-slate-900 hover:bg-white shadow-xl">
                             <Download className="mr-2 h-4 w-4" /> Download {mode === 'encrypt' ? '.enc File' : 'Processed File'}
                         </Button>
                     </a>
                     
                     <Button variant="ghost" onClick={reset} className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-white">
                         Process Another
                     </Button>
                 </div>
             )}
        </div>
    </div>
  );
}