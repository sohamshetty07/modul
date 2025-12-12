// core/utils.ts

export type FileCategory = 'video' | 'audio' | 'image' | 'pdf' | 'text' | 'unknown';

export function formatBytes(bytes: number, decimals = 2): string {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function getFileExtension(fileName: string): string {
  return fileName.slice((Math.max(0, fileName.lastIndexOf(".")) || Infinity) + 1).toLowerCase();
}

export function getFileCategory(file: File): FileCategory {
  const type = file.type;
  const ext = getFileExtension(file.name);

  if (type.startsWith('video/') || ['mkv', 'avi', 'mov'].includes(ext)) return 'video';
  if (type.startsWith('audio/') || ['mp3', 'wav', 'aac'].includes(ext)) return 'audio';
  if (type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'svg'].includes(ext)) return 'image';
  if (type === 'application/pdf') return 'pdf';
  if (type.startsWith('text/')) return 'text';
  
  return 'unknown';
}

// Just a helper to simulate processing time for testing UI later
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));