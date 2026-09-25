"use client";

import { memo } from "react";
import type { PreviewSize } from "@/lib/pdf/coordinates";
import type { PageSize, PDFElement as PDFElementData } from "@/lib/pdf/types";
import { ImageElement } from "./image/image-element";
import { MultilineTextElement } from "./multiline-text/multiline-text-element";
import { QRElement } from "./qr/qr-element";
import { SignatureElement } from "./signature/signature-element";
import { useEditorStore } from "./store";
import { TextElement } from "./text/text-element";

export const CONTENT_FIELD_ID = "property-content";

export function focusContentField() {
  const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
  if (!isDesktop) useEditorStore.getState().setPropertiesSheetOpen(true);
  window.setTimeout(() => {
    const field = document.getElementById(CONTENT_FIELD_ID);
    if (field instanceof HTMLTextAreaElement || field instanceof HTMLInputElement) {
      field.focus();
      field.select();
    }
  }, isDesktop ? 0 : 250);
}

type Props = {
  element: PDFElementData;
  pageSize: PageSize;
  previewSize: PreviewSize;
  selected: boolean;
  invalid: boolean;
};

function PDFElementRenderer({ element, ...common }: Props) {
  switch (element.type) {
    case "signature":
      return <SignatureElement element={element} {...common} />;
    case "text":
      return <TextElement element={element} onActivate={focusContentField} {...common} />;
    case "multiline-text":
      return <MultilineTextElement element={element} onActivate={focusContentField} {...common} />;
    case "qr":
      return <QRElement element={element} onActivate={focusContentField} {...common} />;
    case "image":
      return <ImageElement element={element} {...common} />;
  }
}

export const PDFElement = memo(PDFElementRenderer);
