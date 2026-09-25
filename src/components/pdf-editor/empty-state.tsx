"use client";

import { useRef, useState } from "react";
import { CircleNotch, FilePdf, UploadSimple } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  loading: boolean;
  onFile: (file: File) => void;
};

export function EmptyState({ loading, onFile }: EmptyStateProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  return (
    <div className="flex min-h-dvh flex-col bg-muted/40">
      <header className="flex h-14 items-center gap-3 border-b bg-background px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <FilePdf className="h-4 w-4" weight="bold" />
        </div>
        <span className="text-sm font-semibold">PDF Editor</span>
      </header>

      <main className="flex flex-1 items-center justify-center p-4 sm:p-8">
        <div
          onDragOver={(event) => {
            event.preventDefault();
            if (!loading) setDragOver(true);
          }}
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragOver(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            const file = event.dataTransfer.files?.[0];
            if (file && !loading) onFile(file);
          }}
          className={cn(
            "w-full max-w-lg rounded-xl border bg-background p-8 text-center shadow-sm transition-colors sm:p-10",
            dragOver && "border-primary/60 bg-muted/30"
          )}
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border bg-muted/50">
            {loading ? (
              <CircleNotch className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <FilePdf className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <h1 className="mt-5 text-xl font-semibold tracking-tight">PDF Editor</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Edit your PDF by adding signatures, text, QR codes, and images.
          </p>

          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            aria-label="Upload PDF file"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onFile(file);
              event.target.value = "";
            }}
          />

          <Button size="lg" className="mt-6" disabled={loading} onClick={() => inputRef.current?.click()}>
            {loading ? <CircleNotch className="h-4 w-4 animate-spin" /> : <UploadSimple className="h-4 w-4" />}
            {loading ? "Loading PDF..." : "Upload PDF"}
          </Button>

          <p className="mt-4 text-xs text-muted-foreground">
            {dragOver ? "Drop the file to open it" : "or drag and drop a file here"}
          </p>
          <p className="mt-6 border-t pt-4 text-xs text-muted-foreground">Supported format: PDF</p>
        </div>
      </main>
    </div>
  );
}
