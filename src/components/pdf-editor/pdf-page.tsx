"use client";

import { useEffect, useRef, useState } from "react";
import { CircleNotch } from "@phosphor-icons/react";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import type { PreviewSize } from "@/lib/pdf/coordinates";

const MAX_CANVAS_PIXELS = 16_000_000;

type PdfPageProps = {
  document: PDFDocumentProxy;
  pageIndex: number;
  previewSize: PreviewSize;
  onRenderError?: (error: Error) => void;
};

export function PdfPage({ document: pdfDocument, pageIndex, previewSize, onRenderError }: PdfPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendering, setRendering] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let task: RenderTask | null = null;
    setRendering(true);
    setFailed(false);

    const run = async () => {
      try {
        const page = await pdfDocument.getPage(pageIndex + 1);
        if (cancelled) return;

        const baseViewport = page.getViewport({ scale: 1, rotation: 0 });
        const pixelRatio = Math.max(1, window.devicePixelRatio || 1);
        let renderScale = (previewSize.width / baseViewport.width) * pixelRatio;
        const pixels = baseViewport.width * baseViewport.height * renderScale * renderScale;
        if (pixels > MAX_CANVAS_PIXELS) {
          renderScale *= Math.sqrt(MAX_CANVAS_PIXELS / pixels);
        }

        const viewport = page.getViewport({ scale: renderScale, rotation: 0 });
        const offscreen = window.document.createElement("canvas");
        offscreen.width = Math.max(1, Math.floor(viewport.width));
        offscreen.height = Math.max(1, Math.floor(viewport.height));
        const offscreenContext = offscreen.getContext("2d");
        if (!offscreenContext) throw new Error("Canvas is not supported in this browser.");

        offscreenContext.fillStyle = "#ffffff";
        offscreenContext.fillRect(0, 0, offscreen.width, offscreen.height);

        task = page.render({ canvas: offscreen, canvasContext: offscreenContext, viewport });
        await task.promise;
        if (cancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = offscreen.width;
        canvas.height = offscreen.height;
        const context = canvas.getContext("2d");
        context?.drawImage(offscreen, 0, 0);
        setRendering(false);
      } catch (error) {
        if (cancelled) return;
        if (error instanceof Error && error.name === "RenderingCancelledException") return;
        setRendering(false);
        setFailed(true);
        onRenderError?.(error instanceof Error ? error : new Error("Failed to render the page."));
      }
    };

    const timer = window.setTimeout(run, 60);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      task?.cancel();
    };
  }, [pdfDocument, pageIndex, previewSize.width, previewSize.height]);

  return (
    <>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full bg-white" aria-hidden="true" />
      {rendering && (
        <div className="pointer-events-none absolute right-2 top-2 z-30 flex items-center gap-1.5 rounded-md border bg-background/90 px-2 py-1 text-xs text-muted-foreground shadow-sm">
          <CircleNotch className="h-3.5 w-3.5 animate-spin" />
          Rendering PDF...
        </div>
      )}
      {failed && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-destructive">
          This page could not be rendered.
        </div>
      )}
    </>
  );
}
