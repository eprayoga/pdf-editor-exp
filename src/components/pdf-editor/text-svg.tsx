"use client";

import { useMemo } from "react";
import { getFontOption, getMeasurementFonts } from "@/lib/pdf/fonts";
import { calculateMultilineTextLayout, calculateTextLayout, type TextLayout } from "@/lib/pdf/text-layout";
import type { MultilineTextElement, TextElement } from "@/lib/pdf/types";
import { normalizeHexColor } from "@/lib/pdf/color";
import { useEditorStore } from "./store";

export function useTextLayout(element: TextElement | MultilineTextElement | null): TextLayout | null {
  const fontsReady = useEditorStore((state) => state.fontsReady);
  const lineHeight = element?.type === "multiline-text" ? element.lineHeight : 0;

  return useMemo(() => {
    const fonts = getMeasurementFonts();
    if (!element || !fontsReady || !fonts) return null;
    const font = fonts.get(element.fontFamily);
    if (!(element.fontSize > 0) || !(element.width > 0) || !(element.height > 0)) return null;
    return element.type === "multiline-text"
      ? calculateMultilineTextLayout(element, font)
      : calculateTextLayout(element, font);
  }, [
    fontsReady,
    element?.type,
    element?.x,
    element?.y,
    element?.width,
    element?.height,
    element?.content,
    element?.fontSize,
    element?.fontFamily,
    element?.textAlign,
    lineHeight,
  ]);
}

type TextSvgProps = {
  element: TextElement | MultilineTextElement;
  layout: TextLayout;
  clip: boolean;
};

export function TextSvg({ element, layout, clip }: TextSvgProps) {
  const font = getFontOption(element.fontFamily);
  const top = element.y + element.height;
  const width = Math.max(element.width, 0.0001);
  const height = Math.max(element.height, 0.0001);

  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      overflow={clip ? "hidden" : "visible"}
      aria-hidden="true"
    >
      {layout.lines.map((line, index) => (
        <text
          key={index}
          x={line.x - element.x}
          y={top - line.baseline}
          fontSize={element.fontSize}
          fontFamily={font.cssFamily}
          fontWeight={font.cssWeight}
          fontStyle={font.cssStyle}
          fill={normalizeHexColor(element.color)}
          textLength={line.width > 0 ? line.width : undefined}
          lengthAdjust="spacingAndGlyphs"
          style={{ whiteSpace: "pre" }}
        >
          {line.text}
        </text>
      ))}
    </svg>
  );
}
