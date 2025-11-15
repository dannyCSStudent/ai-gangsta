"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

/**
 * GangstaSlider 🎚
 * A premium, flexible slider built on Radix UI
 * Supports both single-value and multi-handle usage
 */
export interface GangstaSliderProps {
  min?: number;
  max?: number;
  step?: number;
  value: number | number[];
  onChange?: (value: number) => void;
  onChangeMulti?: (value: number[]) => void;
  className?: string;
}

export function GangstaSlider({
  min = 0,
  max = 100,
  step = 1,
  value,
  onChange,
  onChangeMulti,
  className = "",
}: GangstaSliderProps) {
  // Normalize to array internally (Radix expects an array)
  const internalValue = Array.isArray(value) ? value : [value];

  return (
    <SliderPrimitive.Root
      className={`relative flex items-center select-none touch-none w-full h-6 ${className}`}
      min={min}
      max={max}
      step={step}
      value={internalValue}
      onValueChange={(v) => {
        if (v.length === 1 && onChange) onChange(v[0]);
        if (v.length > 1 && onChangeMulti) onChangeMulti(v);
      }}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow rounded-full bg-zinc-700">
        <SliderPrimitive.Range className="absolute h-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 rounded-full shadow-md shadow-amber-400/30 transition-all" />
      </SliderPrimitive.Track>
      {internalValue.map((_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          className="block h-4 w-4 rounded-full bg-amber-300 shadow-lg shadow-amber-500/40 border border-zinc-900 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
      ))}
    </SliderPrimitive.Root>
  );
}
