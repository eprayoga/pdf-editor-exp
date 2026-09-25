"use client";

import { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowCounterClockwise, CircleNotch, PencilSimple, UploadSimple } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SUPPORTED_IMAGE_ACCEPT, isSupportedImageFile } from "@/lib/image/image-utils";
import { processSignatureFile, type SignatureImage } from "@/lib/signature/canvas";
import { cn } from "@/lib/utils";
import { createSignatureElement } from "../element-factory";
import { getPlacementContext, useEditorStore } from "../store";
import { SignatureCanvas, type SignatureCanvasHandle } from "./signature-canvas";

const INK_COLORS = [
  { value: "#111827", label: "Black" },
  { value: "#1d4ed8", label: "Blue" },
];

const CHECKERBOARD =
  "bg-[linear-gradient(45deg,#f4f4f5_25%,transparent_25%,transparent_75%,#f4f4f5_75%),linear-gradient(45deg,#f4f4f5_25%,transparent_25%,transparent_75%,#f4f4f5_75%)] bg-[length:12px_12px] bg-[position:0_0,6px_6px]";

export function SignatureDialog() {
  const open = useEditorStore((state) => state.activeDialog === "signature");
  const setActiveDialog = useEditorStore((state) => state.setActiveDialog);
  const addElement = useEditorStore((state) => state.addElement);

  const [tab, setTab] = useState<"upload" | "draw">("draw");
  const [inkColor, setInkColor] = useState(INK_COLORS[0].value);
  const [drawEmpty, setDrawEmpty] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [removeBackground, setRemoveBackground] = useState(true);
  const [uploaded, setUploaded] = useState<SignatureImage | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const canvasRef = useRef<SignatureCanvasHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const removeBackgroundId = useId();

  useEffect(() => {
    if (!open) {
      setFile(null);
      setUploaded(null);
      setError(null);
      setDrawEmpty(true);
      setProcessing(false);
    }
  }, [open]);

  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    setProcessing(true);
    setError(null);
    processSignatureFile(file, { removeBackground })
      .then((result) => {
        if (!cancelled) setUploaded(result);
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setUploaded(null);
        setError(reason instanceof Error ? reason.message : "Failed to process the signature image.");
      })
      .finally(() => {
        if (!cancelled) setProcessing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [file, removeBackground]);

  const selectFile = (candidate: File | undefined) => {
    if (!candidate) return;
    if (!isSupportedImageFile(candidate)) {
      setError("Unsupported image format. Please use PNG, JPG, JPEG, or WebP.");
      return;
    }
    setFile(candidate);
  };

  const close = () => setActiveDialog(null);

  const confirm = () => {
    const context = getPlacementContext();
    if (!context) return;

    let image: SignatureImage | null = null;
    if (tab === "draw") {
      image = canvasRef.current?.exportImage() ?? null;
      if (!image) {
        toast.error("Please draw your signature first.");
        return;
      }
    } else {
      image = uploaded;
      if (!image) {
        toast.error("Please upload a signature image first.");
        return;
      }
    }

    try {
      addElement(createSignatureElement(context, image));
      toast.success("Signature added.");
      close();
    } catch {
      toast.error("Failed to process the signature.");
    }
  };

  const canConfirm = tab === "draw" ? !drawEmpty : Boolean(uploaded) && !processing;

  return (
    <Dialog open={open} onOpenChange={(value) => !value && close()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add Signature</DialogTitle>
          <DialogDescription>Draw your signature or upload an image. The background stays transparent.</DialogDescription>
        </DialogHeader>

        <Tabs
          value={tab}
          onValueChange={(value) => {
            setTab(value as "upload" | "draw");
            if (value === "draw") setDrawEmpty(true);
          }}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">
              <UploadSimple className="h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="draw">
              <PencilSimple className="h-4 w-4" />
              Draw
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept={SUPPORTED_IMAGE_ACCEPT}
              className="sr-only"
              aria-label="Upload signature image"
              onChange={(event) => {
                selectFile(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
            {uploaded ? (
              <div className={cn("flex h-48 items-center justify-center rounded-md border p-4", CHECKERBOARD)}>
                <img src={uploaded.dataUrl} alt="Signature preview" className="max-h-full max-w-full object-contain" />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragOver(false);
                  selectFile(event.dataTransfer.files?.[0]);
                }}
                className={cn(
                  "flex h-48 w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed text-sm text-muted-foreground transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  dragOver && "border-primary bg-muted/60"
                )}
              >
                {processing ? <CircleNotch className="h-6 w-6 animate-spin" /> : <UploadSimple className="h-6 w-6" />}
                <span className="font-medium text-foreground">
                  {processing ? "Processing signature..." : "Click to upload or drag an image here"}
                </span>
                <span className="text-xs">PNG, JPG, JPEG, or WebP</span>
              </button>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id={removeBackgroundId}
                  checked={removeBackground}
                  onCheckedChange={(checked) => setRemoveBackground(checked === true)}
                />
                <Label htmlFor={removeBackgroundId} className="cursor-pointer text-sm font-normal text-foreground">
                  Remove light background
                </Label>
              </div>
              {uploaded && (
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={processing}>
                  {processing ? <CircleNotch className="h-4 w-4 animate-spin" /> : <UploadSimple className="h-4 w-4" />}
                  Choose another
                </Button>
              )}
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </TabsContent>

          <TabsContent value="draw" className="space-y-3">
            <SignatureCanvas ref={canvasRef} color={inkColor} strokeWidth={2.4} onChange={setDrawEmpty} />
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2" role="radiogroup" aria-label="Ink color">
                {INK_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    role="radio"
                    aria-checked={inkColor === color.value}
                    aria-label={color.label}
                    onClick={() => setInkColor(color.value)}
                    className={cn(
                      "h-6 w-6 rounded-full border-2 transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      inkColor === color.value ? "border-background ring-2 ring-primary" : "border-background ring-1 ring-border"
                    )}
                    style={{ backgroundColor: color.value }}
                  />
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={() => canvasRef.current?.clear()} disabled={drawEmpty}>
                <ArrowCounterClockwise className="h-4 w-4" />
                Clear
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button onClick={confirm} disabled={!canConfirm}>
            {processing && <CircleNotch className="h-4 w-4 animate-spin" />}
            Use Signature
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
