import { formatCoordinate } from "@/lib/pdf/coordinates";

type PositionDetailsProps = {
  lowerLeftX: number;
  lowerLeftY: number;
  upperRightX: number;
  upperRightY: number;
};

function CoordinateRow({ axis, value }: { axis: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-muted-foreground">{axis}</dt>
      <dd className="font-medium tabular-nums text-foreground">{formatCoordinate(value, 3)}</dd>
    </div>
  );
}

export function PositionDetails({ lowerLeftX, lowerLeftY, upperRightX, upperRightY }: PositionDetailsProps) {
  return (
    <section aria-label="Position details" className="rounded-md border bg-muted/40 p-3">
      <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Position Details</h3>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="space-y-1.5">
          <p className="font-medium text-foreground">Lower Left</p>
          <dl className="space-y-1">
            <CoordinateRow axis="X" value={lowerLeftX} />
            <CoordinateRow axis="Y" value={lowerLeftY} />
          </dl>
        </div>
        <div className="space-y-1.5">
          <p className="font-medium text-foreground">Upper Right</p>
          <dl className="space-y-1">
            <CoordinateRow axis="X" value={upperRightX} />
            <CoordinateRow axis="Y" value={upperRightY} />
          </dl>
        </div>
      </div>
    </section>
  );
}
