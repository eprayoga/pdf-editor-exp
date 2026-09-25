"use client";

import { TextT } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { getBoundingBoxDetails } from "@/lib/pdf/coordinates";
import type { TextElement } from "@/lib/pdf/types";
import { CONTENT_FIELD_ID } from "../pdf-element";
import { PositionDetails } from "../position-details";
import {
  AlignmentToggle,
  BoxFields,
  ColorField,
  DeleteElementButton,
  ElementErrors,
  FieldGroup,
  FontSelect,
  InlineWarning,
  NumberField,
  PropertiesHeader,
  PropertySection,
  useElementUpdater,
} from "../property-fields";
import { useTextLayout } from "../text-svg";

type Props = {
  element: TextElement;
  errors?: string[];
};

export function TextProperties({ element, errors }: Props) {
  const update = useElementUpdater(element.id);
  const layout = useTextLayout(element);

  return (
    <div className="space-y-5">
      <PropertiesHeader icon={<TextT className="h-4 w-4" />} title="Text" />
      <FieldGroup label="Content" htmlFor={CONTENT_FIELD_ID}>
        <Input
          id={CONTENT_FIELD_ID}
          value={element.content}
          placeholder="Enter text"
          onChange={(event) => update({ content: event.target.value }, "content")}
        />
      </FieldGroup>
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
      <PropertySection title="Typography">
        <NumberField
          label="Font Size"
          value={element.fontSize}
          min={0.5}
          step={1}
          onValueChange={(fontSize) => update({ fontSize }, "fontSize")}
        />
        <FontSelect value={element.fontFamily} onValueChange={(fontFamily) => update({ fontFamily }, "fontFamily")} />
        <AlignmentToggle value={element.textAlign} onValueChange={(textAlign) => update({ textAlign }, "textAlign")} />
        <ColorField value={element.color} onValueChange={(color) => update({ color }, "color")} />
      </PropertySection>
      {layout?.overflow && <InlineWarning>Text exceeds the selected area.</InlineWarning>}
      {layout?.hasUnsupportedCharacters && (
        <InlineWarning>Some characters are not supported by the standard PDF font and will be replaced with “?”.</InlineWarning>
      )}
      <ElementErrors errors={errors} />
      <PositionDetails {...getBoundingBoxDetails(element)} />
      <DeleteElementButton id={element.id} />
    </div>
  );
}
