"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { TextAlignCenter, TextAlignLeft, TextAlignRight, Trash, WarningCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { FONT_OPTIONS } from "@/lib/pdf/fonts";
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

export function FontSelect({ value, onValueChange }: { value: FontFamily; onValueChange: (value: FontFamily) => void }) {
  const id = useId();
  return (
    <FieldGroup label="Font" htmlFor={id}>
      <Select value={value} onValueChange={(next) => onValueChange(next as FontFamily)}>
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FONT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <span style={{ fontFamily: option.cssFamily, fontWeight: option.cssWeight, fontStyle: option.cssStyle }}>
                {option.label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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

export function ColorField({ value, onValueChange }: { value: string; onValueChange: (value: string) => void }) {
  const id = useId();
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  return (
    <FieldGroup label="Text Color" htmlFor={id}>
      <div className="flex items-center gap-2">
        <label className="relative h-9 w-9 shrink-0 cursor-pointer overflow-hidden rounded-md border shadow-sm focus-within:ring-1 focus-within:ring-ring">
          <span className="absolute inset-1 rounded-[4px]" style={{ backgroundColor: normalizeHexColor(value) }} />
          <input
            type="color"
            aria-label="Pick text color"
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
