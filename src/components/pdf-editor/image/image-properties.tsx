"use client";

import { useId } from "react";
import { Image as ImageIcon, Lock, LockOpen } from "@phosphor-icons/react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { getBoundingBoxDetails } from "@/lib/pdf/coordinates";
import type { ImageElement } from "@/lib/pdf/types";
import { PositionDetails } from "../position-details";
import { BoxFields, DeleteElementButton, ElementErrors, PropertiesHeader, useElementUpdater } from "../property-fields";

type Props = {
  element: ImageElement;
  errors?: string[];
};

export function ImageProperties({ element, errors }: Props) {
  const update = useElementUpdater(element.id);
  const lockId = useId();
  const ratio = element.aspectRatio > 0 ? element.aspectRatio : element.width / element.height;

  return (
    <div className="space-y-5">
      <PropertiesHeader icon={<ImageIcon className="h-4 w-4" />} title="Image" />
      <div className="flex h-24 items-center justify-center rounded-md border bg-muted/40 p-2">
        <img src={element.imageData} alt="Image preview" className="max-h-full max-w-full object-contain" />
      </div>
      <BoxFields
        x={element.x}
        y={element.y}
        width={element.width}
        height={element.height}
        onXChange={(x) => update({ x }, "x")}
        onYChange={(y) => update({ y }, "y")}
        onWidthChange={(width) =>
          update(element.lockAspectRatio ? { width, height: width / ratio } : { width }, "width")
        }
        onHeightChange={(height) =>
          update(element.lockAspectRatio ? { height, width: height * ratio } : { height }, "height")
        }
      />
      <div className="flex items-center gap-2">
        <Checkbox
          id={lockId}
          checked={element.lockAspectRatio}
          onCheckedChange={(checked) => {
            const lockAspectRatio = checked === true;
            update(
              lockAspectRatio
                ? { lockAspectRatio, aspectRatio: element.width / element.height }
                : { lockAspectRatio },
              "lockAspectRatio"
            );
          }}
        />
        <Label htmlFor={lockId} className="flex cursor-pointer items-center gap-1.5 text-sm font-normal text-foreground">
          {element.lockAspectRatio ? <Lock className="h-3.5 w-3.5" /> : <LockOpen className="h-3.5 w-3.5" />}
          Lock aspect ratio
        </Label>
      </div>
      <ElementErrors errors={errors} />
      <PositionDetails {...getBoundingBoxDetails(element)} />
      <DeleteElementButton id={element.id} />
    </div>
  );
}
