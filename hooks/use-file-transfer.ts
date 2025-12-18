"use client";

import { create } from 'zustand';

// Explicitly defining the interface removes the TypeScript "red lines"
interface FileStore {
  preloadedFile: File | null;
  setPreloadedFile: (file: File | null) => void;
}

export const useFileStore = create<FileStore>((set) => ({
  preloadedFile: null,
  setPreloadedFile: (file: File | null) => set({ preloadedFile: file }),
}));