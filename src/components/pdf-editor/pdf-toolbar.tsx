"use client";

import { useState } from "react";
import {
  ArrowClockwise,
  ArrowCounterClockwise,
  CircleNotch,
  DownloadSimple,
  FilePdf,
  SidebarSimple,
  SlidersHorizontal,
  UploadSimple,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useEditorStore } from "./store";

type PdfToolbarProps = {
  invalidCount: number;
  onGenerate: () => void;
  onReplace: () => void;
};

function IconAction({
  label,
  shortcut,
  disabled,
  onClick,
  children,
}: {
  label: string;
  shortcut?: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={disabled ? 0 : -1} className="inline-flex rounded-md focus-visible:outline-none">
          <Button variant="ghost" size="icon" aria-label={label} disabled={disabled} onClick={onClick}>
            {children}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {label}
        {shortcut && <span className="ml-2 opacity-60">{shortcut}</span>}
      </TooltipContent>
    </Tooltip>
  );
}

export function PdfToolbar({ invalidCount, onGenerate, onReplace }: PdfToolbarProps) {
  const pdfFile = useEditorStore((state) => state.pdfFile);
  const pageCount = useEditorStore((state) => state.pageCount);
  const elementCount = useEditorStore((state) => state.elements.length);
  const canUndo = useEditorStore((state) => state.past.length > 0);
  const canRedo = useEditorStore((state) => state.future.length > 0);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const isGenerating = useEditorStore((state) => state.isGenerating);
  const setComponentsSheetOpen = useEditorStore((state) => state.setComponentsSheetOpen);
  const setPropertiesSheetOpen = useEditorStore((state) => state.setPropertiesSheetOpen);
  const [confirmReplace, setConfirmReplace] = useState(false);

  const generateDisabled = isGenerating || invalidCount > 0;
  const generateHint =
    invalidCount > 0
      ? `Fix ${invalidCount} invalid element${invalidCount === 1 ? "" : "s"} before generating.`
      : "Generate and download the final PDF";

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-3 sm:px-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <FilePdf className="h-4 w-4" weight="bold" />
        </div>
        <div className="min-w-0">
          <h1 className="text-sm font-semibold leading-tight">PDF Editor</h1>
          {pdfFile && (
            <p className="truncate text-xs text-muted-foreground" title={pdfFile.name}>
              {pdfFile.name}
              <span className="hidden sm:inline">
                {" "}
                · {pageCount} page{pageCount === 1 ? "" : "s"}
              </span>
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-0.5 lg:hidden">
        <IconAction label="Components" onClick={() => setComponentsSheetOpen(true)}>
          <SidebarSimple className="h-4 w-4" />
        </IconAction>
        <IconAction label="Properties" onClick={() => setPropertiesSheetOpen(true)}>
          <SlidersHorizontal className="h-4 w-4" />
        </IconAction>
        <Separator orientation="vertical" className="mx-1 h-6" />
      </div>

      <div className="flex items-center gap-0.5">
        <IconAction label="Undo" shortcut="Ctrl+Z" disabled={!canUndo} onClick={undo}>
          <ArrowCounterClockwise className="h-4 w-4" />
        </IconAction>
        <IconAction label="Redo" shortcut="Ctrl+Shift+Z" disabled={!canRedo} onClick={redo}>
          <ArrowClockwise className="h-4 w-4" />
        </IconAction>
        <IconAction
          label="Open another PDF"
          onClick={() => {
            if (elementCount > 0) setConfirmReplace(true);
            else onReplace();
          }}
        >
          <UploadSimple className="h-4 w-4" />
        </IconAction>
      </div>

      <Separator orientation="vertical" className="mx-1 hidden h-6 sm:block" />

      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={generateDisabled ? 0 : -1} className="inline-flex rounded-md focus-visible:outline-none">
            <Button onClick={onGenerate} disabled={generateDisabled} aria-label="Generate PDF">
              {isGenerating ? <CircleNotch className="h-4 w-4 animate-spin" /> : <DownloadSimple className="h-4 w-4" />}
              <span className="hidden sm:inline">{isGenerating ? "Generating PDF..." : "Generate PDF"}</span>
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>{generateHint}</TooltipContent>
      </Tooltip>

      <Dialog open={confirmReplace} onOpenChange={setConfirmReplace}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Open another PDF?</DialogTitle>
            <DialogDescription>
              All {elementCount} element{elementCount === 1 ? "" : "s"} on the current document will be removed. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmReplace(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setConfirmReplace(false);
                onReplace();
              }}
            >
              Choose PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
