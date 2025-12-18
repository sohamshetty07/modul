"use client";

import { useState } from "react";
import { 
    Braces, FileJson, FileSpreadsheet, QrCode, 
    Binary, ArrowRightLeft, Copy, Check, Download, Wifi 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { QRCodeSVG } from "qrcode.react";
import Papa from "papaparse";
import { toast } from "@/hooks/use-toast";

export default function DevTools() {
  const [activeTab, setActiveTab] = useState("converter");
  
  // --- STATE: JSON <> CSV ---
  const [inputData, setInputData] = useState("");
  const [outputData, setOutputData] = useState("");
  const [conversionMode, setConversionMode] = useState<'json-to-csv' | 'csv-to-json'>('json-to-csv');

  // --- STATE: QR GENERATOR ---
  const [qrContent, setQrContent] = useState("https://modul.studio");
  const [qrType, setQrType] = useState<'text' | 'wifi'>('text');
  const [wifiSsid, setWifiSsid] = useState("");
  const [wifiPass, setWifiPass] = useState("");

  // --- STATE: BASE64 ---
  const [base64Input, setBase64Input] = useState("");
  const [base64Output, setBase64Output] = useState("");
  const [base64Mode, setBase64Mode] = useState<'encode' | 'decode'>('encode');

  // --- LOGIC: CONVERTER ---
  const handleConvertData = () => {
      try {
          if (!inputData.trim()) return;
          if (conversionMode === 'json-to-csv') {
              const json = JSON.parse(inputData);
              const csv = Papa.unparse(json);
              setOutputData(csv);
          } else {
              const result = Papa.parse(inputData, { header: true });
              setOutputData(JSON.stringify(result.data, null, 2));
          }
          toast({ title: "Converted Successfully" });
      } catch (e) {
          toast({ title: "Invalid Format", description: "Check your input syntax.", variant: "destructive" });
      }
  };

  // --- LOGIC: BASE64 ---
  const handleBase64 = () => {
      try {
          if (base64Mode === 'encode') {
              setBase64Output(btoa(base64Input));
          } else {
              setBase64Output(atob(base64Input));
          }
      } catch (e) {
          toast({ title: "Conversion Error", variant: "destructive" });
      }
  };

  // --- LOGIC: COPY ---
  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      toast({ title: "Copied to Clipboard" });
  };

  // --- LOGIC: DOWNLOAD QR ---
  const downloadQr = () => {
      const svg = document.getElementById("qr-code-svg");
      if (svg) {
          const svgData = new XMLSerializer().serializeToString(svg);
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          const img = new Image();
          img.onload = () => {
              canvas.width = img.width;
              canvas.height = img.height;
              ctx?.drawImage(img, 0, 0);
              const pngFile = canvas.toDataURL("image/png");
              const downloadLink = document.createElement("a");
              downloadLink.download = "modul-qr.png";
              downloadLink.href = pngFile;
              downloadLink.click();
          };
          img.src = "data:image/svg+xml;base64," + btoa(svgData);
      }
  };

  const getQrValue = () => {
      if (qrType === 'wifi') {
          return `WIFI:T:WPA;S:${wifiSsid};P:${wifiPass};;`;
      }
      return qrContent;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
        
        {/* HEADER */}
        <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-white flex items-center justify-center gap-2 tracking-tighter">
                <Braces className="text-yellow-500" /> Dev Utilities
            </h2>
            <p className="text-slate-400 text-sm">Offline data tools for developers.</p>
        </div>

        {/* TABS */}
        <Tabs defaultValue="converter" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-center mb-8">
                <TabsList className="bg-slate-900 border border-slate-800 h-10 p-1">
                    <TabsTrigger value="converter" className="px-6 text-[10px] uppercase font-bold tracking-widest data-[state=active]:text-yellow-400">JSON / CSV</TabsTrigger>
                    <TabsTrigger value="qr" className="px-6 text-[10px] uppercase font-bold tracking-widest data-[state=active]:text-yellow-400">QR Gen</TabsTrigger>
                    <TabsTrigger value="base64" className="px-6 text-[10px] uppercase font-bold tracking-widest data-[state=active]:text-yellow-400">Base64</TabsTrigger>
                </TabsList>
            </div>

            {/* --- 1. DATA CONVERTER --- */}
            {activeTab === "converter" && (
                <div className="grid md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">{conversionMode === 'json-to-csv' ? 'JSON Input' : 'CSV Input'}</label>
                            <Button variant="ghost" size="sm" className="h-4 text-[10px] text-blue-400" onClick={() => setInputData('')}>Clear</Button>
                        </div>
                        <Textarea 
                            className="h-64 bg-slate-950 font-mono text-xs border-slate-800" 
                            placeholder={conversionMode === 'json-to-csv' ? '[{"name": "Modul"}]' : 'name,id\nModul,1'}
                            value={inputData}
                            onChange={(e) => setInputData(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col gap-4">
                         <Button 
                            onClick={() => setConversionMode(prev => prev === 'json-to-csv' ? 'csv-to-json' : 'json-to-csv')}
                            variant="outline" 
                            size="icon"
                            className="rounded-full border-slate-700 hover:bg-slate-800"
                         >
                             <ArrowRightLeft size={14} />
                         </Button>
                         <Button onClick={handleConvertData} className="bg-yellow-600 hover:bg-yellow-500 text-black font-bold">
                             Convert
                         </Button>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">{conversionMode === 'json-to-csv' ? 'CSV Output' : 'JSON Output'}</label>
                            <Button variant="ghost" size="sm" className="h-4 text-[10px] text-green-400" onClick={() => copyToClipboard(outputData)}>Copy</Button>
                        </div>
                        <Textarea 
                            readOnly
                            className="h-64 bg-slate-900 font-mono text-xs border-slate-800 text-slate-400" 
                            value={outputData}
                        />
                    </div>
                </div>
            )}

            {/* --- 2. QR GENERATOR --- */}
            {activeTab === "qr" && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 flex flex-col md:flex-row gap-12 items-center justify-center">
                    <div className="space-y-6 flex-1 max-w-sm">
                        <div className="flex gap-2">
                            <Button 
                                onClick={() => setQrType('text')} 
                                variant={qrType === 'text' ? 'default' : 'outline'}
                                className={`flex-1 ${qrType === 'text' ? 'bg-yellow-600 text-black' : 'border-slate-700'}`}
                            >
                                URL / Text
                            </Button>
                            <Button 
                                onClick={() => setQrType('wifi')} 
                                variant={qrType === 'wifi' ? 'default' : 'outline'}
                                className={`flex-1 ${qrType === 'wifi' ? 'bg-yellow-600 text-black' : 'border-slate-700'}`}
                            >
                                <Wifi size={14} className="mr-2"/> Wi-Fi
                            </Button>
                        </div>

                        {qrType === 'text' ? (
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Content</label>
                                <Input 
                                    value={qrContent} 
                                    onChange={(e) => setQrContent(e.target.value)} 
                                    className="bg-slate-950 border-slate-800"
                                />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Network Name (SSID)</label>
                                    <Input 
                                        value={wifiSsid} 
                                        onChange={(e) => setWifiSsid(e.target.value)} 
                                        className="bg-slate-950 border-slate-800"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Password</label>
                                    <Input 
                                        type="password"
                                        value={wifiPass} 
                                        onChange={(e) => setWifiPass(e.target.value)} 
                                        className="bg-slate-950 border-slate-800"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-white p-4 rounded-xl shadow-2xl flex flex-col items-center gap-4">
                        <QRCodeSVG 
                            id="qr-code-svg"
                            value={getQrValue()} 
                            size={200}
                            level="H"
                            includeMargin={true}
                        />
                        <Button onClick={downloadQr} size="sm" className="w-full bg-slate-900 text-white hover:bg-slate-800 text-[10px] uppercase font-bold tracking-widest">
                            <Download size={12} className="mr-2" /> Save PNG
                        </Button>
                    </div>
                </div>
            )}

            {/* --- 3. BASE64 --- */}
            {activeTab === "base64" && (
                <div className="space-y-6">
                     <div className="flex justify-center gap-4">
                        <Button 
                            onClick={() => setBase64Mode('encode')} 
                            variant={base64Mode === 'encode' ? 'default' : 'ghost'}
                            className={base64Mode === 'encode' ? 'bg-yellow-600 text-black' : 'text-slate-400'}
                        >
                            Text → Base64
                        </Button>
                        <Button 
                            onClick={() => setBase64Mode('decode')} 
                            variant={base64Mode === 'decode' ? 'default' : 'ghost'}
                            className={base64Mode === 'decode' ? 'bg-yellow-600 text-black' : 'text-slate-400'}
                        >
                            Base64 → Text
                        </Button>
                     </div>

                     <div className="grid gap-4">
                        <Textarea 
                            className="bg-slate-950 border-slate-800 font-mono text-xs h-32" 
                            placeholder={base64Mode === 'encode' ? "Type text to encode..." : "Paste Base64 string..."}
                            value={base64Input}
                            onChange={(e) => setBase64Input(e.target.value)}
                        />
                        <div className="flex justify-center">
                            <Button onClick={handleBase64} size="sm" className="bg-slate-800 text-slate-200">
                                <ArrowRightLeft size={14} className="mr-2" /> Process
                            </Button>
                        </div>
                        <div className="relative">
                            <Textarea 
                                readOnly
                                className="bg-slate-900 border-slate-800 font-mono text-xs h-32 text-yellow-500/80" 
                                value={base64Output}
                            />
                            <Button 
                                size="icon" 
                                variant="ghost" 
                                className="absolute top-2 right-2 h-6 w-6 text-slate-500 hover:text-white"
                                onClick={() => copyToClipboard(base64Output)}
                            >
                                <Copy size={12} />
                            </Button>
                        </div>
                     </div>
                </div>
            )}
        </Tabs>
    </div>
  );
}