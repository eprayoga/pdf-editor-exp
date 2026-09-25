"use client";

import type { ImageElement as ImageElementData } from "@/lib/pdf/types";
import { ElementFrame, type ElementFrameProps } from "../element-frame";

type Props = Omit<ElementFrameProps, "element" | "children" | "label" | "aspectRatio" | "handleMode"> & {
  element: ImageElementData;
};

export function ImageElement({ element, ...frameProps }: Props) {
  const locked = element.lockAspectRatio;

  return (
    <ElementFrame
      element={element}
      label="Image"
      handleMode={locked ? "corners" : "all"}
      aspectRatio={locked ? element.aspectRatio : undefined}
      {...frameProps}
    >
      <img src={element.imageData} alt="" draggable={false} className="block h-full w-full select-none object-fill" />
    </ElementFrame>
  );
}
