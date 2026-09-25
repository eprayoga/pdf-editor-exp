"use client";

import type { ComponentType } from "react";
import { toast } from "sonner";
import {
  Image as ImageIcon,
  Plus,
  QrCode,
  Signature,
  TextAlignLeft,
  TextT,
  WarningCircle,
  type IconProps,
} from "@phosphor-icons/react";
import { formatCoordinate } from "@/lib/pdf/coordinates";
import type { PDFElement, PDFElementType } from "@/lib/pdf/types";
import { validateElement } from "@/lib/pdf/validation";
import { cn } from "@/lib/utils";
import { createMultilineTextElement, createTextElement } from "./element-factory";
import { getPlacementContext, useEditorStore, type ActiveDialog } from "./store";

type ComponentItem = {
  type: PDFElementType;
  label: string;
  description: string;
  icon: ComponentType<IconProps>;
  dialog?: Exclude<ActiveDialog, null>;
};

export const COMPONENT_ITEMS: ComponentItem[] = [
  { type: "signature", label: "Signature", description: "Draw or upload", icon: Signature, dialog: "signature" },
  { type: "text", label: "Text", description: "Single line", icon: TextT },
  { type: "multiline-text", label: "Multiline Text", description: "Wrapped paragraph", icon: TextAlignLeft },
  { type: "qr", label: "QR Code", description: "From text or URL", icon: QrCode, dialog: "qr" },
  { type: "image", label: "Image", description: "PNG, JPG, WebP", icon: ImageIcon, dialog: "image" },
];

export const ELEMENT_ICONS: Record<PDFElementType, ComponentType<IconProps>> = {
  signature: Signature,
  text: TextT,
  "multiline-text": TextAlignLeft,
  qr: QrCode,
  image: ImageIcon,
};

const ELEMENT_LABELS: Record<PDFElementType, string> = {
  signature: "Signature",
  text: "Text",
  "multiline-text": "Multiline Text",
  qr: "QR Code",
  image: "Image",
};

function describeElement(element: PDFElement) {
  if (element.type === "text" || element.type === "multiline-text" || element.type === "qr") {
    const content = element.content.replace(/\s+/g, " ").trim();
    return content.length > 0 ? content : "Empty";
  }
  return `${formatCoordinate(element.width)} × ${formatCoordinate(element.height)} pt`;
}

export function PdfSidebar({ onAction }: { onAction?: () => void }) {
  const setActiveDialog = useEditorStore((state) => state.setActiveDialog);
  const addElement = useEditorStore((state) => state.addElement);
  const currentPage = useEditorStore((state) => state.currentPage);
  const elements = useEditorStore((state) => state.elements);
  const pageSizes = useEditorStore((state) => state.pageSizes);
  const selectedElementId = useEditorStore((state) => state.selectedElementId);
  const selectElement = useEditorStore((state) => state.selectElement);

  const pageElements = elements.filter((element) => element.pageIndex === currentPage);

  const handleAdd = (item: ComponentItem) => {
    onAction?.();
    if (item.dialog) {
      setActiveDialog(item.dialog);
      return;
    }
    const context = getPlacementContext();
    if (!context) {
      toast.error("Upload a PDF before adding elements.");
      return;
    }
    if (item.type === "text") addElement(createTextElement(context));
    if (item.type === "multiline-text") addElement(createMultilineTextElement(context));
  };

  return (
    <div className="space-y-6 p-4">
      <section className="space-y-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Components</h2>
        <div className="space-y-1.5">
          {COMPONENT_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.type}
                type="button"
                onClick={() => handleAdd(item)}
                aria-label={`Add ${item.label}`}
                className="group flex w-full items-center gap-3 rounded-md border bg-background px-3 py-2.5 text-left shadow-sm transition-colors hover:border-zinc-300 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-foreground">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium leading-tight">{item.label}</span>
                  <span className="block text-xs text-muted-foreground">{item.description}</span>
                </span>
                <Plus className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">On this page</h2>
          <span className="text-xs tabular-nums text-muted-foreground">{pageElements.length}</span>
        </div>
        {pageElements.length === 0 ? (
          <p className="rounded-md border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">
            No elements on page {currentPage + 1} yet.
          </p>
        ) : (
          <ul className="space-y-1" aria-label="Elements on this page">
            {pageElements.map((element) => {
              const Icon = ELEMENT_ICONS[element.type];
              const invalid = validateElement(element, pageSizes[element.pageIndex]).length > 0;
              const selected = element.id === selectedElementId;
              return (
                <li key={element.id}>
                  <button
                    type="button"
                    onClick={() => {
                      selectElement(element.id);
                      onAction?.();
                    }}
                    aria-current={selected}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      selected && "bg-muted"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium leading-tight">{ELEMENT_LABELS[element.type]}</span>
                      <span className="block truncate text-xs text-muted-foreground">{describeElement(element)}</span>
                    </span>
                    {invalid && <WarningCircle aria-label="Invalid position" className="h-4 w-4 shrink-0 text-destructive" />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-2 rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
        <h2 className="font-medium text-foreground">Coordinate system</h2>
        <p>
          PDF points with origin <span className="font-medium text-foreground">(0,0)</span> at the bottom-left. X increases to the right,
          Y increases upward.
        </p>
        {pageSizes[currentPage] && (
          <p className="tabular-nums">
            Page {currentPage + 1}: {formatCoordinate(pageSizes[currentPage].width)} × {formatCoordinate(pageSizes[currentPage].height)} pt
          </p>
        )}
        <p>Arrow keys move 1 pt, Shift + Arrow moves 10 pt.</p>
      </section>
    </div>
  );
}
