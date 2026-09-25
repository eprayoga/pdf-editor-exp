"use client";

import type { MultilineTextElement as MultilineTextElementData } from "@/lib/pdf/types";
import { ElementFrame, type ElementFrameProps } from "../element-frame";
import { TextSvg, useTextLayout } from "../text-svg";

type Props = Omit<ElementFrameProps, "element" | "children" | "label" | "warning"> & {
  element: MultilineTextElementData;
};

export function MultilineTextElement({ element, ...frameProps }: Props) {
  const layout = useTextLayout(element);

  return (
    <ElementFrame element={element} label="Multiline text" handleMode="all" warning={layout?.overflow} {...frameProps}>
      {layout && <TextSvg element={element} layout={layout} clip />}
    </ElementFrame>
  );
}
