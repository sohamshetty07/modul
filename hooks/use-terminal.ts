"use client";

import { create } from 'zustand';

interface LogEntry {
  id: string;
  message: string;
  type: 'system' | 'ffmpeg' | 'neural' | 'success' | 'error';
  timestamp: string;
}

interface TerminalStore {
  logs: LogEntry[];
  addLog: (message: string, type?: LogEntry['type']) => void;
  clearLogs: () => void;
}

export const useTerminal = create<TerminalStore>((set) => ({
  logs: [],
  addLog: (message, type = 'system') => set((state) => {
    const now = new Date();
    // FIX: Use toISOString to get milliseconds (HH:mm:ss.ms)
    // Example output: 15:04:30.125
    const timeString = now.toISOString().split('T')[1].slice(0, -1);
    
    return {
      logs: [
        ...state.logs,
        {
          id: Math.random().toString(36).substring(7),
          message,
          type,
          timestamp: timeString, 
        }
      ].slice(-100), // Keep last 100 logs
    };
  }),
  clearLogs: () => set({ logs: [] }),
}));