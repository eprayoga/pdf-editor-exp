"use client";

import { Signature } from "@phosphor-icons/react";
import { getBoundingBoxDetails } from "@/lib/pdf/coordinates";
import type { SignatureElement } from "@/lib/pdf/types";
import { PositionDetails } from "../position-details";
import { BoxFields, DeleteElementButton, ElementErrors, PropertiesHeader, useElementUpdater } from "../property-fields";

type Props = {
  element: SignatureElement;
  errors?: string[];
};

export function SignatureProperties({ element, errors }: Props) {
  const update = useElementUpdater(element.id);

  return (
    <div className="space-y-5">
      <PropertiesHeader icon={<Signature className="h-4 w-4" />} title="Signature" />
      <div className="flex h-20 items-center justify-center rounded-md border bg-[linear-gradient(45deg,#f4f4f5_25%,transparent_25%,transparent_75%,#f4f4f5_75%),linear-gradient(45deg,#f4f4f5_25%,transparent_25%,transparent_75%,#f4f4f5_75%)] bg-[length:12px_12px] bg-[position:0_0,6px_6px] p-2">
        <img src={element.imageData} alt="Signature preview" className="max-h-full max-w-full object-contain" />
      </div>
      <BoxFields
        x={element.x}
        y={element.y}
        width={element.width}
        height={element.height}
        onXChange={(x) => update({ x }, "x")}
        onYChange={(y) => update({ y }, "y")}
        onWidthChange={(width) => update({ width }, "width")}
        onHeightChange={(height) => update({ height }, "height")}
      />
      <ElementErrors errors={errors} />
      <PositionDetails {...getBoundingBoxDetails(element)} />
      <DeleteElementButton id={element.id} />
    </div>
  );
}
