"use client";

import { useMemo } from "react";

export const RULER_SIZE = 20;

const STEP_CANDIDATES = [5, 10, 25, 50, 100, 200, 500, 1000];

function pickMajorStep(scale: number) {
  return STEP_CANDIDATES.find((step) => step * scale >= 56) ?? STEP_CANDIDATES[STEP_CANDIDATES.length - 1];
}

type RulerProps = {
  orientation: "horizontal" | "vertical";
  length: number;
  scale: number;
};

export function Ruler({ orientation, length, scale }: RulerProps) {
  const major = pickMajorStep(scale);
  const minor = major / 5;
  const pixelLength = length * scale;

  const ticks = useMemo(() => {
    const result: { value: number; major: boolean }[] = [];
    const count = Math.floor(length / minor + 0.0001);
    for (let index = 0; index <= count; index += 1) {
      const value = index * minor;
      result.push({ value, major: index % 5 === 0 });
    }
    return result;
  }, [length, minor]);

  if (orientation === "horizontal") {
    return (
      <svg
        width={pixelLength}
        height={RULER_SIZE}
        className="block text-muted-foreground"
        aria-label={`Horizontal ruler, X from 0 to ${length.toFixed(2)} points`}
        role="img"
      >
        <line x1={0} y1={RULER_SIZE - 0.5} x2={pixelLength} y2={RULER_SIZE - 0.5} stroke="currentColor" strokeOpacity={0.35} />
        {ticks.map((tick) => {
          const x = tick.value * scale;
          return (
            <g key={tick.value}>
              <line
                x1={x + 0.5}
                x2={x + 0.5}
                y1={tick.major ? 6 : 14}
                y2={RULER_SIZE}
                stroke="currentColor"
                strokeOpacity={tick.major ? 0.6 : 0.3}
              />
              {tick.major && (
                <text x={x + 3} y={10} fontSize={9} fill="currentColor" className="tabular-nums">
                  {tick.value}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    );
  }

  return (
    <svg
      width={RULER_SIZE}
      height={pixelLength}
      className="block text-muted-foreground"
      aria-label={`Vertical ruler, Y from 0 at the bottom to ${length.toFixed(2)} points at the top`}
      role="img"
    >
      <line x1={RULER_SIZE - 0.5} y1={0} x2={RULER_SIZE - 0.5} y2={pixelLength} stroke="currentColor" strokeOpacity={0.35} />
      {ticks.map((tick) => {
        const y = pixelLength - tick.value * scale;
        return (
          <g key={tick.value}>
            <line
              y1={y - 0.5}
              y2={y - 0.5}
              x1={tick.major ? 6 : 14}
              x2={RULER_SIZE}
              stroke="currentColor"
              strokeOpacity={tick.major ? 0.6 : 0.3}
            />
            {tick.major && (
              <text
                x={9}
                y={y - 3}
                fontSize={9}
                fill="currentColor"
                transform={`rotate(-90 9 ${y - 3})`}
                className="tabular-nums"
              >
                {tick.value}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
