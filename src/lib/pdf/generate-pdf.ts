import { PDFDocument, type PDFImage, type PDFPage } from "pdf-lib";
import { dataUrlToBytes, getDataUrlMimeType } from "@/lib/image/image-utils";
import { generateQrBytes } from "@/lib/qr/generate-qr";
import { hexToPdfRgb } from "./color";
import { embedFonts, type FontRegistry } from "./fonts";
import { calculateMultilineTextLayout, calculateTextLayout, type TextLayout } from "./text-layout";
import type {
  FontFamily,
  ImageElement,
  MultilineTextElement,
  PageSize,
  PDFElement,
  QRElement,
  SignatureElement,
  TextElement,
} from "./types";
import { validateElements } from "./validation";

type ImageCache = Map<string, Promise<PDFImage>>;

type DrawContext = {
  pdfDoc: PDFDocument;
  page: PDFPage;
  fonts: FontRegistry;
  images: ImageCache;
};

function embedImageData(context: DrawContext, key: string, bytes: () => Promise<Uint8Array> | Uint8Array, kind: "png" | "jpg") {
  let pending = context.images.get(key);
  if (!pending) {
    pending = Promise.resolve(bytes()).then((data) =>
      kind === "png" ? context.pdfDoc.embedPng(data) : context.pdfDoc.embedJpg(data)
    );
    context.images.set(key, pending);
  }
  return pending;
}

async function drawSignature(context: DrawContext, element: SignatureElement) {
  const kind = getDataUrlMimeType(element.imageData) === "image/jpeg" ? "jpg" : "png";
  const image = await embedImageData(context, element.imageData, () => dataUrlToBytes(element.imageData), kind);
  context.page.drawImage(image, {
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
  });
}

async function drawImage(context: DrawContext, element: ImageElement) {
  const kind = element.mimeType === "image/jpeg" ? "jpg" : "png";
  const image = await embedImageData(context, element.imageData, () => dataUrlToBytes(element.imageData), kind);
  context.page.drawImage(image, {
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
  });
}

async function drawQr(context: DrawContext, element: QRElement) {
  const image = await embedImageData(context, `qr:${element.content}`, () => generateQrBytes(element.content), "png");
  context.page.drawImage(image, {
    x: element.x,
    y: element.y,
    width: element.size,
    height: element.size,
  });
}

function drawTextLayout(context: DrawContext, layout: TextLayout, element: TextElement | MultilineTextElement) {
  const font = context.fonts.get(element.fontFamily);
  const color = hexToPdfRgb(element.color);
  for (const line of layout.lines) {
    context.page.drawText(line.text, {
      x: line.x,
      y: line.baseline,
      size: element.fontSize,
      font,
      color,
    });
  }
}

function drawText(context: DrawContext, element: TextElement) {
  const layout = calculateTextLayout(element, context.fonts.get(element.fontFamily));
  drawTextLayout(context, layout, element);
}

function drawMultilineText(context: DrawContext, element: MultilineTextElement) {
  const layout = calculateMultilineTextLayout(element, context.fonts.get(element.fontFamily));
  drawTextLayout(context, layout, element);
}

async function drawElement(context: DrawContext, element: PDFElement) {
  switch (element.type) {
    case "signature":
      return drawSignature(context, element);
    case "image":
      return drawImage(context, element);
    case "qr":
      return drawQr(context, element);
    case "text":
      return drawText(context, element);
    case "multiline-text":
      return drawMultilineText(context, element);
  }
}

export type GeneratePdfInput = {
  pdfBytes: Uint8Array;
  elements: PDFElement[];
  pageSizes: Record<number, PageSize>;
};

export async function generatePdf({ pdfBytes, elements, pageSizes }: GeneratePdfInput): Promise<Uint8Array> {
  const invalid = validateElements(elements, pageSizes);
  if (Object.keys(invalid).length > 0) {
    throw new Error("Some elements have invalid positions. Please fix them before generating.");
  }

  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();

  const orphan = elements.find((element) => element.pageIndex < 0 || element.pageIndex >= pages.length);
  if (orphan) {
    throw new Error("An element references a page that does not exist in the PDF.");
  }

  const fontFamilies = elements
    .filter((element): element is TextElement | MultilineTextElement => element.type === "text" || element.type === "multiline-text")
    .map((element) => element.fontFamily as FontFamily);
  const fonts = await embedFonts(pdfDoc, fontFamilies);
  const images: ImageCache = new Map();

  for (let pageIndex = 0; pageIndex < pages.length; pageIndex += 1) {
    const page = pages[pageIndex];
    const pageElements = elements.filter((element) => element.pageIndex === pageIndex);
    for (const element of pageElements) {
      await drawElement({ pdfDoc, page, fonts, images }, element);
    }
  }

  return pdfDoc.save();
}

export function buildOutputFileName(originalName: string | null) {
  const base = (originalName ?? "document.pdf").replace(/\.pdf$/i, "");
  return `${base}-edited.pdf`;
}

export function downloadPdf(bytes: Uint8Array, fileName: string) {
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
