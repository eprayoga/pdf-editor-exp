"use client";

import type { TextElement as TextElementData } from "@/lib/pdf/types";
import { ElementFrame, type ElementFrameProps } from "../element-frame";
import { TextBackground, TextSvg, useTextLayout } from "../text-svg";

type Props = Omit<ElementFrameProps, "element" | "children" | "label" | "warning"> & {
  element: TextElementData;
};

export function TextElement({ element, ...frameProps }: Props) {
  const layout = useTextLayout(element);

  return (
    <ElementFrame element={element} label="Text" handleMode="all" warning={layout?.overflow} {...frameProps}>
      <TextBackground element={element} />
      {layout && <TextSvg element={element} layout={layout} clip={false} />}
    </ElementFrame>
  );
}
