"use client";

import { create } from "zustand";
import type { PDFDocumentProxy } from "pdfjs-dist";
import type { ElementPatch, PageSize, PDFElement } from "@/lib/pdf/types";

const HISTORY_LIMIT = 100;
const COALESCE_WINDOW_MS = 1000;

export const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3];
export const MIN_ZOOM = ZOOM_LEVELS[0];
export const MAX_ZOOM = ZOOM_LEVELS[ZOOM_LEVELS.length - 1];
export const BASE_PREVIEW_SCALE = 1.25;

export type PdfStatus = "idle" | "loading" | "ready";

export type ActiveDialog = "signature" | "qr" | "image" | null;

type PdfSlice = {
  pdfFile: File | null;
  pdfBytes: Uint8Array | null;
  renderDocument: PDFDocumentProxy | null;
  pageCount: number;
  pageSizes: Record<number, PageSize>;
  status: PdfStatus;
};

type EditorSlice = {
  elements: PDFElement[];
  selectedElementId: string | null;
  past: PDFElement[][];
  future: PDFElement[][];
  interactionSnapshot: PDFElement[] | null;
  lastCoalesce: { key: string; time: number } | null;
};

type UiSlice = {
  currentPage: number;
  zoom: number;
  activeDialog: ActiveDialog;
  componentsSheetOpen: boolean;
  propertiesSheetOpen: boolean;
  isGenerating: boolean;
  fontsReady: boolean;
};

export type UpdateOptions = {
  history?: "push" | "none";
  coalesceKey?: string;
};

type Actions = {
  setStatus: (status: PdfStatus) => void;
  setDocument: (input: {
    file: File;
    bytes: Uint8Array;
    renderDocument: PDFDocumentProxy;
    pageCount: number;
    pageSizes: Record<number, PageSize>;
  }) => void;
  closeDocument: () => void;
  addElement: (element: PDFElement) => void;
  updateElement: (id: string, patch: ElementPatch, options?: UpdateOptions) => void;
  deleteElement: (id: string) => void;
  selectElement: (id: string | null) => void;
  beginInteraction: () => void;
  endInteraction: () => void;
  undo: () => void;
  redo: () => void;
  setCurrentPage: (page: number) => void;
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  setActiveDialog: (dialog: ActiveDialog) => void;
  setComponentsSheetOpen: (open: boolean) => void;
  setPropertiesSheetOpen: (open: boolean) => void;
  setGenerating: (value: boolean) => void;
  setFontsReady: (value: boolean) => void;
};

export type EditorStore = PdfSlice & EditorSlice & UiSlice & Actions;

const initialPdf: PdfSlice = {
  pdfFile: null,
  pdfBytes: null,
  renderDocument: null,
  pageCount: 0,
  pageSizes: {},
  status: "idle",
};

const initialEditor: EditorSlice = {
  elements: [],
  selectedElementId: null,
  past: [],
  future: [],
  interactionSnapshot: null,
  lastCoalesce: null,
};

function pushHistory(past: PDFElement[][], snapshot: PDFElement[]) {
  const next = [...past, snapshot];
  return next.length > HISTORY_LIMIT ? next.slice(next.length - HISTORY_LIMIT) : next;
}

function clampZoom(zoom: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  ...initialPdf,
  ...initialEditor,
  currentPage: 0,
  zoom: 1,
  activeDialog: null,
  componentsSheetOpen: false,
  propertiesSheetOpen: false,
  isGenerating: false,
  fontsReady: false,

  setStatus: (status) => set({ status }),

  setDocument: ({ file, bytes, renderDocument, pageCount, pageSizes }) => {
    const previous = get().renderDocument;
    if (previous && previous !== renderDocument) {
      previous.destroy().catch(() => undefined);
    }
    set({
      ...initialEditor,
      pdfFile: file,
      pdfBytes: bytes,
      renderDocument,
      pageCount,
      pageSizes,
      status: "ready",
      currentPage: 0,
      zoom: 1,
    });
  },

  closeDocument: () => {
    const previous = get().renderDocument;
    if (previous) previous.destroy().catch(() => undefined);
    set({ ...initialPdf, ...initialEditor, currentPage: 0, zoom: 1 });
  },

  addElement: (element) =>
    set((state) => ({
      elements: [...state.elements, element],
      past: pushHistory(state.past, state.elements),
      future: [],
      selectedElementId: element.id,
      lastCoalesce: null,
    })),

  updateElement: (id, patch, options = {}) =>
    set((state) => {
      const index = state.elements.findIndex((element) => element.id === id);
      if (index === -1) return state;

      const current = state.elements[index];
      const updated = { ...current, ...patch } as PDFElement;
      const elements = [...state.elements];
      elements[index] = updated;

      if (options.history === "none") {
        return { elements };
      }

      const now = Date.now();
      const key = options.coalesceKey;
      const shouldCoalesce =
        key !== undefined &&
        state.lastCoalesce !== null &&
        state.lastCoalesce.key === key &&
        now - state.lastCoalesce.time < COALESCE_WINDOW_MS;

      return {
        elements,
        past: shouldCoalesce ? state.past : pushHistory(state.past, state.elements),
        future: [],
        lastCoalesce: key ? { key, time: now } : null,
      };
    }),

  deleteElement: (id) =>
    set((state) => {
      if (!state.elements.some((element) => element.id === id)) return state;
      return {
        elements: state.elements.filter((element) => element.id !== id),
        past: pushHistory(state.past, state.elements),
        future: [],
        selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
        lastCoalesce: null,
      };
    }),

  selectElement: (id) => set({ selectedElementId: id }),

  beginInteraction: () => set((state) => ({ interactionSnapshot: state.elements })),

  endInteraction: () =>
    set((state) => {
      const snapshot = state.interactionSnapshot;
      if (!snapshot) return state;
      if (snapshot === state.elements) return { interactionSnapshot: null };
      return {
        interactionSnapshot: null,
        past: pushHistory(state.past, snapshot),
        future: [],
        lastCoalesce: null,
      };
    }),

  undo: () =>
    set((state) => {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      const selectedStillExists = previous.some((element) => element.id === state.selectedElementId);
      return {
        elements: previous,
        past: state.past.slice(0, -1),
        future: [state.elements, ...state.future],
        selectedElementId: selectedStillExists ? state.selectedElementId : null,
        lastCoalesce: null,
      };
    }),

  redo: () =>
    set((state) => {
      if (state.future.length === 0) return state;
      const [next, ...rest] = state.future;
      const selectedStillExists = next.some((element) => element.id === state.selectedElementId);
      return {
        elements: next,
        past: pushHistory(state.past, state.elements),
        future: rest,
        selectedElementId: selectedStillExists ? state.selectedElementId : null,
        lastCoalesce: null,
      };
    }),

  setCurrentPage: (page) =>
    set((state) => {
      const clamped = Math.min(Math.max(page, 0), Math.max(state.pageCount - 1, 0));
      const selected = state.elements.find((element) => element.id === state.selectedElementId);
      return {
        currentPage: clamped,
        selectedElementId: selected && selected.pageIndex === clamped ? state.selectedElementId : null,
      };
    }),

  setZoom: (zoom) => set({ zoom: clampZoom(zoom) }),

  zoomIn: () =>
    set((state) => {
      const next = ZOOM_LEVELS.find((level) => level > state.zoom + 0.001);
      return { zoom: next ?? MAX_ZOOM };
    }),

  zoomOut: () =>
    set((state) => {
      const next = [...ZOOM_LEVELS].reverse().find((level) => level < state.zoom - 0.001);
      return { zoom: next ?? MIN_ZOOM };
    }),

  setActiveDialog: (activeDialog) => set({ activeDialog }),
  setComponentsSheetOpen: (componentsSheetOpen) => set({ componentsSheetOpen }),
  setPropertiesSheetOpen: (propertiesSheetOpen) => set({ propertiesSheetOpen }),
  setGenerating: (isGenerating) => set({ isGenerating }),
  setFontsReady: (fontsReady) => set({ fontsReady }),
}));

export function getPlacementContext() {
  const state = useEditorStore.getState();
  const page = state.pageSizes[state.currentPage];
  if (!page) return null;
  return {
    pageIndex: state.currentPage,
    page,
    existingCount: state.elements.filter((element) => element.pageIndex === state.currentPage).length,
  };
}

export function useSelectedElement() {
  return useEditorStore((state) => state.elements.find((element) => element.id === state.selectedElementId) ?? null);
}

export function useCurrentPageSize() {
  return useEditorStore((state) => state.pageSizes[state.currentPage]);
}
