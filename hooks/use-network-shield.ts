"use client";

import { useState, useEffect } from "react";

export function useNetworkShield() {
  const [totalProcessed, setTotalProcessed] = useState(0); // Bytes processed locally
  const [totalLeaked, setTotalLeaked] = useState(0);       // Bytes sent to internet

  useEffect(() => {
    // 1. Intercept fetch to monitor outgoing traffic
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      // Logic to track network requests (Bunker Mode)
      setTotalLeaked(prev => prev + 1); // Increment for any external ping
      return originalFetch(...args);
    };

    // 2. Custom Event Listener for local processing engines (FFmpeg, Canvas, etc.)
    const handleLocalProcess = (e: any) => {
      if (e.detail?.bytes) {
        setTotalProcessed(prev => prev + e.detail.bytes);
      }
    };

    window.addEventListener('modul-local-process', handleLocalProcess);

    return () => {
      window.fetch = originalFetch;
      window.removeEventListener('modul-local-process', handleLocalProcess);
    };
  }, []);

  return { totalLeaked, totalProcessed };
}