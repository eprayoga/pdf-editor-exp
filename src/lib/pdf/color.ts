import { rgb, type RGB } from "pdf-lib";

const HEX_PATTERN = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function isValidHexColor(value: string) {
  return HEX_PATTERN.test(value.trim());
}

export function normalizeHexColor(value: string, fallback = "#111827") {
  const match = value.trim().match(HEX_PATTERN);
  if (!match) return fallback;
  let hex = match[1].toLowerCase();
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((char) => char + char)
      .join("");
  }
  return `#${hex}`;
}

export function hexToRgbComponents(value: string) {
  const hex = normalizeHexColor(value).slice(1);
  return {
    r: parseInt(hex.slice(0, 2), 16) / 255,
    g: parseInt(hex.slice(2, 4), 16) / 255,
    b: parseInt(hex.slice(4, 6), 16) / 255,
  };
}

export function hexToPdfRgb(value: string): RGB {
  const { r, g, b } = hexToRgbComponents(value);
  return rgb(r, g, b);
}
