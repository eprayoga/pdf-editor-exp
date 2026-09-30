"use client";

import { useEffect, useRef, useState } from "react";
import {
  CircleNotch,
  DownloadSimple,
  PencilSimple,
} from "@phosphor-icons/react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { loadPdfJsDocument } from "@/lib/pdf/load-pdf";
import type { PageSize } from "@/lib/pdf/types";
import { PdfPage } from "./pdf-page";

const MAX_PAGE_WIDTH = 820;

export type GeneratedPreview = {
  bytes: Uint8Array;
  fileName: string;
};

type PreviewDialogProps = {
  preview: GeneratedPreview | null;
  pageSizes: Record<number, PageSize>;
  onClose: () => void;
  onDownload: (preview: GeneratedPreview) => void;
};

/** Mounts the page renderer only once it scrolls near the viewport, so large documents stay responsive. */
function LazyPreviewPage({
  document,
  pageIndex,
  size,
  width,
  root,
}: {
  document: PDFDocumentProxy;
  pageIndex: number;
  size: PageSize;
  width: number;
  root: HTMLElement | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(pageIndex < 2);
  const height = (width * size.height) / size.width;

  useEffect(() => {
    if (visible || !ref.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { root, rootMargin: "400px 0px" },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [visible, root]);

  return (
    <figure className="space-y-1.5">
      <div
        ref={ref}
        className="relative mx-auto bg-white shadow-md ring-1 ring-black/5"
        style={{ width, height }}
      >
        {visible && (
          <PdfPage
            document={document}
            pageIndex={pageIndex}
            previewSize={{ width, height }}
          />
        )}
      </div>
      <figcaption className="text-center text-[11px] text-muted-foreground tabular-nums">
        Page {pageIndex + 1}
      </figcaption>
    </figure>
  );
}

export function PreviewDialog({
  preview,
  pageSizes,
  onClose,
  onDownload,
}: PreviewDialogProps) {
  const [scrollEl, setScrollEl] = useState<HTMLDivElement | null>(null);
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!preview) return;
    let cancelled = false;
    let loaded: PDFDocumentProxy | null = null;
    setPdfDocument(null);
    setError(null);
    loadPdfJsDocument(preview.bytes)
      .then((doc) => {
        loaded = doc;
        if (cancelled) doc.loadingTask.destroy().catch(() => undefined);
        else setPdfDocument(doc);
      })
      .catch(() => {
        if (!cancelled)
          setError("The generated PDF could not be rendered for preview.");
      });
    return () => {
      cancelled = true;
      loaded?.loadingTask.destroy().catch(() => undefined);
    };
  }, [preview]);

  useEffect(() => {
    if (!scrollEl) return;
    const measure = () =>
      setWidth(Math.min(scrollEl.clientWidth - 32, MAX_PAGE_WIDTH));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(scrollEl);
    return () => observer.disconnect();
  }, [scrollEl]);

  const pageCount = pdfDocument?.numPages ?? 0;

  return (
    <Dialog open={!!preview} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex h-[calc(100dvh-2rem)] max-w-5xl flex-col gap-0 overflow-hidden p-0 sm:h-[calc(100dvh-4rem)]">
        <DialogHeader className="border-b px-5 py-4 pr-12 text-left">
          <DialogTitle>Preview</DialogTitle>
          <DialogDescription className="truncate">
            {preview?.fileName}
            {pageCount > 0 &&
              ` · ${pageCount} page${pageCount === 1 ? "" : "s"}`}
          </DialogDescription>
        </DialogHeader>

        <div
          ref={setScrollEl}
          className="min-h-0 flex-1 overflow-y-auto bg-muted/60 py-4"
        >
          {error ? (
            <p
              role="alert"
              className="flex h-full items-center justify-center px-4 text-center text-sm text-destructive"
            >
              {error}
            </p>
          ) : !pdfDocument || width <= 0 ? (
            <p className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
              <CircleNotch className="h-4 w-4 animate-spin" />
              Loading preview...
            </p>
          ) : (
            <div className="space-y-4 px-4">
              {Array.from({ length: pageCount }, (_, index) => (
                <LazyPreviewPage
                  key={index}
                  document={pdfDocument}
                  pageIndex={index}
                  size={pageSizes[index] ?? { width: 595, height: 842 }}
                  width={width}
                  root={scrollEl}
                />
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 border-t px-5 py-3">
          <Button variant="outline" onClick={onClose}>
            <PencilSimple className="h-4 w-4" />
            Back to editor
          </Button>
          <Button
            onClick={() => preview && onDownload(preview)}
            disabled={!preview}
          >
            <DownloadSimple className="h-4 w-4" />
            Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
