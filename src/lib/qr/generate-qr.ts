import QRCode, { type QRCodeToDataURLOptions } from "qrcode";
import { dataUrlToBytes } from "@/lib/image/image-utils";

const QR_OPTIONS: QRCodeToDataURLOptions = {
  errorCorrectionLevel: "M",
  margin: 1,
  width: 512,
  type: "image/png",
  color: {
    dark: "#000000",
    light: "#ffffff",
  },
};

const MAX_CACHE_SIZE = 100;
const cache = new Map<string, Promise<string>>();

export function generateQrDataUrl(content: string): Promise<string> {
  if (content.length === 0) return Promise.reject(new Error("QR content is required."));

  const cached = cache.get(content);
  if (cached) return cached;

  const promise = QRCode.toDataURL(content, QR_OPTIONS).catch((error: unknown) => {
    cache.delete(content);
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`QR generation failed: ${message}`);
  });

  cache.set(content, promise);
  if (cache.size > MAX_CACHE_SIZE) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) cache.delete(oldestKey);
  }
  return promise;
}

export async function generateQrBytes(content: string): Promise<Uint8Array> {
  const dataUrl = await generateQrDataUrl(content);
  return dataUrlToBytes(dataUrl);
}
