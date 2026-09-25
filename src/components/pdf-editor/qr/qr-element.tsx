"use client";

import { useEffect, useState } from "react";
import { QrCode, WarningCircle } from "@phosphor-icons/react";
import { generateQrDataUrl } from "@/lib/qr/generate-qr";
import type { QRElement as QRElementData } from "@/lib/pdf/types";
import { ElementFrame, type ElementFrameProps } from "../element-frame";

type Props = Omit<ElementFrameProps, "element" | "children" | "label" | "aspectRatio" | "handleMode"> & {
  element: QRElementData;
};

type QrState = { status: "loading" } | { status: "ready"; dataUrl: string } | { status: "error" };

export function useQrDataUrl(content: string): QrState {
  const [state, setState] = useState<QrState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    if (content.length === 0) {
      setState({ status: "error" });
      return;
    }
    setState((previous) => (previous.status === "ready" ? previous : { status: "loading" }));
    generateQrDataUrl(content)
      .then((dataUrl) => {
        if (!cancelled) setState({ status: "ready", dataUrl });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [content]);

  return state;
}

export function QRElement({ element, ...frameProps }: Props) {
  const qr = useQrDataUrl(element.content);

  return (
    <ElementFrame element={element} label="QR code" handleMode="corners" aspectRatio={1} {...frameProps}>
      {qr.status === "ready" ? (
        <img src={qr.dataUrl} alt="" draggable={false} className="block h-full w-full select-none object-fill" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-muted/70 text-muted-foreground">
          {qr.status === "error" ? <WarningCircle className="h-1/3 w-1/3" /> : <QrCode className="h-1/3 w-1/3 animate-pulse" />}
        </div>
      )}
    </ElementFrame>
  );
}
