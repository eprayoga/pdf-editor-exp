import { fitBoxInPage } from "@/lib/pdf/coordinates";
import type {
  BoundingBox,
  ImageElement,
  ImageMimeType,
  MultilineTextElement,
  PageSize,
  PDFElementType,
  QRElement,
  SignatureElement,
  TextElement,
} from "@/lib/pdf/types";
import { fitSizeWithin } from "@/lib/image/image-utils";

type PlacementContext = {
  pageIndex: number;
  page: PageSize;
  existingCount: number;
};

export function createElementId(type: PDFElementType) {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${type}-${random}`;
}

function placeCentered(width: number, height: number, context: PlacementContext): BoundingBox {
  const offset = (context.existingCount % 8) * 12;
  const box = {
    x: (context.page.width - width) / 2 + offset,
    y: (context.page.height - height) / 2 - offset,
    width,
    height,
  };
  return fitBoxInPage(box, context.page);
}

export function createSignatureElement(
  context: PlacementContext,
  image: { dataUrl: string; width: number; height: number }
): SignatureElement {
  const ratio = image.width / image.height;
  let height = 50;
  let width = height * ratio;
  if (width > 200) {
    width = 200;
    height = width / ratio;
  }
  const size = fitSizeWithin(width, height, context.page.width, context.page.height);
  const box = placeCentered(size.width, size.height, context);
  return {
    id: createElementId("signature"),
    type: "signature",
    pageIndex: context.pageIndex,
    ...box,
    imageData: image.dataUrl,
  };
}

export function createTextElement(context: PlacementContext): TextElement {
  const box = placeCentered(200, 30, context);
  return {
    id: createElementId("text"),
    type: "text",
    pageIndex: context.pageIndex,
    ...box,
    content: "Hello World",
    fontSize: 16,
    fontFamily: "Helvetica",
    textAlign: "left",
    color: "#111827",
  };
}

export function createMultilineTextElement(context: PlacementContext): MultilineTextElement {
  const box = placeCentered(300, 100, context);
  return {
    id: createElementId("multiline-text"),
    type: "multiline-text",
    pageIndex: context.pageIndex,
    ...box,
    content: "This is a multiline text example.\nLong lines wrap automatically based on the width of the box.",
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "Helvetica",
    textAlign: "left",
    color: "#111827",
  };
}

export function createQrElement(context: PlacementContext, input: { content: string; size: number }): QRElement {
  const size = Math.min(input.size, context.page.width, context.page.height);
  const box = placeCentered(size, size, context);
  return {
    id: createElementId("qr"),
    type: "qr",
    pageIndex: context.pageIndex,
    x: box.x,
    y: box.y,
    size: box.width,
    content: input.content,
  };
}

export function createImageElement(
  context: PlacementContext,
  image: { dataUrl: string; mimeType: ImageMimeType; width: number; height: number }
): ImageElement {
  const aspectRatio = image.width / image.height;
  const size = fitSizeWithin(image.width, image.height, Math.min(200, context.page.width), context.page.height);
  const box = placeCentered(size.width, size.height, context);
  return {
    id: createElementId("image"),
    type: "image",
    pageIndex: context.pageIndex,
    ...box,
    imageData: image.dataUrl,
    mimeType: image.mimeType,
    lockAspectRatio: true,
    aspectRatio,
  };
}
