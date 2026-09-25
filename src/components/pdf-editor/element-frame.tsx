"use client";

import { useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import {
  clampBoxPosition,
  formatCoordinate,
  getElementBox,
  pdfToPreviewPosition,
  previewDeltaToPdfDelta,
  resizeBox,
  type PreviewSize,
  type ResizeHandle,
} from "@/lib/pdf/coordinates";
import type { BoundingBox, PageSize, PDFElement } from "@/lib/pdf/types";
import { cn } from "@/lib/utils";
import { useEditorStore } from "./store";

export type HandleMode = "all" | "corners";

export type ElementFrameProps = {
  element: PDFElement;
  pageSize: PageSize;
  previewSize: PreviewSize;
  selected: boolean;
  invalid: boolean;
  warning?: boolean;
  label: string;
  handleMode?: HandleMode;
  aspectRatio?: number;
  onActivate?: () => void;
  children: ReactNode;
};

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  startBox: BoundingBox;
  mode: "move" | ResizeHandle;
  moved: boolean;
};

const CORNER_HANDLES: ResizeHandle[] = ["nw", "ne", "sw", "se"];
const EDGE_HANDLES: ResizeHandle[] = ["n", "s", "e", "w"];

const HANDLE_POSITION: Record<ResizeHandle, string> = {
  nw: "left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize",
  ne: "right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize",
  sw: "left-0 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize",
  se: "right-0 bottom-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize",
  n: "left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize",
  s: "left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-ns-resize",
  e: "right-0 top-1/2 translate-x-1/2 -translate-y-1/2 cursor-ew-resize",
  w: "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize",
};

const HANDLE_LABEL: Record<ResizeHandle, string> = {
  nw: "top left",
  ne: "top right",
  sw: "bottom left",
  se: "bottom right",
  n: "top",
  s: "bottom",
  e: "right",
  w: "left",
};

export function ElementFrame({
  element,
  pageSize,
  previewSize,
  selected,
  invalid,
  warning,
  label,
  handleMode = "all",
  aspectRatio,
  onActivate,
  children,
}: ElementFrameProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);

  const box = getElementBox(element);
  const rect = pdfToPreviewPosition(box, pageSize, previewSize);

  const applyBox = (next: BoundingBox) => {
    const patch =
      element.type === "qr"
        ? { x: next.x, y: next.y, size: next.width }
        : { x: next.x, y: next.y, width: next.width, height: next.height };
    useEditorStore.getState().updateElement(element.id, patch, { history: "none" });
  };

  const startDrag = (event: ReactPointerEvent<HTMLElement>, mode: DragState["mode"]) => {
    if (event.button !== 0) return;
    event.stopPropagation();
    event.preventDefault();
    const store = useEditorStore.getState();
    store.selectElement(element.id);
    frameRef.current?.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startBox: box,
      mode,
      moved: false,
    };
    store.beginInteraction();
  };

  const moveDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dxPreview = event.clientX - drag.startX;
    const dyPreview = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dxPreview, dyPreview) < 2) return;
    drag.moved = true;

    const { dx, dy } = previewDeltaToPdfDelta(dxPreview, dyPreview, pageSize, previewSize);

    if (drag.mode === "move") {
      applyBox(
        clampBoxPosition(
          { ...drag.startBox, x: drag.startBox.x + dx, y: drag.startBox.y + dy },
          pageSize
        )
      );
      return;
    }

    applyBox(resizeBox(drag.startBox, drag.mode, dx, dy, pageSize, { aspectRatio }));
  };

  const endDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
    useEditorStore.getState().endInteraction();
  };

  const handles = handleMode === "corners" ? CORNER_HANDLES : [...CORNER_HANDLES, ...EDGE_HANDLES];

  return (
    <div
      ref={frameRef}
      role="button"
      tabIndex={0}
      aria-label={`${label} at X ${formatCoordinate(box.x)}, Y ${formatCoordinate(box.y)}, width ${formatCoordinate(
        box.width
      )}, height ${formatCoordinate(box.height)}`}
      aria-pressed={selected}
      data-element-id={element.id}
      className={cn(
        "group absolute touch-none select-none outline-none",
        selected ? "z-20 cursor-move" : "z-10 cursor-pointer"
      )}
      style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}
      onPointerDown={(event) => startDrag(event, "move")}
      onPointerMove={moveDrag}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onFocus={() => {
        if (useEditorStore.getState().selectedElementId !== element.id) {
          useEditorStore.getState().selectElement(element.id);
        }
      }}
      onDoubleClick={(event) => {
        event.stopPropagation();
        onActivate?.();
      }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-visible">{children}</div>
      <div
        className={cn(
          "pointer-events-none absolute -inset-px rounded-[1px] border transition-colors",
          invalid
            ? "border-destructive"
            : selected
              ? "border-primary/70"
              : warning
                ? "border-dashed border-amber-500"
                : "border-transparent group-hover:border-dashed group-hover:border-zinc-400 group-focus-visible:border-primary/70"
        )}
      />
      {selected &&
        handles.map((handle) => (
          <span
            key={handle}
            role="presentation"
            aria-label={`Resize ${HANDLE_LABEL[handle]}`}
            className={cn(
              "absolute z-30 h-2 w-2 touch-none rounded-[2px] border border-primary/80 bg-background shadow-sm",
              HANDLE_POSITION[handle]
            )}
            onPointerDown={(event) => startDrag(event, handle)}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          />
        ))}
    </div>
  );
}
