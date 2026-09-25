import { getElementBox } from "./coordinates";
import { isValidHexColor } from "./color";
import type { PageSize, PDFElement } from "./types";

const TOLERANCE = 0.0005;

function isFiniteNumber(value: number) {
  return typeof value === "number" && Number.isFinite(value);
}

export function validateElement(element: PDFElement, page: PageSize | undefined): string[] {
  const errors: string[] = [];

  if (!page) {
    errors.push("The page for this element does not exist.");
    return errors;
  }

  const box = getElementBox(element);
  const isQr = element.type === "qr";
  const widthLabel = isQr ? "Size" : "Width";
  const heightLabel = isQr ? "Size" : "Height";

  if (![box.x, box.y, box.width, box.height].every(isFiniteNumber)) {
    errors.push("Position and size must be valid numbers.");
    return errors;
  }

  if (box.x < -TOLERANCE) errors.push("X must be greater than or equal to 0.");
  if (box.y < -TOLERANCE) errors.push("Y must be greater than or equal to 0.");

  if (box.width <= 0) errors.push(`${widthLabel} must be greater than 0.`);
  else if (box.width > page.width + TOLERANCE) errors.push(`${widthLabel} exceeds the PDF page width.`);
  else if (box.x + box.width > page.width + TOLERANCE)
    errors.push(`Element exceeds the right edge of the page (X + ${widthLabel} > page width).`);

  if (box.height <= 0) {
    if (!isQr) errors.push("Height must be greater than 0.");
  } else if (box.height > page.height + TOLERANCE) {
    errors.push(`${heightLabel} exceeds the PDF page height.`);
  } else if (box.y + box.height > page.height + TOLERANCE) {
    errors.push(`Element exceeds the top edge of the page (Y + ${heightLabel} > page height).`);
  }

  if (element.type === "text" || element.type === "multiline-text") {
    if (!isFiniteNumber(element.fontSize) || element.fontSize <= 0) errors.push("Font size must be greater than 0.");
    if (!isValidHexColor(element.color)) errors.push("Text color must be a valid hex color.");
  }

  if (element.type === "multiline-text") {
    if (!isFiniteNumber(element.lineHeight) || element.lineHeight <= 0) errors.push("Line height must be greater than 0.");
  }

  if (element.type === "qr" && element.content.trim().length === 0) {
    errors.push("QR content is required.");
  }

  return errors;
}

export function validateElements(elements: PDFElement[], pageSizes: Record<number, PageSize>) {
  const result: Record<string, string[]> = {};
  for (const element of elements) {
    const errors = validateElement(element, pageSizes[element.pageIndex]);
    if (errors.length > 0) result[element.id] = errors;
  }
  return result;
}
