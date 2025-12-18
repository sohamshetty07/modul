"use client";

import { useState } from "react";

export function useVault() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'encrypting' | 'decrypting' | 'scrubbing' | 'done' | 'error'>('idle');

  // --- CRYPTO HELPERS ---
  const getCryptoKey = async (password: string, salt: BufferSource) => {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );
    return window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
  };

  // 1. ENCRYPT (AES-256)
  const encryptFile = async (file: File, password: string) => {
    try {
      setIsProcessing(true);
      setStatus('encrypting');

      const fileData = await file.arrayBuffer();
      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const iv = window.crypto.getRandomValues(new Uint8Array(12));

      const key = await getCryptoKey(password, salt);
      const encryptedContent = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        fileData
      );

      const packedData = new Uint8Array(salt.byteLength + iv.byteLength + encryptedContent.byteLength);
      packedData.set(salt, 0);
      packedData.set(iv, salt.byteLength);
      packedData.set(new Uint8Array(encryptedContent), salt.byteLength + iv.byteLength);

      const blob = new Blob([packedData], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      
      setIsProcessing(false);
      setStatus('done');
      return { url, fileName: `${file.name}.enc` };

    } catch (e) {
      console.error(e);
      setStatus('error');
      setIsProcessing(false);
      return null;
    }
  };

  // 2. DECRYPT
  const decryptFile = async (file: File, password: string) => {
    try {
      setIsProcessing(true);
      setStatus('decrypting');

      const packedData = await file.arrayBuffer();
      const packedArray = new Uint8Array(packedData);

      const salt = packedArray.slice(0, 16);
      const iv = packedArray.slice(16, 28);
      const encryptedData = packedArray.slice(28);

      const key = await getCryptoKey(password, salt);
      const decryptedContent = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        key,
        encryptedData
      );

      const originalName = file.name.replace(/\.enc$/, '');
      const blob = new Blob([decryptedContent]);
      const url = URL.createObjectURL(blob);

      setIsProcessing(false);
      setStatus('done');
      return { url, fileName: originalName };

    } catch (e) {
      console.error(e);
      setStatus('error');
      setIsProcessing(false);
      return null;
    }
  };

  // 3. SCRUB (Remove Metadata) - NEW
  const scrubFile = async (file: File) => {
      try {
          setIsProcessing(true);
          setStatus('scrubbing');

          if (!file.type.startsWith('image/')) {
              throw new Error("Metadata scrubbing currently supports images only.");
          }

          // Strategy: Draw to canvas and re-export. 
          // This destroys all non-visual data (EXIF, GPS, Camera Model).
          const bitmap = await createImageBitmap(file);
          const canvas = document.createElement('canvas');
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          const ctx = canvas.getContext('2d');
          
          if(!ctx) throw new Error("Canvas context failed");
          
          ctx.drawImage(bitmap, 0, 0);

          // Convert back to blob (stripping metadata)
          const blob = await new Promise<Blob | null>(resolve => 
              canvas.toBlob(resolve, file.type, 1.0)
          );

          if (!blob) throw new Error("Encoding failed");

          const url = URL.createObjectURL(blob);
          
          setIsProcessing(false);
          setStatus('done');
          return { url, fileName: `clean_${file.name}` };

      } catch (e) {
          console.error(e);
          setStatus('error');
          setIsProcessing(false);
          return null;
      }
  };

  return { encryptFile, decryptFile, scrubFile, isProcessing, status };
}