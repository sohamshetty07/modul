import { PDFDocument, degrees } from 'pdf-lib';

export type PDFAction = 'merge' | 'split' | 'rotate' | 'compress';

/**
 * MERGE: Combines multiple PDF files into one.
 */
export async function mergePDFs(files: File[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  return await mergedPdf.save();
}

/**
 * ROTATE: Rotates all pages in a PDF by 90 degrees clockwise.
 */
export async function rotatePDF(file: File, rotation: 90 | 180 | 270 = 90): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const pages = pdf.getPages();

  pages.forEach((page) => {
    const currentRotation = page.getRotation().angle;
    page.setRotation(degrees(currentRotation + rotation));
  });

  return await pdf.save();
}

/**
 * HELPER: Creates a browser-downloadable Blob from Uint8Array
 */
export function createPDFBlob(data: Uint8Array): Blob {
  return new Blob([data as any], { type: 'application/pdf' });
}