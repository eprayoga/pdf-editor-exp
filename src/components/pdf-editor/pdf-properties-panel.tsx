"use client";

import { Cursor } from "@phosphor-icons/react";
import { validateElement } from "@/lib/pdf/validation";
import type { PDFElement } from "@/lib/pdf/types";
import { ImageProperties } from "./image/image-properties";
import { MultilineTextProperties } from "./multiline-text/multiline-text-properties";
import { QRProperties } from "./qr/qr-properties";
import { SignatureProperties } from "./signature/signature-properties";
import { useEditorStore, useSelectedElement } from "./store";
import { TextProperties } from "./text/text-properties";

function ElementProperties({ element, errors }: { element: PDFElement; errors: string[] }) {
  switch (element.type) {
    case "signature":
      return <SignatureProperties element={element} errors={errors} />;
    case "text":
      return <TextProperties element={element} errors={errors} />;
    case "multiline-text":
      return <MultilineTextProperties element={element} errors={errors} />;
    case "qr":
      return <QRProperties element={element} errors={errors} />;
    case "image":
      return <ImageProperties element={element} errors={errors} />;
  }
}

export function PdfPropertiesPanel() {
  const element = useSelectedElement();
  const pageSize = useEditorStore((state) => (element ? state.pageSizes[element.pageIndex] : undefined));

  if (!element) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-12 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border bg-muted/50 text-muted-foreground">
          <Cursor className="h-5 w-5" />
        </div>
        <p className="text-sm text-muted-foreground">
          Select an element
          <br />
          to edit its properties.
        </p>
      </div>
    );
  }

  const errors = validateElement(element, pageSize);

  return (
    <div className="p-4">
      <ElementProperties key={element.id} element={element} errors={errors} />
    </div>
  );
}
