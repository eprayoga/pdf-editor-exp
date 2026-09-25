"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { exportSignatureCanvas, setupHiDpiCanvas, type SignatureImage } from "@/lib/signature/canvas";
import { cn } from "@/lib/utils";

export type SignatureCanvasHandle = {
  clear: () => void;
  isEmpty: () => boolean;
  exportImage: () => SignatureImage | null;
};

type Point = { x: number; y: number; pressure: number };

type SignatureCanvasProps = {
  color: string;
  strokeWidth: number;
  onChange?: (empty: boolean) => void;
  className?: string;
};

export const SignatureCanvas = forwardRef<SignatureCanvasHandle, SignatureCanvasProps>(function SignatureCanvas(
  { color, strokeWidth, onChange, className },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const strokesRef = useRef<{ color: string; width: number; points: Point[] }[]>([]);
  const activePointerRef = useRef<number | null>(null);
  const [empty, setEmpty] = useState(true);

  const drawSegment = useCallback((points: Point[], strokeColor: string, width: number, fromIndex = 1) => {
    const context = contextRef.current;
    if (!context || points.length === 0) return;
    context.strokeStyle = strokeColor;
    context.fillStyle = strokeColor;

    if (points.length === 1) {
      const point = points[0];
      context.beginPath();
      context.arc(point.x, point.y, (width * (0.6 + point.pressure * 0.8)) / 2, 0, Math.PI * 2);
      context.fill();
      return;
    }

    for (let index = Math.max(1, fromIndex); index < points.length; index += 1) {
      const previous = points[index - 1];
      const current = points[index];
      const before = points[index - 2] ?? previous;
      const startX = (before.x + previous.x) / 2;
      const startY = (before.y + previous.y) / 2;
      const endX = (previous.x + current.x) / 2;
      const endY = (previous.y + current.y) / 2;
      context.lineWidth = width * (0.6 + current.pressure * 0.8);
      context.beginPath();
      context.moveTo(index === 1 ? previous.x : startX, index === 1 ? previous.y : startY);
      context.quadraticCurveTo(previous.x, previous.y, endX, endY);
      context.stroke();
    }
  }, []);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.restore();
    for (const stroke of strokesRef.current) {
      drawSegment(stroke.points, stroke.color, stroke.width);
    }
  }, [drawSegment]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width === 0 || height === 0) return;
      contextRef.current = setupHiDpiCanvas(canvas, width, height);
      redraw();
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    return () => observer.disconnect();
  }, [redraw]);

  const updateEmpty = (value: boolean) => {
    setEmpty(value);
    onChange?.(value);
  };

  const toCanvasPoint = (
    canvas: HTMLCanvasElement,
    source: { clientX: number; clientY: number; pointerType: string; pressure: number }
  ): Point => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width > 0 ? canvas.clientWidth / rect.width : 1;
    const scaleY = rect.height > 0 ? canvas.clientHeight / rect.height : 1;
    const pressure = source.pointerType === "pen" && source.pressure > 0 ? source.pressure : 0.5;
    return {
      x: (source.clientX - rect.left) * scaleX,
      y: (source.clientY - rect.top) * scaleY,
      pressure,
    };
  };

  const getPoint = (event: React.PointerEvent<HTMLCanvasElement>) => toCanvasPoint(event.currentTarget, event);

  useImperativeHandle(
    ref,
    () => ({
      clear: () => {
        strokesRef.current = [];
        redraw();
        updateEmpty(true);
      },
      isEmpty: () => strokesRef.current.length === 0,
      exportImage: () => (canvasRef.current ? exportSignatureCanvas(canvasRef.current) : null),
    }),
    [redraw]
  );

  return (
    <div
      ref={containerRef}
      className={cn("relative h-48 w-full overflow-hidden rounded-md border bg-background", className)}
    >
      <canvas
        ref={canvasRef}
        aria-label="Signature drawing area"
        role="img"
        className="absolute inset-0 h-full w-full cursor-crosshair touch-none"
        onPointerDown={(event) => {
          if (activePointerRef.current !== null) return;
          event.preventDefault();
          event.currentTarget.setPointerCapture(event.pointerId);
          activePointerRef.current = event.pointerId;
          strokesRef.current.push({ color, width: strokeWidth, points: [getPoint(event)] });
          redraw();
          if (empty) updateEmpty(false);
        }}
        onPointerMove={(event) => {
          if (activePointerRef.current !== event.pointerId) return;
          const stroke = strokesRef.current[strokesRef.current.length - 1];
          if (!stroke) return;
          const events = typeof event.nativeEvent.getCoalescedEvents === "function" ? event.nativeEvent.getCoalescedEvents() : [];
          const canvas = event.currentTarget;
          const points =
            events.length > 0 ? events.map((native) => toCanvasPoint(canvas, native)) : [getPoint(event)];
          const fromIndex = stroke.points.length;
          stroke.points.push(...points);
          drawSegment(stroke.points, stroke.color, stroke.width, fromIndex);
        }}
        onPointerUp={(event) => {
          if (activePointerRef.current !== event.pointerId) return;
          activePointerRef.current = null;
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
        }}
        onPointerCancel={() => {
          activePointerRef.current = null;
        }}
      />
      {empty && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
          Draw your signature
        </div>
      )}
      <div className="pointer-events-none absolute inset-x-6 bottom-10 border-b border-dashed border-border" />
    </div>
  );
});
