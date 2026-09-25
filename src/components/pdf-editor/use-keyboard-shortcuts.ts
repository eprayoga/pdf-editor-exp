"use client";

import { useEffect } from "react";
import { clampNumber, getElementBox } from "@/lib/pdf/coordinates";
import { useEditorStore } from "./store";

const EDITABLE_SELECTOR = "input, textarea, select, [contenteditable='true'], [role='listbox'], [role='menu']";

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest(EDITABLE_SELECTOR));
}

export function useKeyboardShortcuts(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const state = useEditorStore.getState();
      if (state.activeDialog || isEditableTarget(event.target)) return;
      if (event.target instanceof Element && event.target.closest("[role='dialog']")) return;

      const modifier = event.ctrlKey || event.metaKey;
      const key = event.key;

      if (modifier && key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) state.redo();
        else state.undo();
        return;
      }

      if (modifier && key.toLowerCase() === "y") {
        event.preventDefault();
        state.redo();
        return;
      }

      const selected = state.elements.find((element) => element.id === state.selectedElementId);
      if (!selected) return;

      if (key === "Escape") {
        state.selectElement(null);
        return;
      }

      if (key === "Delete" || key === "Backspace") {
        event.preventDefault();
        state.deleteElement(selected.id);
        return;
      }

      const step = event.shiftKey ? 10 : 1;
      let dx = 0;
      let dy = 0;
      if (key === "ArrowUp") dy = step;
      else if (key === "ArrowDown") dy = -step;
      else if (key === "ArrowRight") dx = step;
      else if (key === "ArrowLeft") dx = -step;
      else return;

      event.preventDefault();
      const page = state.pageSizes[selected.pageIndex];
      if (!page) return;
      const box = getElementBox(selected);
      const x = clampNumber(box.x + dx, 0, page.width - box.width);
      const y = clampNumber(box.y + dy, 0, page.height - box.height);
      if (x === selected.x && y === selected.y) return;
      state.updateElement(selected.id, { x, y }, { coalesceKey: `${selected.id}:nudge` });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled]);
}
