import type { PDFFont } from "pdf-lib";
import { sanitizeTextForFont } from "./fonts";
import { calculateLineBaseline, calculateTextBaseline, getFontVerticalMetrics, type FontMetricsSource } from "./text-baseline";
import type { BoundingBox, MultilineTextElement, TextAlign, TextElement } from "./types";

const EPSILON = 0.001;

export type TextLine = {
  text: string;
  x: number;
  baseline: number;
  width: number;
};

export type TextLayout = {
  lines: TextLine[];
  overflow: boolean;
  hasUnsupportedCharacters: boolean;
  totalLineCount: number;
  visibleLineCount: number;
};

export function alignLineX(box: BoundingBox, lineWidth: number, align: TextAlign) {
  if (align === "center") return box.x + (box.width - lineWidth) / 2;
  if (align === "right") return box.x + box.width - lineWidth;
  return box.x;
}

function breakLongWord(word: string, font: FontMetricsSource, fontSize: number, maxWidth: number) {
  const pieces: string[] = [];
  let current = "";
  for (const char of word) {
    const candidate = current + char;
    if (current && font.widthOfTextAtSize(candidate, fontSize) > maxWidth + EPSILON) {
      pieces.push(current);
      current = char;
    } else {
      current = candidate;
    }
  }
  if (current) pieces.push(current);
  return pieces;
}

export function wrapText({
  text,
  font,
  fontSize,
  maxWidth,
}: {
  text: string;
  font: FontMetricsSource;
  fontSize: number;
  maxWidth: number;
}): string[] {
  const lines: string[] = [];
  const paragraphs = text.split(/\r\n|\r|\n/);

  for (const paragraph of paragraphs) {
    if (paragraph.length === 0) {
      lines.push("");
      continue;
    }

    const words = paragraph.split(" ");
    let current: string | null = null;

    for (const word of words) {
      const candidate: string = current === null ? word : `${current} ${word}`;
      if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth + EPSILON) {
        current = candidate;
        continue;
      }

      if (current !== null) lines.push(current);

      if (font.widthOfTextAtSize(word, fontSize) > maxWidth + EPSILON) {
        const pieces = breakLongWord(word, font, fontSize, maxWidth);
        lines.push(...pieces.slice(0, -1));
        current = pieces[pieces.length - 1] ?? "";
      } else {
        current = word;
      }
    }

    lines.push(current ?? "");
  }

  return lines;
}

type TextLayoutInput = Pick<TextElement, "x" | "y" | "width" | "height" | "content" | "fontSize" | "textAlign">;

export function calculateTextLayout(element: TextLayoutInput, font: PDFFont): TextLayout {
  const singleLine = element.content.replace(/\r\n|\r|\n/g, " ");
  const { text, hasUnsupported } = sanitizeTextForFont(font, singleLine);
  const width = font.widthOfTextAtSize(text, element.fontSize);
  const { contentHeight } = getFontVerticalMetrics(font, element.fontSize);
  const baseline = calculateTextBaseline({
    y: element.y,
    height: element.height,
    font,
    fontSize: element.fontSize,
  });
  const overflow = width > element.width + EPSILON || contentHeight > element.height + EPSILON;
  const lines = text.length > 0 ? [{ text, width, baseline, x: alignLineX(element, width, element.textAlign) }] : [];

  return {
    lines,
    overflow,
    hasUnsupportedCharacters: hasUnsupported,
    totalLineCount: lines.length,
    visibleLineCount: lines.length,
  };
}

type MultilineLayoutInput = Pick<
  MultilineTextElement,
  "x" | "y" | "width" | "height" | "content" | "fontSize" | "lineHeight" | "textAlign"
>;

export function calculateMultilineTextLayout(element: MultilineLayoutInput, font: PDFFont): TextLayout {
  const { text, hasUnsupported } = sanitizeTextForFont(font, element.content);
  const wrapped = wrapText({
    text,
    font,
    fontSize: element.fontSize,
    maxWidth: Math.max(element.width, 0),
  });

  while (wrapped.length > 0 && wrapped[wrapped.length - 1] === "" && wrapped.length > 1) {
    wrapped.pop();
  }

  const lineHeight = element.lineHeight > 0 ? element.lineHeight : element.fontSize;
  const maxLines = Math.max(0, Math.floor((element.height + EPSILON) / lineHeight));
  const visible = wrapped.slice(0, maxLines);
  const top = element.y + element.height;

  const lines: TextLine[] = visible.map((line, index) => {
    const width = font.widthOfTextAtSize(line, element.fontSize);
    return {
      text: line,
      width,
      x: alignLineX(element, width, element.textAlign),
      baseline: calculateLineBaseline({
        lineTop: top - index * lineHeight,
        lineHeight,
        font,
        fontSize: element.fontSize,
      }),
    };
  });

  const hasContent = text.trim().length > 0;

  return {
    lines: lines.filter((line) => line.text.length > 0),
    overflow: hasContent && wrapped.length > maxLines,
    hasUnsupportedCharacters: hasUnsupported,
    totalLineCount: wrapped.length,
    visibleLineCount: visible.length,
  };
}
