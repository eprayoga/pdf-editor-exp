import type { BoundingBox, PageSize, PDFElement, PositionDetails } from "./types";

export type PreviewSize = {
  width: number;
  height: number;
};

export type PreviewRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type PreviewPoint = {
  left: number;
  top: number;
};

export type PdfPoint = {
  x: number;
  y: number;
};

export type ResizeHandle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

export const MIN_ELEMENT_SIZE = 4;

export function getPreviewScale(page: PageSize, preview: PreviewSize) {
  return {
    scaleX: preview.width / page.width,
    scaleY: preview.height / page.height,
  };
}

export function getPreviewSize(page: PageSize, previewScale: number): PreviewSize {
  return {
    width: page.width * previewScale,
    height: page.height * previewScale,
  };
}

export function pdfToPreviewPosition(box: BoundingBox, page: PageSize, preview: PreviewSize): PreviewRect {
  const { scaleX, scaleY } = getPreviewScale(page, preview);
  return {
    left: box.x * scaleX,
    top: preview.height - (box.y + box.height) * scaleY,
    width: box.width * scaleX,
    height: box.height * scaleY,
  };
}

export function previewToPdfPosition(rect: PreviewRect, page: PageSize, preview: PreviewSize): BoundingBox {
  const { scaleX, scaleY } = getPreviewScale(page, preview);
  const width = rect.width / scaleX;
  const height = rect.height / scaleY;
  return {
    x: rect.left / scaleX,
    y: (preview.height - rect.top) / scaleY - height,
    width,
    height,
  };
}

export function pdfPointToPreviewPoint(point: PdfPoint, page: PageSize, preview: PreviewSize): PreviewPoint {
  const { scaleX, scaleY } = getPreviewScale(page, preview);
  return {
    left: point.x * scaleX,
    top: preview.height - point.y * scaleY,
  };
}

export function previewPointToPdfPoint(point: PreviewPoint, page: PageSize, preview: PreviewSize): PdfPoint {
  const { scaleX, scaleY } = getPreviewScale(page, preview);
  return {
    x: point.left / scaleX,
    y: (preview.height - point.top) / scaleY,
  };
}

export function previewDeltaToPdfDelta(dxPreview: number, dyPreview: number, page: PageSize, preview: PreviewSize) {
  const { scaleX, scaleY } = getPreviewScale(page, preview);
  return {
    dx: dxPreview / scaleX,
    dy: -dyPreview / scaleY,
  };
}

export function getBoundingBoxDetails(box: BoundingBox): PositionDetails {
  return {
    lowerLeftX: box.x,
    lowerLeftY: box.y,
    upperRightX: box.x + box.width,
    upperRightY: box.y + box.height,
  };
}

export function getQRPositionDetails(qr: { x: number; y: number; size: number }): PositionDetails {
  return {
    lowerLeftX: qr.x,
    lowerLeftY: qr.y,
    upperRightX: qr.x + qr.size,
    upperRightY: qr.y + qr.size,
  };
}

export function getElementBox(element: PDFElement): BoundingBox {
  if (element.type === "qr") {
    return { x: element.x, y: element.y, width: element.size, height: element.size };
  }
  return { x: element.x, y: element.y, width: element.width, height: element.height };
}

export function getElementPositionDetails(element: PDFElement): PositionDetails {
  if (element.type === "qr") return getQRPositionDetails(element);
  return getBoundingBoxDetails(element);
}

export function clampNumber(value: number, min: number, max: number) {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

export function clampBoxPosition(box: BoundingBox, page: PageSize): BoundingBox {
  return {
    ...box,
    x: clampNumber(box.x, 0, page.width - box.width),
    y: clampNumber(box.y, 0, page.height - box.height),
  };
}

export function fitBoxInPage(box: BoundingBox, page: PageSize): BoundingBox {
  const width = Math.min(box.width, page.width);
  const height = Math.min(box.height, page.height);
  return clampBoxPosition({ ...box, width, height }, page);
}

type ResizeOptions = {
  aspectRatio?: number;
  minSize?: number;
};

export function resizeBox(
  start: BoundingBox,
  handle: ResizeHandle,
  dx: number,
  dy: number,
  page: PageSize,
  options: ResizeOptions = {}
): BoundingBox {
  const minSize = options.minSize ?? MIN_ELEMENT_SIZE;
  const hasEast = handle.includes("e");
  const hasWest = handle.includes("w");
  const hasNorth = handle.includes("n");
  const hasSouth = handle.includes("s");

  const left = start.x;
  const right = start.x + start.width;
  const bottom = start.y;
  const top = start.y + start.height;

  const maxWidth = hasEast ? page.width - left : hasWest ? right : start.width;
  const maxHeight = hasNorth ? page.height - bottom : hasSouth ? top : start.height;

  let width = start.width;
  let height = start.height;

  if (hasEast) width = start.width + dx;
  if (hasWest) width = start.width - dx;
  if (hasNorth) height = start.height + dy;
  if (hasSouth) height = start.height - dy;

  if (options.aspectRatio && options.aspectRatio > 0) {
    const ratio = options.aspectRatio;
    const horizontal = hasEast || hasWest;
    const vertical = hasNorth || hasSouth;
    if (horizontal && vertical) {
      const scaleW = width / start.width;
      const scaleH = height / start.height;
      const scale = Math.abs(scaleW - 1) >= Math.abs(scaleH - 1) ? scaleW : scaleH;
      width = start.width * scale;
    } else if (vertical) {
      width = height * ratio;
    }
    const limitWidth = Math.min(
      hasEast || hasWest ? maxWidth : page.width,
      (hasNorth || hasSouth ? maxHeight : page.height) * ratio
    );
    const minWidth = Math.max(minSize, minSize * ratio);
    width = clampNumber(width, minWidth, limitWidth);
    height = width / ratio;
  } else {
    width = clampNumber(width, minSize, maxWidth);
    height = clampNumber(height, minSize, maxHeight);
  }

  let x = start.x;
  let y = start.y;

  if (hasWest) x = right - width;
  if (hasSouth) y = top - height;

  if (options.aspectRatio && !(hasEast || hasWest)) {
    x = start.x + (start.width - width) / 2;
  }
  if (options.aspectRatio && !(hasNorth || hasSouth)) {
    y = start.y + (start.height - height) / 2;
  }

  return clampBoxPosition({ x, y, width, height }, page);
}

export function formatCoordinate(value: number, digits = 2) {
  if (!Number.isFinite(value)) return "–";
  const rounded = Math.round(value * 10 ** digits) / 10 ** digits;
  return rounded.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
    useGrouping: false,
  });
}
