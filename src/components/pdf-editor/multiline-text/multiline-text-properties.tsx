"use client";

import { TextAlignLeft } from "@phosphor-icons/react";
import { Textarea } from "@/components/ui/textarea";
import { getBoundingBoxDetails } from "@/lib/pdf/coordinates";
import type { MultilineTextElement } from "@/lib/pdf/types";
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
  element: MultilineTextElement;
  errors?: string[];
};

export function MultilineTextProperties({ element, errors }: Props) {
  const update = useElementUpdater(element.id);
  const layout = useTextLayout(element);

  return (
    <div className="space-y-5">
      <PropertiesHeader icon={<TextAlignLeft className="h-4 w-4" />} title="Multiline Text" />
      <FieldGroup label="Content" htmlFor={CONTENT_FIELD_ID}>
        <Textarea
          id={CONTENT_FIELD_ID}
          value={element.content}
          rows={5}
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
        <div className="grid grid-cols-2 gap-3">
          <NumberField
            label="Font Size"
            value={element.fontSize}
            min={0.5}
            step={1}
            onValueChange={(fontSize) => update({ fontSize }, "fontSize")}
          />
          <NumberField
            label="Line Height"
            value={element.lineHeight}
            min={0.5}
            step={1}
            onValueChange={(lineHeight) => update({ lineHeight }, "lineHeight")}
          />
        </div>
        <FontSelect value={element.fontFamily} onValueChange={(fontFamily) => update({ fontFamily }, "fontFamily")} />
        <AlignmentToggle value={element.textAlign} onValueChange={(textAlign) => update({ textAlign }, "textAlign")} />
        <ColorField value={element.color} onValueChange={(color) => update({ color }, "color")} />
      </PropertySection>
      {layout && (
        <p className="text-xs text-muted-foreground tabular-nums">
          {layout.visibleLineCount} of {layout.totalLineCount} line{layout.totalLineCount === 1 ? "" : "s"} visible
        </p>
      )}
      {layout?.overflow && (
        <InlineWarning>Text exceeds the selected area. Lines that do not fit are clipped in the preview and the generated PDF.</InlineWarning>
      )}
      {layout?.hasUnsupportedCharacters && (
        <InlineWarning>Some characters are not supported by the standard PDF font and will be replaced with “?”.</InlineWarning>
      )}
      <ElementErrors errors={errors} />
      <PositionDetails {...getBoundingBoxDetails(element)} />
      <DeleteElementButton id={element.id} />
    </div>
  );
}
