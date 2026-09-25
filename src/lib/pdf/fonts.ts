import { PDFDocument, StandardFonts, type PDFFont } from "pdf-lib";
import type { FontFamily } from "./types";

export type FontOption = {
  value: FontFamily;
  label: string;
  standardFont: StandardFonts;
  cssFamily: string;
  cssWeight: number;
  cssStyle: "normal" | "italic";
};

const HELVETICA_CSS_STACK = "Helvetica, Arial, 'Liberation Sans', 'Nimbus Sans', sans-serif";

export const FONT_OPTIONS: FontOption[] = [
  {
    value: "Helvetica",
    label: "Helvetica",
    standardFont: StandardFonts.Helvetica,
    cssFamily: HELVETICA_CSS_STACK,
    cssWeight: 400,
    cssStyle: "normal",
  },
  {
    value: "Helvetica-Bold",
    label: "Helvetica Bold",
    standardFont: StandardFonts.HelveticaBold,
    cssFamily: HELVETICA_CSS_STACK,
    cssWeight: 700,
    cssStyle: "normal",
  },
  {
    value: "Helvetica-Oblique",
    label: "Helvetica Oblique",
    standardFont: StandardFonts.HelveticaOblique,
    cssFamily: HELVETICA_CSS_STACK,
    cssWeight: 400,
    cssStyle: "italic",
  },
  {
    value: "Helvetica-BoldOblique",
    label: "Helvetica Bold Oblique",
    standardFont: StandardFonts.HelveticaBoldOblique,
    cssFamily: HELVETICA_CSS_STACK,
    cssWeight: 700,
    cssStyle: "italic",
  },
];

export function getFontOption(family: FontFamily): FontOption {
  return FONT_OPTIONS.find((option) => option.value === family) ?? FONT_OPTIONS[0];
}

export type FontRegistry = {
  get(family: FontFamily): PDFFont;
};

export async function embedFonts(pdfDoc: PDFDocument, families: Iterable<FontFamily>): Promise<FontRegistry> {
  const fonts = new Map<FontFamily, PDFFont>();
  for (const family of new Set(families)) {
    const option = getFontOption(family);
    fonts.set(family, await pdfDoc.embedFont(option.standardFont));
  }
  return {
    get(family) {
      const font = fonts.get(family);
      if (!font) throw new Error(`Font ${family} is not embedded.`);
      return font;
    },
  };
}

let measurementRegistry: FontRegistry | null = null;
let measurementPromise: Promise<FontRegistry> | null = null;

export function loadMeasurementFonts(): Promise<FontRegistry> {
  if (measurementRegistry) return Promise.resolve(measurementRegistry);
  if (!measurementPromise) {
    measurementPromise = PDFDocument.create()
      .then((doc) =>
        embedFonts(
          doc,
          FONT_OPTIONS.map((option) => option.value)
        )
      )
      .then((registry) => {
        measurementRegistry = registry;
        return registry;
      })
      .catch((error) => {
        measurementPromise = null;
        throw error;
      });
  }
  return measurementPromise;
}

export function getMeasurementFonts(): FontRegistry | null {
  return measurementRegistry;
}

const characterSetCache = new WeakMap<PDFFont, Set<number>>();

function getCharacterSet(font: PDFFont) {
  let set = characterSetCache.get(font);
  if (!set) {
    set = new Set(font.getCharacterSet());
    characterSetCache.set(font, set);
  }
  return set;
}

export function sanitizeTextForFont(font: PDFFont, text: string) {
  const supported = getCharacterSet(font);
  let hasUnsupported = false;
  let result = "";
  for (const char of text.replace(/\t/g, "    ")) {
    const codePoint = char.codePointAt(0) ?? 0;
    if (supported.has(codePoint)) {
      result += char;
    } else {
      hasUnsupported = true;
      result += "?";
    }
  }
  return { text: result, hasUnsupported };
}
