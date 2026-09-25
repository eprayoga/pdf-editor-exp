import { drawImageToCanvas, loadImage, readFileAsDataUrl, removeLightBackground, resolveImageMimeType } from "@/lib/image/image-utils";

export type SignatureImage = {
  dataUrl: string;
  width: number;
  height: number;
};

export function setupHiDpiCanvas(canvas: HTMLCanvasElement, cssWidth: number, cssHeight: number) {
  const ratio = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = Math.round(cssWidth * ratio);
  canvas.height = Math.round(cssHeight * ratio);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is not supported in this browser.");
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.lineCap = "round";
  context.lineJoin = "round";
  return context;
}

export function getContentBounds(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d");
  if (!context) return null;
  const { width, height } = canvas;
  const { data } = context.getImageData(0, 0, width, height);
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] > 8) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < 0 || maxY < 0) return null;
  return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

export function isCanvasBlank(canvas: HTMLCanvasElement) {
  return getContentBounds(canvas) === null;
}

export function trimCanvas(canvas: HTMLCanvasElement, padding = 6): HTMLCanvasElement | null {
  const bounds = getContentBounds(canvas);
  if (!bounds) return null;

  const x = Math.max(0, bounds.x - padding);
  const y = Math.max(0, bounds.y - padding);
  const right = Math.min(canvas.width, bounds.x + bounds.width + padding);
  const bottom = Math.min(canvas.height, bounds.y + bounds.height + padding);

  const trimmed = document.createElement("canvas");
  trimmed.width = right - x;
  trimmed.height = bottom - y;
  const context = trimmed.getContext("2d");
  if (!context) return null;
  context.drawImage(canvas, x, y, trimmed.width, trimmed.height, 0, 0, trimmed.width, trimmed.height);
  return trimmed;
}

export function exportSignatureCanvas(canvas: HTMLCanvasElement): SignatureImage | null {
  const trimmed = trimCanvas(canvas);
  if (!trimmed) return null;
  return {
    dataUrl: trimmed.toDataURL("image/png"),
    width: trimmed.width,
    height: trimmed.height,
  };
}

export async function processSignatureFile(
  file: File,
  options: { removeBackground: boolean }
): Promise<SignatureImage> {
  const mimeType = resolveImageMimeType(file);
  if (!mimeType) {
    throw new Error("Unsupported signature image. Please use PNG, JPG, JPEG, or WebP.");
  }

  const dataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(dataUrl);
  let canvas = drawImageToCanvas(image, 2000);

  if (options.removeBackground) {
    canvas = removeLightBackground(canvas);
    const trimmed = trimCanvas(canvas, 4);
    if (!trimmed) throw new Error("The signature image appears to be empty after removing the background.");
    canvas = trimmed;
  }

  return {
    dataUrl: canvas.toDataURL("image/png"),
    width: canvas.width,
    height: canvas.height,
  };
}
