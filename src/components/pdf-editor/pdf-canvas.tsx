"use client";

import { useCallback, useMemo, useState, type PointerEvent as ReactPointerEvent } from "react";
import { toast } from "sonner";
import { Crosshair } from "@phosphor-icons/react";
import {
  formatCoordinate,
  getPreviewSize,
  previewPointToPdfPoint,
  type PdfPoint,
} from "@/lib/pdf/coordinates";
import { validateElements } from "@/lib/pdf/validation";
import { PageNavigation } from "./page-navigation";
import { PDFElement } from "./pdf-element";
import { PdfPage } from "./pdf-page";
import { Ruler, RULER_SIZE } from "./ruler";
import { BASE_PREVIEW_SCALE, useEditorStore } from "./store";
import { ZoomControls } from "./zoom-controls";

export function PdfCanvas() {
  const renderDocument = useEditorStore((state) => state.renderDocument);
  const currentPage = useEditorStore((state) => state.currentPage);
  const pageSizes = useEditorStore((state) => state.pageSizes);
  const zoom = useEditorStore((state) => state.zoom);
  const elements = useEditorStore((state) => state.elements);
  const selectedElementId = useEditorStore((state) => state.selectedElementId);
  const selectElement = useEditorStore((state) => state.selectElement);
  const [cursor, setCursor] = useState<PdfPoint | null>(null);

  const pageSize = pageSizes[currentPage];
  const previewScale = BASE_PREVIEW_SCALE * zoom;

  const previewSize = useMemo(
    () => (pageSize ? getPreviewSize(pageSize, previewScale) : { width: 0, height: 0 }),
    [pageSize, previewScale]
  );

  const pageElements = useMemo(
    () => elements.filter((element) => element.pageIndex === currentPage),
    [elements, currentPage]
  );

  const invalidMap = useMemo(() => validateElements(pageElements, pageSizes), [pageElements, pageSizes]);

  const handleRenderError = useCallback(() => {
    toast.error("Failed to render the PDF page.");
  }, []);

  const trackCursor = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pageSize) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const point = previewPointToPdfPoint(
      { left: event.clientX - rect.left, top: event.clientY - rect.top },
      pageSize,
      previewSize
    );
    setCursor(point);
  };

  if (!renderDocument || !pageSize) return null;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="flex h-11 shrink-0 items-center justify-between gap-2 border-b bg-background px-2 sm:px-3">
        <PageNavigation />
        <div className="hidden text-xs text-muted-foreground md:block">
          <span className="tabular-nums">
            {formatCoordinate(pageSize.width)} × {formatCoordinate(pageSize.height)} pt
          </span>
        </div>
        <ZoomControls />
      </div>

      <div
        className="relative min-h-0 flex-1 overflow-auto bg-muted/60"
        onPointerDown={(event) => {
          if (event.target === event.currentTarget) selectElement(null);
        }}
      >
        <div
          className="flex min-h-full w-max min-w-full items-start justify-center p-6 sm:p-10"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) selectElement(null);
          }}
        >
          <div
            className="grid gap-1"
            style={{
              gridTemplateColumns: `${RULER_SIZE}px ${previewSize.width}px`,
              gridTemplateRows: `${RULER_SIZE}px ${previewSize.height}px`,
            }}
          >
            <div aria-hidden="true" />
            <Ruler orientation="horizontal" length={pageSize.width} scale={previewScale} />
            <Ruler orientation="vertical" length={pageSize.height} scale={previewScale} />
            <div
              className="relative bg-white shadow-sm ring-1 ring-black/10"
              style={{ width: previewSize.width, height: previewSize.height }}
            >
              <PdfPage
                document={renderDocument}
                pageIndex={currentPage}
                previewSize={previewSize}
                onRenderError={handleRenderError}
              />
              <div
                className="absolute inset-0"
                data-testid="pdf-overlay"
                onPointerDown={(event) => {
                  if (event.target === event.currentTarget) selectElement(null);
                }}
                onPointerMove={trackCursor}
                onPointerLeave={() => setCursor(null)}
              >
                {pageElements.map((element) => (
                  <PDFElement
                    key={element.id}
                    element={element}
                    pageSize={pageSize}
                    previewSize={previewSize}
                    selected={element.id === selectedElementId}
                    invalid={Boolean(invalidMap[element.id])}
                  />
                ))}
              </div>
              <span className="pointer-events-none absolute -bottom-5 -left-2 select-none text-[10px] font-medium text-muted-foreground">
                (0,0)
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-8 shrink-0 items-center justify-between gap-3 border-t bg-background px-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5 tabular-nums">
          <Crosshair className="h-3.5 w-3.5" />
          {cursor ? (
            <span>
              X {formatCoordinate(cursor.x)} · Y {formatCoordinate(cursor.y)} pt
            </span>
          ) : (
            <span>Move the pointer over the page</span>
          )}
        </div>
        <div className="hidden truncate sm:block">Origin (0,0) at bottom-left · X → right · Y ↑ up</div>
      </div>
    </div>
  );
}
