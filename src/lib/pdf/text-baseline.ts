import type { PDFFont } from "pdf-lib";

export type FontMetricsSource = Pick<PDFFont, "widthOfTextAtSize" | "heightAtSize">;

export type FontVerticalMetrics = {
  ascent: number;
  descent: number;
  contentHeight: number;
};

export function getFontVerticalMetrics(font: FontMetricsSource, fontSize: number): FontVerticalMetrics {
  const contentHeight = font.heightAtSize(fontSize);
  const ascent = font.heightAtSize(fontSize, { descender: false });
  return {
    ascent,
    descent: contentHeight - ascent,
    contentHeight,
  };
}

export function calculateLineBaseline({
  lineTop,
  lineHeight,
  font,
  fontSize,
}: {
  lineTop: number;
  lineHeight: number;
  font: FontMetricsSource;
  fontSize: number;
}) {
  const { ascent, contentHeight } = getFontVerticalMetrics(font, fontSize);
  return lineTop - (lineHeight - contentHeight) / 2 - ascent;
}

export function calculateTextBaseline({
  y,
  height,
  font,
  fontSize,
}: {
  y: number;
  height: number;
  font: FontMetricsSource;
  fontSize: number;
}) {
  return calculateLineBaseline({
    lineTop: y + height,
    lineHeight: height,
    font,
    fontSize,
  });
}
