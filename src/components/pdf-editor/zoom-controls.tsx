"use client";

import { Minus, Plus } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MAX_ZOOM, MIN_ZOOM, useEditorStore, ZOOM_LEVELS } from "./store";

export function ZoomControls() {
  const zoom = useEditorStore((state) => state.zoom);
  const zoomIn = useEditorStore((state) => state.zoomIn);
  const zoomOut = useEditorStore((state) => state.zoomOut);
  const setZoom = useEditorStore((state) => state.setZoom);

  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Zoom out" disabled={zoom <= MIN_ZOOM} onClick={zoomOut}>
            <Minus className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Zoom out</TooltipContent>
      </Tooltip>
      <Select value={String(zoom)} onValueChange={(value) => setZoom(Number(value))}>
        <SelectTrigger aria-label="Zoom level" className="h-8 w-[84px] justify-center gap-1 px-2 tabular-nums">
          <SelectValue>{Math.round(zoom * 100)}%</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {ZOOM_LEVELS.map((level) => (
            <SelectItem key={level} value={String(level)} className="tabular-nums">
              {Math.round(level * 100)}%
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Zoom in" disabled={zoom >= MAX_ZOOM} onClick={zoomIn}>
            <Plus className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Zoom in</TooltipContent>
      </Tooltip>
    </div>
  );
}
