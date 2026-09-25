"use client";

import type { SignatureElement as SignatureElementData } from "@/lib/pdf/types";
import { ElementFrame, type ElementFrameProps } from "../element-frame";

type Props = Omit<ElementFrameProps, "element" | "children" | "label"> & {
  element: SignatureElementData;
};

export function SignatureElement({ element, ...frameProps }: Props) {
  return (
    <ElementFrame element={element} label="Signature" handleMode="all" {...frameProps}>
      <img
        src={element.imageData}
        alt=""
        draggable={false}
        className="block h-full w-full select-none object-fill"
      />
    </ElementFrame>
  );
}
