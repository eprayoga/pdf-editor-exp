"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import { loadMeasurementFonts } from "@/lib/pdf/fonts";
import { buildOutputFileName, downloadPdf, generatePdf } from "@/lib/pdf/generate-pdf";
import { loadPdfJsDocument, readPdfFile } from "@/lib/pdf/load-pdf";
import { validateElements } from "@/lib/pdf/validation";
import { EmptyState } from "./empty-state";
import { ImageDialog } from "./image/image-dialog";
import { PdfCanvas } from "./pdf-canvas";
import { PdfPropertiesPanel } from "./pdf-properties-panel";
import { PdfSidebar } from "./pdf-sidebar";
import { PdfToolbar } from "./pdf-toolbar";
import { QRDialog } from "./qr/qr-dialog";
import { SignatureDialog } from "./signature/signature-dialog";
import { useEditorStore } from "./store";
import { useKeyboardShortcuts } from "./use-keyboard-shortcuts";

export function PdfEditor() {
  const status = useEditorStore((state) => state.status);
  const elements = useEditorStore((state) => state.elements);
  const pageSizes = useEditorStore((state) => state.pageSizes);
  const componentsSheetOpen = useEditorStore((state) => state.componentsSheetOpen);
  const propertiesSheetOpen = useEditorStore((state) => state.propertiesSheetOpen);
  const setComponentsSheetOpen = useEditorStore((state) => state.setComponentsSheetOpen);
  const setPropertiesSheetOpen = useEditorStore((state) => state.setPropertiesSheetOpen);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  useKeyboardShortcuts(status === "ready");

  useEffect(() => {
    let cancelled = false;
    loadMeasurementFonts()
      .then(() => {
        if (!cancelled) useEditorStore.getState().setFontsReady(true);
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load PDF fonts for text layout.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      useEditorStore.getState().closeDocument();
    };
  }, []);

  const invalidMap = useMemo(() => validateElements(elements, pageSizes), [elements, pageSizes]);
  const invalidCount = Object.keys(invalidMap).length;

  const openPdf = useCallback(async (file: File) => {
    const store = useEditorStore.getState();
    const wasReady = store.status === "ready";
    if (!wasReady) store.setStatus("loading");
    const toastId = toast.loading("Loading PDF...");

    try {
      const loaded = await readPdfFile(file);
      let renderDocument: PDFDocumentProxy;
      try {
        renderDocument = await loadPdfJsDocument(loaded.bytes);
      } catch {
        throw new Error("The PDF could not be rendered. It may be corrupted.");
      }
      useEditorStore.getState().setDocument({
        file,
        bytes: loaded.bytes,
        renderDocument,
        pageCount: loaded.pageCount,
        pageSizes: loaded.pageSizes,
      });
      toast.success("PDF loaded", {
        id: toastId,
        description: `${file.name} · ${loaded.pageCount} page${loaded.pageCount === 1 ? "" : "s"}`,
      });
    } catch (error) {
      if (!wasReady) useEditorStore.getState().setStatus("idle");
      toast.error("Failed to load PDF", {
        id: toastId,
        description: error instanceof Error ? error.message : "The file could not be opened.",
      });
    }
  }, []);

  const handleGenerate = useCallback(async () => {
    const state = useEditorStore.getState();
    if (!state.pdfBytes || state.isGenerating) return;

    const invalid = validateElements(state.elements, state.pageSizes);
    const invalidIds = Object.keys(invalid);
    if (invalidIds.length > 0) {
      const first = state.elements.find((element) => element.id === invalidIds[0]);
      if (first) {
        state.setCurrentPage(first.pageIndex);
        state.selectElement(first.id);
      }
      toast.error("Cannot generate PDF", {
        description: invalid[invalidIds[0]][0] ?? "Some elements have invalid positions.",
      });
      return;
    }

    state.setGenerating(true);
    const toastId = toast.loading("Generating PDF...");
    try {
      const bytes = await generatePdf({
        pdfBytes: state.pdfBytes,
        elements: state.elements,
        pageSizes: state.pageSizes,
      });
      const fileName = buildOutputFileName(state.pdfFile?.name ?? null);
      downloadPdf(bytes, fileName);
      toast.success("PDF generated", { id: toastId, description: fileName });
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate PDF.", {
        id: toastId,
        description: "Please check the element positions and try again.",
      });
    } finally {
      useEditorStore.getState().setGenerating(false);
    }
  }, []);

  if (status !== "ready") {
    return (
      <div className="font-[family-name:var(--font-geist-sans)]">
        <EmptyState loading={status === "loading"} onFile={openPdf} />
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground font-[family-name:var(--font-geist-sans)]">
        <PdfToolbar
          invalidCount={invalidCount}
          onGenerate={() => void handleGenerate()}
          onReplace={() => replaceInputRef.current?.click()}
        />
        <input
          ref={replaceInputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          aria-label="Open another PDF file"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void openPdf(file);
            event.target.value = "";
          }}
        />

        <div className="flex min-h-0 flex-1">
          <aside aria-label="Components" className="hidden w-64 shrink-0 border-r bg-background lg:block">
            <ScrollArea className="h-full">
              <PdfSidebar />
            </ScrollArea>
          </aside>

          <main className="flex min-w-0 flex-1">
            <PdfCanvas />
          </main>

          <aside aria-label="Properties" className="hidden w-80 shrink-0 border-l bg-background lg:block">
            <div className="flex h-11 items-center border-b px-4">
              <h2 className="text-sm font-semibold">Properties</h2>
            </div>
            <ScrollArea className="h-[calc(100%-2.75rem)]">
              <PdfPropertiesPanel />
            </ScrollArea>
          </aside>
        </div>

        <Sheet open={componentsSheetOpen} onOpenChange={setComponentsSheetOpen}>
          <SheetContent side="left" className="p-0">
            <div className="border-b px-4 py-3.5">
              <SheetTitle>Components</SheetTitle>
              <SheetDescription className="sr-only">Add elements to the current page.</SheetDescription>
            </div>
            <ScrollArea className="min-h-0 flex-1">
              <PdfSidebar onAction={() => setComponentsSheetOpen(false)} />
            </ScrollArea>
          </SheetContent>
        </Sheet>

        <Sheet open={propertiesSheetOpen} onOpenChange={setPropertiesSheetOpen}>
          <SheetContent side="right" className="p-0">
            <div className="border-b px-4 py-3.5">
              <SheetTitle>Properties</SheetTitle>
              <SheetDescription className="sr-only">Edit the selected element.</SheetDescription>
            </div>
            <ScrollArea className="min-h-0 flex-1">
              <PdfPropertiesPanel />
            </ScrollArea>
          </SheetContent>
        </Sheet>

        <SignatureDialog />
        <QRDialog />
        <ImageDialog />
      </div>
    </TooltipProvider>
  );
}
