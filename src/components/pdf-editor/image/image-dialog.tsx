"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CircleNotch, Image as ImageIcon, UploadSimple } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SUPPORTED_IMAGE_ACCEPT, isSupportedImageFile, processImageFile, type ProcessedImage } from "@/lib/image/image-utils";
import { cn } from "@/lib/utils";
import { createImageElement } from "../element-factory";
import { getPlacementContext, useEditorStore } from "../store";

export function ImageDialog() {
  const open = useEditorStore((state) => state.activeDialog === "image");
  const setActiveDialog = useEditorStore((state) => state.setActiveDialog);
  const addElement = useEditorStore((state) => state.addElement);

  const [image, setImage] = useState<ProcessedImage | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setImage(null);
      setFileName(null);
      setError(null);
      setProcessing(false);
    }
  }, [open]);

  const selectFile = async (file: File | undefined) => {
    if (!file) return;
    if (!isSupportedImageFile(file)) {
      setError("Unsupported image format. Please use PNG, JPG, JPEG, or WebP.");
      return;
    }
    setProcessing(true);
    setError(null);
    try {
      const processed = await processImageFile(file);
      setImage(processed);
      setFileName(file.name);
    } catch (reason) {
      setImage(null);
      setError(reason instanceof Error ? reason.message : "Failed to read the image.");
    } finally {
      setProcessing(false);
    }
  };

  const close = () => setActiveDialog(null);

  const confirm = () => {
    const context = getPlacementContext();
    if (!context || !image) return;
    addElement(createImageElement(context, image));
    toast.success("Image added.");
    close();
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && close()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Image</DialogTitle>
          <DialogDescription>Supported: PNG, JPG, JPEG, WebP. WebP is converted to PNG for the PDF.</DialogDescription>
        </DialogHeader>

        <input
          ref={fileInputRef}
          type="file"
          accept={SUPPORTED_IMAGE_ACCEPT}
          className="sr-only"
          aria-label="Upload image"
          onChange={(event) => {
            void selectFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />

        {image ? (
          <div className="space-y-3">
            <div className="flex h-56 items-center justify-center rounded-md border bg-muted/40 p-3">
              <img src={image.dataUrl} alt="Image preview" className="max-h-full max-w-full object-contain" />
            </div>
            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span className="truncate">{fileName}</span>
              <span className="shrink-0 tabular-nums">
                {image.width} × {image.height}px · {image.mimeType === "image/jpeg" ? "JPEG" : "PNG"}
              </span>
            </div>
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
              void selectFile(event.dataTransfer.files?.[0]);
            }}
            className={cn(
              "flex h-56 w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed text-sm text-muted-foreground transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              dragOver && "border-primary bg-muted/60"
            )}
          >
            {processing ? <CircleNotch className="h-6 w-6 animate-spin" /> : <ImageIcon className="h-6 w-6" />}
            <span className="font-medium text-foreground">{processing ? "Uploading image..." : "Upload Image"}</span>
            <span className="text-xs">Click to browse or drag an image here</span>
          </button>
        )}

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <DialogFooter className="sm:justify-between">
          {image ? (
            <Button variant="ghost" onClick={() => fileInputRef.current?.click()} disabled={processing}>
              <UploadSimple className="h-4 w-4" />
              Choose another
            </Button>
          ) : (
            <span />
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button onClick={confirm} disabled={!image || processing}>
              {processing && <CircleNotch className="h-4 w-4 animate-spin" />}
              Add Image
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
