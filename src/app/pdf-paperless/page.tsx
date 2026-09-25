import type { Metadata } from "next";
import { PdfEditor } from "@/components/pdf-editor/pdf-editor";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "PDF Paperless · PDF Editor",
  description: "Add signatures, text, QR codes, and images to PDF documents.",
};

export default function PdfPaperlessPage() {
  return (
    <>
      <PdfEditor />
      <Toaster position="bottom-right" />
    </>
  );
}
