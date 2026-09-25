"use client";

import { QrCode } from "@phosphor-icons/react";
import { Textarea } from "@/components/ui/textarea";
import { getQRPositionDetails } from "@/lib/pdf/coordinates";
import type { QRElement } from "@/lib/pdf/types";
import { CONTENT_FIELD_ID } from "../pdf-element";
import { PositionDetails } from "../position-details";
import {
  DeleteElementButton,
  ElementErrors,
  FieldGroup,
  NumberField,
  PropertiesHeader,
  PropertySection,
  useElementUpdater,
} from "../property-fields";

type Props = {
  element: QRElement;
  errors?: string[];
};

export function QRProperties({ element, errors }: Props) {
  const update = useElementUpdater(element.id);

  return (
    <div className="space-y-5">
      <PropertiesHeader icon={<QrCode className="h-4 w-4" />} title="QR Code" />
      <FieldGroup label="Content" htmlFor={CONTENT_FIELD_ID}>
        <Textarea
          id={CONTENT_FIELD_ID}
          value={element.content}
          rows={3}
          placeholder="https://example.com"
          aria-invalid={element.content.trim().length === 0}
          onChange={(event) => update({ content: event.target.value }, "content")}
        />
      </FieldGroup>
      <PropertySection title="Position">
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="X" value={element.x} step={0.5} onValueChange={(x) => update({ x }, "x")} />
          <NumberField label="Y" value={element.y} step={0.5} onValueChange={(y) => update({ y }, "y")} />
          <NumberField
            label="Size"
            value={element.size}
            step={0.5}
            min={0.001}
            onValueChange={(size) => update({ size }, "size")}
          />
        </div>
      </PropertySection>
      <ElementErrors errors={errors} />
      <PositionDetails {...getQRPositionDetails(element)} />
      <DeleteElementButton id={element.id} />
    </div>
  );
}
