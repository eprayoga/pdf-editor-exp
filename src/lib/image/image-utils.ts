import type { ImageMimeType } from "@/lib/pdf/types";

export const SUPPORTED_IMAGE_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export const SUPPORTED_IMAGE_ACCEPT = ".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp";

const EXTENSION_MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

const MAX_IMAGE_DIMENSION = 4000;

export type ProcessedImage = {
  dataUrl: string;
  mimeType: ImageMimeType;
  width: number;
  height: number;
};

export function resolveImageMimeType(file: File): string | null {
  if (file.type && (SUPPORTED_IMAGE_MIME_TYPES as readonly string[]).includes(file.type)) return file.type;
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_MIME[extension] ?? null;
}

export function isSupportedImageFile(file: File) {
  return resolveImageMimeType(file) !== null;
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read the file."));
    reader.readAsDataURL(file);
  });
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("The image could not be decoded."));
    image.src = src;
  });
}

export function dataUrlToBytes(dataUrl: string): Uint8Array {
  const commaIndex = dataUrl.indexOf(",");
  if (commaIndex === -1) throw new Error("Invalid data URL.");
  const header = dataUrl.slice(0, commaIndex);
  const payload = dataUrl.slice(commaIndex + 1);
  if (!header.includes(";base64")) {
    return new TextEncoder().encode(decodeURIComponent(payload));
  }
  const binary = atob(payload);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

export function getDataUrlMimeType(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;,]+)/);
  return match ? match[1] : null;
}

export function drawImageToCanvas(image: HTMLImageElement, maxDimension = MAX_IMAGE_DIMENSION) {
  const naturalWidth = image.naturalWidth || image.width;
  const naturalHeight = image.naturalHeight || image.height;
  const scale = Math.min(1, maxDimension / Math.max(naturalWidth, naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(naturalHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is not supported in this browser.");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export function removeLightBackground(canvas: HTMLCanvasElement, threshold = 225) {
  const context = canvas.getContext("2d");
  if (!context) return canvas;
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imageData;
  for (let index = 0; index < data.length; index += 4) {
    const brightness = (data[index] + data[index + 1] + data[index + 2]) / 3;
    if (brightness >= threshold) {
      data[index + 3] = 0;
    } else if (brightness > threshold - 40) {
      const alpha = ((threshold - brightness) / 40) * data[index + 3];
      data[index + 3] = Math.round(alpha);
    }
  }
  context.putImageData(imageData, 0, 0);
  return canvas;
}

export async function processImageFile(file: File): Promise<ProcessedImage> {
  const mimeType = resolveImageMimeType(file);
  if (!mimeType) {
    throw new Error("Unsupported image format. Please use PNG, JPG, JPEG, or WebP.");
  }

  const sourceDataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(sourceDataUrl);
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;

  if (!width || !height) throw new Error("The image has invalid dimensions.");

  if (mimeType === "image/png" && Math.max(width, height) <= MAX_IMAGE_DIMENSION) {
    return { dataUrl: sourceDataUrl, mimeType: "image/png", width, height };
  }

  const canvas = drawImageToCanvas(image);

  if (mimeType === "image/jpeg") {
    return {
      dataUrl: canvas.toDataURL("image/jpeg", 0.95),
      mimeType: "image/jpeg",
      width: canvas.width,
      height: canvas.height,
    };
  }

  return {
    dataUrl: canvas.toDataURL("image/png"),
    mimeType: "image/png",
    width: canvas.width,
    height: canvas.height,
  };
}

export function fitSizeWithin(width: number, height: number, maxWidth: number, maxHeight: number) {
  const scale = Math.min(1, maxWidth / width, maxHeight / height);
  return { width: width * scale, height: height * scale };
}
