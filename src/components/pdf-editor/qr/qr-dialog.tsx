"use client";

import { useEffect, useId, useState } from "react";
import { toast } from "sonner";
import { CircleNotch, QrCode } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { generateQrDataUrl } from "@/lib/qr/generate-qr";
import { createQrElement } from "../element-factory";
import { getPlacementContext, useEditorStore } from "../store";

export function QRDialog() {
  const open = useEditorStore((state) => state.activeDialog === "qr");
  const setActiveDialog = useEditorStore((state) => state.setActiveDialog);
  const addElement = useEditorStore((state) => state.addElement);

  const [content, setContent] = useState("https://example.com");
  const [size, setSize] = useState("100");
  const [preview, setPreview] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contentId = useId();
  const sizeId = useId();

  useEffect(() => {
    if (!open) return;
    if (content.trim().length === 0) {
      setPreview(null);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      generateQrDataUrl(content)
        .then((dataUrl) => {
          if (!cancelled) {
            setPreview(dataUrl);
            setError(null);
          }
        })
        .catch((reason: unknown) => {
          if (!cancelled) {
            setPreview(null);
            setError(reason instanceof Error ? reason.message : "QR generation failed.");
          }
        });
    }, 150);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [content, open]);

  const parsedSize = Number.parseFloat(size);
  const sizeValid = Number.isFinite(parsedSize) && parsedSize > 0;
  const contentValid = content.trim().length > 0;

  const close = () => setActiveDialog(null);

  const confirm = async () => {
    const context = getPlacementContext();
    if (!context || !contentValid || !sizeValid) return;
    setGenerating(true);
    try {
      await generateQrDataUrl(content);
      addElement(createQrElement(context, { content, size: parsedSize }));
      toast.success("QR code added.");
      close();
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "QR generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && close()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add QR Code</DialogTitle>
          <DialogDescription>Enter the text or URL to encode. The QR code is always square.</DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void confirm();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor={contentId}>Content</Label>
            <Textarea
              id={contentId}
              value={content}
              rows={3}
              placeholder="https://example.com"
              aria-invalid={!contentValid}
              onChange={(event) => setContent(event.target.value)}
            />
          </div>
          <div className="flex items-end gap-4">
            <div className="w-32 space-y-1.5">
              <Label htmlFor={sizeId}>Size</Label>
              <div className="relative">
                <Input
                  id={sizeId}
                  type="number"
                  inputMode="decimal"
                  min={1}
                  step={1}
                  value={size}
                  aria-invalid={!sizeValid}
                  className="pr-8 tabular-nums"
                  onChange={(event) => setSize(event.target.value)}
                />
                <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-[11px] text-muted-foreground">
                  pt
                </span>
              </div>
            </div>
            <div className="ml-auto flex h-24 w-24 items-center justify-center rounded-md border bg-white p-1">
              {preview ? (
                <img src={preview} alt="QR code preview" className="h-full w-full" />
              ) : (
                <QrCode className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" disabled={!contentValid || !sizeValid || generating}>
              {generating && <CircleNotch className="h-4 w-4 animate-spin" />}
              {generating ? "Generating QR..." : "Add QR"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
