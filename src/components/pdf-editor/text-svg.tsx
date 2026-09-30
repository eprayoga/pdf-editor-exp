"use client";

import { useEffect, useMemo } from "react";
import { toast } from "sonner";
import { ensureMeasurementFont, getFontCssFamily, getFontOption, getMeasurementFonts } from "@/lib/pdf/fonts";
import { calculateMultilineTextLayout, calculateTextLayout, type TextLayout } from "@/lib/pdf/text-layout";
import type { FontFamily, MultilineTextElement, TextElement } from "@/lib/pdf/types";
import { normalizeHexColor } from "@/lib/pdf/color";
import { useEditorStore } from "./store";

/** Loads a font on demand and re-renders once it is available for measurement. */
export function useFontLoaded(family: FontFamily | null | undefined) {
  const fontsReady = useEditorStore((state) => state.fontsReady);
  // Subscribing to fontVersion re-renders every consumer when any lazy font finishes loading.
  useEditorStore((state) => state.fontVersion);
  const loaded = !!family && fontsReady && getMeasurementFonts().has(family);

  useEffect(() => {
    if (!family || !fontsReady || getMeasurementFonts().has(family)) return;
    let cancelled = false;
    ensureMeasurementFont(family)
      .then(() => {
        if (!cancelled) useEditorStore.getState().bumpFontVersion();
      })
      .catch(() => {
        if (!cancelled) toast.error(`Failed to load font “${getFontOption(family).label}”.`);
      });
    return () => {
      cancelled = true;
    };
  }, [family, fontsReady]);

  return loaded;
}

export function useTextLayout(element: TextElement | MultilineTextElement | null): TextLayout | null {
  const fontLoaded = useFontLoaded(element?.fontFamily);
  const lineHeight = element?.type === "multiline-text" ? element.lineHeight : 0;

  return useMemo(() => {
    if (!element || !fontLoaded) return null;
    const font = getMeasurementFonts().get(element.fontFamily);
    if (!(element.fontSize > 0) || !(element.width > 0) || !(element.height > 0)) return null;
    return element.type === "multiline-text"
      ? calculateMultilineTextLayout(element, font)
      : calculateTextLayout(element, font);
  }, [
    fontLoaded,
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

export function TextBackground({ element }: { element: TextElement | MultilineTextElement }) {
  const opacity = Math.min(Math.max(element.backgroundOpacity ?? 0, 0), 1);
  if (opacity <= 0) return null;
  return (
    <div
      className="absolute inset-0"
      style={{ backgroundColor: normalizeHexColor(element.backgroundColor ?? "#ffffff", "#ffffff"), opacity }}
      aria-hidden="true"
    />
  );
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
          fontFamily={getFontCssFamily(font)}
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
