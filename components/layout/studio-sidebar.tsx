"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  FileVideo, 
  FileText, 
  Mic, 
  ShieldAlert, 
  Menu,
  X,
  AudioLines,
  Wand2,
  Database, // 1. Added Database Icon
  Video, // 2. Added Video Icon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const MENU_ITEMS = [
  { icon: Home, label: "Dashboard", href: "/" },
  { icon: FileVideo, label: "Converter", href: "/studio/video-converter" },
  { icon: FileText, label: "PDF Tools", href: "/studio/pdf-tools" },
  { icon: Mic, label: "Transcriber", href: "/studio/audio-transcriber" },
  { icon: AudioLines, label: "Audio Studio", href: "/studio/audio-cutter" },
  { icon: Wand2, label: "Magic Remover", href: "/studio/magic-remover" },
  { icon: ShieldAlert, label: "The Vault", href: "/studio/vault" },
  // 2. Added Dev Utilities Item
  { icon: Database, label: "Dev Utilities", href: "/studio/utilities" },
  // Import { Video } from 'lucide-react'
  { icon: Video, label: "Screen Recorder", href: "/studio/screen-recorder" },
];

export default function StudioSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* MOBILE TRIGGER */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)} className="text-white">
            {mobileOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* SIDEBAR CONTAINER */}
      <aside 
        className={cn(
          "fixed left-0 top-0 h-screen bg-black border-r border-slate-800 transition-all duration-300 z-40 flex flex-col",
          isCollapsed ? "w-20" : "w-64",
          // Mobile overrides
          mobileOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* LOGO AREA */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800/50">
             <div className="font-extrabold text-xl tracking-tighter flex items-center gap-0.5 select-none text-white">
                M
                <span className="text-orange-500">.</span>
                {!isCollapsed && <span className="ml-1 text-slate-200">Studio</span>}
            </div>
        </div>

        {/* NAVIGATION ITEMS */}
        <nav className="flex-1 py-6 px-3 space-y-2">
            {MENU_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                    <Link 
                        key={item.href} 
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                            "flex items-center gap-3 px-3 py-3 rounded-xl transition-all group relative",
                            isActive ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-300 hover:bg-slate-900/50"
                        )}
                    >
                        <item.icon className={cn("w-6 h-6 shrink-0", isActive ? "text-orange-500" : "text-slate-500 group-hover:text-slate-300")} />
                        
                        {/* Label - Hidden when collapsed */}
                        <span className={cn(
                            "font-medium whitespace-nowrap overflow-hidden transition-all duration-300",
                            isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                        )}>
                            {item.label}
                        </span>

                        {/* Hover Tooltip (Only when collapsed) */}
                        {isCollapsed && (
                             <div className="absolute left-16 ml-4 bg-slate-800 text-white text-xs px-2 py-1.5 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none z-50 whitespace-nowrap shadow-xl border border-slate-700">
                                {item.label}
                            </div>
                        )}
                    </Link>
                )
            })}
        </nav>

        {/* FOOTER ACTIONS */}
        <div className="p-4 border-t border-slate-800/50">
             <button 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="w-full flex items-center justify-center p-2 text-slate-600 hover:text-white transition-colors"
            >
                {isCollapsed ? <Menu size={20} /> : <div className="text-[10px] font-bold tracking-widest text-slate-500">COLLAPSE</div>}
             </button>
        </div>

      </aside>
      
      {/* MOBILE OVERLAY */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden" 
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}