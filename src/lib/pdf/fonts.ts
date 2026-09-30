import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, StandardFonts, type PDFFont } from "pdf-lib";
import { GOOGLE_FONT_ROWS, type FontCategory } from "./font-catalog";
import type { FontFamily } from "./types";

export type FontStyle = "normal" | "italic";

type FontSource = { kind: "standard"; font: StandardFonts } | { kind: "file"; url: string };

/** A single embeddable face. Its `value` is what gets stored on text elements. */
export type FontOption = {
  value: FontFamily;
  label: string;
  familyKey: string;
  weight: number;
  style: FontStyle;
  source: FontSource;
  cssFamily: string;
  cssWeight: number;
  cssStyle: FontStyle;
};

export type FontFamilyGroup = {
  key: string;
  label: string;
  category: FontCategory | "standard";
  cssFallback: string;
  variants: FontOption[];
};

export const DEFAULT_FONT_FAMILY: FontFamily = "Helvetica";

const CATEGORY_FALLBACK: Record<FontCategory | "standard", string> = {
  standard: "sans-serif",
  "sans-serif": "sans-serif",
  serif: "serif",
  monospace: "monospace",
  display: "sans-serif",
  handwriting: "cursive",
};

export const FONT_CATEGORY_LABELS: Record<FontCategory | "standard", string> = {
  standard: "Standard PDF",
  "sans-serif": "Sans Serif",
  serif: "Serif",
  monospace: "Monospace",
  display: "Display",
  handwriting: "Handwriting & Script",
};

const STANDARD_FAMILIES: { key: string; label: string; css: string; faces: [StandardFonts, number, FontStyle][] }[] = [
  {
    key: "Helvetica",
    label: "Helvetica",
    css: "Helvetica, Arial, 'Liberation Sans', 'Nimbus Sans', sans-serif",
    faces: [
      [StandardFonts.Helvetica, 400, "normal"],
      [StandardFonts.HelveticaBold, 700, "normal"],
      [StandardFonts.HelveticaOblique, 400, "italic"],
      [StandardFonts.HelveticaBoldOblique, 700, "italic"],
    ],
  },
  {
    key: "Times",
    label: "Times",
    css: "'Times New Roman', Times, 'Liberation Serif', 'Nimbus Roman', serif",
    faces: [
      [StandardFonts.TimesRoman, 400, "normal"],
      [StandardFonts.TimesRomanBold, 700, "normal"],
      [StandardFonts.TimesRomanItalic, 400, "italic"],
      [StandardFonts.TimesRomanBoldItalic, 700, "italic"],
    ],
  },
  {
    key: "Courier",
    label: "Courier",
    css: "'Courier New', Courier, 'Liberation Mono', 'Nimbus Mono PS', monospace",
    faces: [
      [StandardFonts.Courier, 400, "normal"],
      [StandardFonts.CourierBold, 700, "normal"],
      [StandardFonts.CourierOblique, 400, "italic"],
      [StandardFonts.CourierBoldOblique, 700, "italic"],
    ],
  },
];

function variantName(weight: number, style: FontStyle) {
  return `${weight === 700 ? "Bold" : "Regular"}${style === "italic" ? " Italic" : ""}`;
}

function fileFace(familyKey: string, label: string, weight: number, style: FontStyle, url: string): FontOption {
  const suffix = `${weight}${style === "italic" ? "i" : ""}`;
  return {
    value: `${familyKey}:${suffix}`,
    label: `${label} ${variantName(weight, style)}`,
    familyKey,
    weight,
    style,
    source: { kind: "file", url },
    // Every file face is registered as its own FontFace, so the browser never synthesizes bold/italic.
    cssFamily: `"pp-${familyKey}-${suffix}"`,
    cssWeight: 400,
    cssStyle: "normal",
  };
}

function buildGroups(): FontFamilyGroup[] {
  const groups: FontFamilyGroup[] = STANDARD_FAMILIES.map((family) => ({
    key: family.key,
    label: family.label,
    category: "standard",
    cssFallback: family.css,
    variants: family.faces.map(([font, weight, style]) => ({
      value: font,
      label: `${family.label} ${variantName(weight, style)}`,
      familyKey: family.key,
      weight,
      style,
      source: { kind: "standard", font },
      cssFamily: family.css,
      cssWeight: weight,
      cssStyle: style,
    })),
  }));

  const tinosFiles: Record<string, string> = { "400": "Regular", "700": "Bold", "400i": "Italic", "700i": "BoldItalic" };
  groups.push({
    key: "tinos",
    label: "Tinos",
    category: "serif",
    cssFallback: CATEGORY_FALLBACK.serif,
    variants: Object.entries(tinosFiles).map(([suffix, name]) =>
      fileFace("tinos", "Tinos", Number.parseInt(suffix, 10), suffix.endsWith("i") ? "italic" : "normal", `/assets/fonts/tinos/Tinos-${name}.ttf`)
    ),
  });

  for (const [key, label, category, variants] of GOOGLE_FONT_ROWS) {
    groups.push({
      key,
      label,
      category,
      cssFallback: CATEGORY_FALLBACK[category],
      variants: variants.split(",").map((suffix) => {
        const weight = Number.parseInt(suffix, 10);
        const style: FontStyle = suffix.endsWith("i") ? "italic" : "normal";
        return fileFace(key, label, weight, style, `/assets/fonts/paperless/${key}/${weight}-${style}.ttf`);
      }),
    });
  }

  return groups;
}

export const FONT_FAMILY_GROUPS: FontFamilyGroup[] = buildGroups();

export const FONT_OPTIONS: FontOption[] = FONT_FAMILY_GROUPS.flatMap((group) => group.variants);

const OPTIONS_BY_VALUE = new Map(FONT_OPTIONS.map((option) => [option.value, option]));
const GROUPS_BY_KEY = new Map(FONT_FAMILY_GROUPS.map((group) => [group.key, group]));

export function getFontOption(family: FontFamily): FontOption {
  return OPTIONS_BY_VALUE.get(family) ?? OPTIONS_BY_VALUE.get(DEFAULT_FONT_FAMILY)!;
}

export function getFontGroup(family: FontFamily): FontFamilyGroup {
  return GROUPS_BY_KEY.get(getFontOption(family).familyKey)!;
}

/** CSS font-family for a face, including the category fallback while the file is still loading. */
export function getFontCssFamily(option: FontOption) {
  if (option.source.kind === "standard") return option.cssFamily;
  return `${option.cssFamily}, ${GROUPS_BY_KEY.get(option.familyKey)?.cssFallback ?? "sans-serif"}`;
}

/** Picks the face of `familyKey` closest to the requested weight/style. */
export function resolveFontVariant(familyKey: string, weight: number, style: FontStyle): FontFamily {
  const group = GROUPS_BY_KEY.get(familyKey) ?? GROUPS_BY_KEY.get(DEFAULT_FONT_FAMILY)!;
  const score = (option: FontOption) => Math.abs(option.weight - weight) + (option.style === style ? 0 : 1000);
  return group.variants.reduce((best, option) => (score(option) < score(best) ? option : best)).value;
}

const fontBytesCache = new Map<string, Promise<ArrayBuffer>>();

function fetchFontBytes(url: string) {
  let pending = fontBytesCache.get(url);
  if (!pending) {
    pending = fetch(url).then((response) => {
      if (!response.ok) throw new Error(`Failed to load font ${url} (${response.status}).`);
      return response.arrayBuffer();
    });
    pending.catch(() => fontBytesCache.delete(url));
    fontBytesCache.set(url, pending);
  }
  return pending;
}

async function embedFontOption(pdfDoc: PDFDocument, option: FontOption, subset: boolean) {
  if (option.source.kind === "standard") return pdfDoc.embedFont(option.source.font);
  const bytes = await fetchFontBytes(option.source.url);
  return pdfDoc.embedFont(bytes, { subset });
}

export type FontRegistry = {
  get(family: FontFamily): PDFFont;
  has(family: FontFamily): boolean;
};

function createRegistry(fonts: Map<FontFamily, PDFFont>): FontRegistry {
  return {
    get(family) {
      const font = fonts.get(getFontOption(family).value);
      if (!font) throw new Error(`Font ${family} is not embedded.`);
      return font;
    },
    has(family) {
      return fonts.has(getFontOption(family).value);
    },
  };
}

export async function embedFonts(pdfDoc: PDFDocument, families: Iterable<FontFamily>): Promise<FontRegistry> {
  pdfDoc.registerFontkit(fontkit);
  const fonts = new Map<FontFamily, PDFFont>();
  const options = new Set(Array.from(families, (family) => getFontOption(family)));
  await Promise.all(
    Array.from(options, async (option) => {
      fonts.set(option.value, await embedFontOption(pdfDoc, option, true));
    })
  );
  return createRegistry(fonts);
}

// Measurement fonts: a throwaway document whose fonts drive layout in the editor preview.
// Standard fonts load up front; file fonts load on demand the first time they are used.
const measurementFonts = new Map<FontFamily, PDFFont>();
const measurementRegistry = createRegistry(measurementFonts);
const measurementLoads = new Map<FontFamily, Promise<void>>();
let measurementDocPromise: Promise<PDFDocument> | null = null;

function getMeasurementDoc() {
  if (!measurementDocPromise) {
    measurementDocPromise = PDFDocument.create().then((doc) => {
      doc.registerFontkit(fontkit);
      return doc;
    });
    measurementDocPromise.catch(() => {
      measurementDocPromise = null;
    });
  }
  return measurementDocPromise;
}

async function registerBrowserFace(option: FontOption) {
  if (option.source.kind !== "file" || typeof document === "undefined" || typeof FontFace === "undefined") return;
  const bytes = await fetchFontBytes(option.source.url);
  const face = new FontFace(option.cssFamily.replace(/"/g, ""), bytes.slice(0));
  await face.load();
  document.fonts.add(face);
}

export function ensureMeasurementFont(family: FontFamily): Promise<void> {
  const option = getFontOption(family);
  if (measurementFonts.has(option.value)) return Promise.resolve();
  let pending = measurementLoads.get(option.value);
  if (!pending) {
    pending = (async () => {
      const doc = await getMeasurementDoc();
      const [font] = await Promise.all([embedFontOption(doc, option, false), registerBrowserFace(option)]);
      measurementFonts.set(option.value, font);
    })();
    pending.catch(() => measurementLoads.delete(option.value));
    measurementLoads.set(option.value, pending);
  }
  return pending;
}

export function loadMeasurementFonts(): Promise<FontRegistry> {
  const standard = FONT_OPTIONS.filter((option) => option.source.kind === "standard");
  return Promise.all(standard.map((option) => ensureMeasurementFont(option.value))).then(() => measurementRegistry);
}

export function getMeasurementFonts(): FontRegistry {
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
