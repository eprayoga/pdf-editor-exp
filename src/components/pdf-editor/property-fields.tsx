"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { TextAlignCenter, TextAlignLeft, TextAlignRight, TextB, TextItalic, Trash, WarningCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  FONT_CATEGORY_LABELS,
  FONT_FAMILY_GROUPS,
  getFontCssFamily,
  getFontGroup,
  getFontOption,
  resolveFontVariant,
  type FontFamilyGroup,
} from "@/lib/pdf/fonts";
import { isValidHexColor, normalizeHexColor } from "@/lib/pdf/color";
import type { ElementPatch, FontFamily, TextAlign } from "@/lib/pdf/types";
import { cn } from "@/lib/utils";
import { useEditorStore } from "./store";

export function useElementUpdater(id: string) {
  const updateElement = useEditorStore((state) => state.updateElement);
  return (patch: ElementPatch, field: string) => updateElement(id, patch, { coalesceKey: `${id}:${field}` });
}

export function formatInputNumber(value: number) {
  if (!Number.isFinite(value)) return "";
  return String(Math.round(value * 1000) / 1000);
}

export function PropertySection({ title, children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("space-y-3", className)}>
      {title && <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>}
      {children}
    </section>
  );
}

export function FieldGroup({ label, htmlFor, children, hint }: { label: string; htmlFor?: string; children: ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

type NumberFieldProps = {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  invalid?: boolean;
  id?: string;
};

export function NumberField({ label, value, onValueChange, min, max, step = 1, unit = "pt", invalid, id }: NumberFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [draft, setDraft] = useState(formatInputNumber(value));
  const focusedRef = useRef(false);

  useEffect(() => {
    const parsed = Number.parseFloat(draft);
    if (focusedRef.current && Number.isFinite(parsed) && Math.abs(parsed - value) < 1e-9) return;
    setDraft(formatInputNumber(value));
  }, [value]);

  const outOfRange = (parsed: number) => (min !== undefined && parsed < min) || (max !== undefined && parsed > max);
  const parsedDraft = Number.parseFloat(draft);
  const draftInvalid = draft.trim() === "" || !Number.isFinite(parsedDraft) || outOfRange(parsedDraft);

  return (
    <div className="space-y-1.5">
      <Label htmlFor={inputId}>{label}</Label>
      <div className="relative">
        <Input
          id={inputId}
          type="number"
          inputMode="decimal"
          step={step}
          min={min}
          max={max}
          value={draft}
          aria-invalid={invalid || draftInvalid}
          className="pr-8 tabular-nums"
          onFocus={() => {
            focusedRef.current = true;
          }}
          onBlur={() => {
            focusedRef.current = false;
            setDraft(formatInputNumber(value));
          }}
          onChange={(event) => {
            const next = event.target.value;
            setDraft(next);
            const parsed = Number.parseFloat(next);
            if (next.trim() !== "" && Number.isFinite(parsed) && !outOfRange(parsed)) {
              onValueChange(parsed);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
        />
        {unit && (
          <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-[11px] text-muted-foreground">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

type BoxFieldsProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  onXChange: (value: number) => void;
  onYChange: (value: number) => void;
  onWidthChange: (value: number) => void;
  onHeightChange: (value: number) => void;
};

export function BoxFields({ x, y, width, height, onXChange, onYChange, onWidthChange, onHeightChange }: BoxFieldsProps) {
  return (
    <PropertySection title="Position">
      <div className="grid grid-cols-2 gap-3">
        <NumberField label="X" value={x} step={0.5} onValueChange={onXChange} />
        <NumberField label="Y" value={y} step={0.5} onValueChange={onYChange} />
        <NumberField label="Width" value={width} step={0.5} min={0.001} onValueChange={onWidthChange} />
        <NumberField label="Height" value={height} step={0.5} min={0.001} onValueChange={onHeightChange} />
      </div>
    </PropertySection>
  );
}

export function PropertiesHeader({ icon, title, description }: { icon: ReactNode; title: string; description?: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-muted/50 text-foreground">{icon}</div>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold leading-8">{title}</h2>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}

const FONT_GROUPS_BY_CATEGORY = Object.entries(FONT_CATEGORY_LABELS).map(([category, label]) => ({
  label,
  families: FONT_FAMILY_GROUPS.filter((group) => group.category === category),
}));

function familyPreviewStyle(group: FontFamilyGroup) {
  const regular = group.variants.find((option) => option.style === "normal") ?? group.variants[0];
  return { fontFamily: getFontCssFamily(regular), fontWeight: regular.cssWeight, fontStyle: regular.cssStyle };
}

export function FontSelect({ value, onValueChange }: { value: FontFamily; onValueChange: (value: FontFamily) => void }) {
  const id = useId();
  const current = getFontOption(value);
  const group = getFontGroup(value);
  const bold = current.weight >= 600;
  const italic = current.style === "italic";
  const hasVariant = (weight: number, style: "normal" | "italic") =>
    group.variants.some((option) => (weight >= 600) === (option.weight >= 600) && option.style === style);
  const canBold = hasVariant(bold ? 400 : 700, current.style);
  const canItalic = hasVariant(current.weight, italic ? "normal" : "italic");

  return (
    <FieldGroup label="Font" htmlFor={id} hint={`${FONT_FAMILY_GROUPS.length} font families available`}>
      <div className="flex gap-2">
        <Select
          value={group.key}
          onValueChange={(familyKey) => onValueChange(resolveFontVariant(familyKey, current.weight, current.style))}
        >
          <SelectTrigger id={id} className="min-w-0 flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-80">
            {FONT_GROUPS_BY_CATEGORY.map((category) =>
              category.families.length === 0 ? null : (
                <SelectGroup key={category.label}>
                  <SelectLabel>{category.label}</SelectLabel>
                  {category.families.map((family) => (
                    <SelectItem key={family.key} value={family.key}>
                      <span style={familyPreviewStyle(family)}>{family.label}</span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              )
            )}
          </SelectContent>
        </Select>
        <ToggleGroup
          type="multiple"
          value={[...(bold ? ["bold"] : []), ...(italic ? ["italic"] : [])]}
          onValueChange={(next) =>
            onValueChange(resolveFontVariant(group.key, next.includes("bold") ? 700 : 400, next.includes("italic") ? "italic" : "normal"))
          }
          className="flex shrink-0"
          aria-label="Font style"
        >
          <ToggleGroupItem value="bold" aria-label="Bold" disabled={!canBold} className="px-2.5">
            <TextB className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="italic" aria-label="Italic" disabled={!canItalic} className="px-2.5">
            <TextItalic className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </FieldGroup>
  );
}

export function AlignmentToggle({ value, onValueChange }: { value: TextAlign; onValueChange: (value: TextAlign) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>Alignment</Label>
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(next) => {
          if (next) onValueChange(next as TextAlign);
        }}
        className="flex w-full"
        aria-label="Text alignment"
      >
        <ToggleGroupItem value="left" aria-label="Align left">
          <TextAlignLeft className="h-4 w-4" />
          Left
        </ToggleGroupItem>
        <ToggleGroupItem value="center" aria-label="Align center">
          <TextAlignCenter className="h-4 w-4" />
          Center
        </ToggleGroupItem>
        <ToggleGroupItem value="right" aria-label="Align right">
          <TextAlignRight className="h-4 w-4" />
          Right
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}

export function ColorField({
  value,
  onValueChange,
  label = "Text Color",
}: {
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
}) {
  const id = useId();
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  return (
    <FieldGroup label={label} htmlFor={id}>
      <div className="flex items-center gap-2">
        <label className="relative h-9 w-9 shrink-0 cursor-pointer overflow-hidden rounded-md border shadow-sm focus-within:ring-1 focus-within:ring-ring">
          <span className="absolute inset-1 rounded-[4px]" style={{ backgroundColor: normalizeHexColor(value) }} />
          <input
            type="color"
            aria-label={`Pick ${label.toLowerCase()}`}
            value={normalizeHexColor(value)}
            onChange={(event) => onValueChange(event.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>
        <Input
          id={id}
          value={draft}
          aria-invalid={!isValidHexColor(draft)}
          className="font-mono text-xs uppercase"
          onChange={(event) => {
            const next = event.target.value;
            setDraft(next);
            if (isValidHexColor(next)) onValueChange(normalizeHexColor(next));
          }}
          onBlur={() => setDraft(value)}
        />
      </div>
    </FieldGroup>
  );
}

type BackgroundFieldProps = {
  color: string;
  opacity: number;
  onColorChange: (value: string) => void;
  onOpacityChange: (value: number) => void;
};

export function BackgroundField({ color, opacity, onColorChange, onOpacityChange }: BackgroundFieldProps) {
  const sliderId = useId();
  const percent = Math.round(Math.min(Math.max(opacity ?? 0, 0), 1) * 100);
  const transparent = percent === 0;

  return (
    <div className="space-y-3">
      <ColorField label="Background Color" value={color ?? "#ffffff"} onValueChange={onColorChange} />
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor={sliderId}>Opacity</Label>
          <span className="text-[11px] tabular-nums text-muted-foreground">{transparent ? "Transparent" : `${percent}%`}</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            id={sliderId}
            type="range"
            min={0}
            max={100}
            step={1}
            value={percent}
            onChange={(event) => onOpacityChange(Number(event.target.value) / 100)}
            className="h-2 min-w-0 flex-1 cursor-pointer accent-primary"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => onOpacityChange(transparent ? 1 : 0)}
          >
            {transparent ? "Fill" : "Transparent"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ElementErrors({ errors }: { errors: string[] | undefined }) {
  if (!errors || errors.length === 0) return null;
  return (
    <div role="alert" className="space-y-1 rounded-md border border-destructive/30 bg-destructive/5 p-2.5 text-xs text-destructive">
      {errors.map((error) => (
        <p key={error} className="flex gap-1.5">
          <WarningCircle className="mt-px h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ))}
    </div>
  );
}

export function InlineWarning({ children }: { children: ReactNode }) {
  return (
    <div role="status" className="flex gap-1.5 rounded-md border border-amber-300/60 bg-amber-50 p-2.5 text-xs text-amber-800">
      <WarningCircle className="mt-px h-3.5 w-3.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

export function DeleteElementButton({ id }: { id: string }) {
  const deleteElement = useEditorStore((state) => state.deleteElement);
  return (
    <Button
      variant="outline"
      className="w-full text-destructive hover:bg-destructive/5 hover:text-destructive"
      onClick={() => deleteElement(id)}
    >
      <Trash className="h-4 w-4" />
      Delete
    </Button>
  );
}
