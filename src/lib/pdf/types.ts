export type TextAlign = "left" | "center" | "right";

export type FontFamily = "Helvetica" | "Helvetica-Bold" | "Helvetica-Oblique" | "Helvetica-BoldOblique";

export type PageSize = {
  width: number;
  height: number;
};

export type BoundingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type PositionDetails = {
  lowerLeftX: number;
  lowerLeftY: number;
  upperRightX: number;
  upperRightY: number;
};

type BaseElement = {
  id: string;
  pageIndex: number;
  x: number;
  y: number;
};

export type SignatureElement = BaseElement & {
  type: "signature";
  width: number;
  height: number;
  imageData: string;
};

export type TextElement = BaseElement & {
  type: "text";
  width: number;
  height: number;
  content: string;
  fontSize: number;
  fontFamily: FontFamily;
  textAlign: TextAlign;
  color: string;
};

export type MultilineTextElement = BaseElement & {
  type: "multiline-text";
  width: number;
  height: number;
  content: string;
  fontSize: number;
  lineHeight: number;
  fontFamily: FontFamily;
  textAlign: TextAlign;
  color: string;
};

export type QRElement = BaseElement & {
  type: "qr";
  size: number;
  content: string;
};

export type ImageMimeType = "image/png" | "image/jpeg";

export type ImageElement = BaseElement & {
  type: "image";
  width: number;
  height: number;
  imageData: string;
  mimeType: ImageMimeType;
  lockAspectRatio: boolean;
  aspectRatio: number;
};

export type PDFElement = SignatureElement | QRElement | TextElement | MultilineTextElement | ImageElement;

export type PDFElementType = PDFElement["type"];

export type ElementPatch = Partial<Omit<SignatureElement, "type" | "id">> &
  Partial<Omit<TextElement, "type" | "id">> &
  Partial<Omit<MultilineTextElement, "type" | "id">> &
  Partial<Omit<QRElement, "type" | "id">> &
  Partial<Omit<ImageElement, "type" | "id">>;
