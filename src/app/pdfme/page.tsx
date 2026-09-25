"use client";

import dynamic from "next/dynamic";

const DesignerApp = dynamic(() => import("./designer-app"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">Loading designer...</div>
  ),
});

export default function PdfmePage() {
  return <DesignerApp />;
}
