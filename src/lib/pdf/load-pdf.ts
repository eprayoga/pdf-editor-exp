import { EncryptedPDFError, PDFDocument } from "pdf-lib";
import type { PDFDocumentProxy } from "pdfjs-dist";
import type { PageSize } from "./types";

export type LoadedPdf = {
  bytes: Uint8Array;
  pageCount: number;
  pageSizes: Record<number, PageSize>;
};

const PDF_WORKER_SRC = "/pdf.worker.min.mjs";

export function isPdfFile(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function hasPdfHeader(bytes: Uint8Array) {
  const limit = Math.min(bytes.length, 1024);
  const header = new TextDecoder("latin1").decode(bytes.subarray(0, limit));
  return header.includes("%PDF-");
}

export async function readPdfFile(file: File): Promise<LoadedPdf> {
  if (!isPdfFile(file)) {
    throw new Error("Unsupported file. Please upload a PDF document.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  if (bytes.length === 0 || !hasPdfHeader(bytes)) {
    throw new Error("The file is not a valid PDF document.");
  }

  let pdfDoc: PDFDocument;
  try {
    pdfDoc = await PDFDocument.load(bytes, { updateMetadata: false });
  } catch (error) {
    if (error instanceof EncryptedPDFError) {
      throw new Error("This PDF is password-protected or encrypted and cannot be edited.");
    }
    throw new Error("The PDF could not be read. It may be corrupted.");
  }

  const pages = pdfDoc.getPages();
  if (pages.length === 0) {
    throw new Error("The PDF does not contain any pages.");
  }

  const pageSizes: Record<number, PageSize> = {};
  pages.forEach((page, index) => {
    const { width, height } = page.getSize();
    pageSizes[index] = { width, height };
  });

  return {
    bytes,
    pageCount: pages.length,
    pageSizes,
  };
}

export async function loadPdfJsDocument(bytes: Uint8Array): Promise<PDFDocumentProxy> {
  const pdfjs = await import("pdfjs-dist");
  if (pdfjs.GlobalWorkerOptions.workerSrc !== PDF_WORKER_SRC) {
    pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;
  }
  const task = pdfjs.getDocument({ data: bytes.slice() });
  return task.promise;
}
