"use client";

import { useEffect, useState } from "react"; 
import Hero from "@/components/home/hero";
import BentoGrid from "@/components/dashboard/bento-grid"; 
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import Link from "next/link";
import TrustSection from "@/components/home/trust-section";

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle Scroll Effects for Navbar Glassmorphism
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const section = document.getElementById(id);
    if (section) section.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="min-h-screen bg-black text-slate-200 font-sans selection:bg-orange-500/30 flex flex-col overflow-x-hidden">
      
      {/* 1. NAVIGATION BAR */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
          isScrolled ? "bg-black/70 backdrop-blur-xl border-white/10 py-3" : "bg-transparent border-transparent py-5"
      }`}>
        <div className="max-w-[1400px] mx-auto px-6 flex justify-between items-center">
            {/* Logo */}
            <div 
                className="font-black text-2xl tracking-tighter flex items-center gap-0.5 select-none cursor-pointer text-white"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
                Modul<span className="text-orange-500">.</span>
            </div>
            
            {/* Right Side Actions */}
            <div className="flex items-center gap-3 sm:gap-6">
                <button 
                    onClick={() => scrollToSection("how-it-works")}
                    className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-500 hover:text-white transition-colors hidden md:block"
                >
                    How it works
                </button>

                <div className="flex items-center gap-3">
                    <Link href="https://github.com/sohamshetty07/modul" target="_blank">
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white w-9 h-9">
                            <Github className="w-4 h-4" />
                        </Button>
                    </Link>
                    <div className="text-[9px] font-mono text-slate-500 border border-slate-800 bg-slate-900/50 px-2.5 py-1 rounded-full">
                        v2.0.0
                    </div>
                </div>
            </div>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <div className="pt-24 md:pt-28 flex flex-col items-center">
          <Hero />
      </div>

      {/* 3. THE BENTO GRID (TOOLS) */}
      <div id="tools" className="max-w-7xl mx-auto w-full px-4 scroll-mt-24 mt-2">
          <BentoGrid />
      </div>

      {/* 4. SECURITY & TRUST SECTION */}
      {/* Wrapped in ID for scroll targeting */}
      <div id="how-it-works" className="w-full mt-20 border-t border-slate-900/50">
          <TrustSection />
      </div>

      {/* FOOTER */}
      <footer className="py-10 border-t border-slate-900 text-center mt-auto">
            <p className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.3em]">
                © 2025 Modul Studio • Open Source
            </p>
      </footer>
    </main>
  );
}