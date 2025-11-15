"use client";

import React, { useEffect, useRef, useState } from "react";
import * as Tone from "tone";
import { GangstaSlider } from "./ui/GangstaSlider";

/**
 * 🎚️ GangstaEQPanel v1.1
 * - Creates a single Tone.EQ3 on mount and disposes on unmount
 * - Updates EQ values reactively with a single effect that includes all dependencies
 * - Avoids missing-deps lint warnings
 */

export function GangstaEQPanel() {
  const [lowGain, setLowGain] = useState(0);
  const [midGain, setMidGain] = useState(0);
  const [highGain, setHighGain] = useState(0);

  const [lowFreq, setLowFreq] = useState(100);
  const [midFreq, setMidFreq] = useState(1000);
  const [highFreq, setHighFreq] = useState(5000);

  // Keep the EQ node in a ref so we create it once
  const eqRef = useRef<Tone.EQ3 | null>(null);

  // Create EQ on mount, dispose on unmount
  useEffect(() => {
    // create the EQ with initial state
    eqRef.current = new Tone.EQ3({
      low: lowGain,
      mid: midGain,
      high: highGain,
      lowFrequency: lowFreq,
      highFrequency: highFreq,
    }).toDestination();

    // optional: expose for debugging
    // (window as any).__gangstaEQ = eqRef.current;

    return () => {
      // cleanup
      try {
        eqRef.current?.disconnect();
        eqRef.current?.dispose();
      } catch {
        /* ignore cleanup errors */
      }
      eqRef.current = null;
    };
    // intentionally empty deps: create once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update EQ parameters whenever any relevant value changes
  useEffect(() => {
    const eq = eqRef.current;
    if (!eq) return;

    // Tone.EQ3's low/mid/high are internal Tone filters with .gain (value)
    // Some Tone versions expose .low/.mid/.high as objects with .value,
    // others expose them as Tone.Param-like objects. We'll use a narrow local type to avoid `any`.
    try {
      // Narrow to a shape that includes the properties we use.
      type EqFilter = { value: number } | { value: number; setValueAtTime?: (v: number, t?: number) => void };
      const eqTyped = eq as unknown as {
        low: EqFilter;
        mid: EqFilter;
        high: EqFilter;
        lowFrequency?: EqFilter;
        highFrequency?: EqFilter;
      };

      // gains
      eqTyped.low.value = lowGain;
      eqTyped.mid.value = midGain;
      eqTyped.high.value = highGain;

      // frequency anchors
      if (eqTyped.lowFrequency !== undefined) eqTyped.lowFrequency.value = lowFreq;
      if (eqTyped.highFrequency !== undefined) eqTyped.highFrequency.value = highFreq;

      // For some Tone builds the properties above might be Param objects
      // and require `.value` or `.setValueAtTime` — the simple assignment covers most builds.
    } catch (err) {
      // If this happens in some Tone build, don't crash the app.
      // You can inspect eqRef.current in console to adapt the assignment.
     
      console.warn("Could not set EQ params directly:", err);
    }
  }, [lowGain, midGain, highGain, lowFreq, midFreq, highFreq]);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-md">
      <h2 className="text-xl mb-4 font-semibold text-amber-300 flex items-center">
        🎛️ EQ Panel <span className="text-xs ml-2 text-zinc-400">(Live Tone EQ)</span>
      </h2>

      <div className="grid grid-cols-3 gap-6">
        {/* Low */}
        <div className="text-center">
          <h3 className="font-semibold text-sm text-amber-400 mb-2">Low</h3>
          <GangstaSlider
            min={-12}
            max={12}
            step={0.1}
            value={lowGain}
            onChange={(v) => setLowGain(v)}
          />
          <p className="text-xs text-zinc-400 mt-1">{lowGain.toFixed(1)} dB</p>

          <div className="mt-4" />
          <GangstaSlider
            min={50}
            max={500}
            step={10}
            value={lowFreq}
            onChange={(v) => setLowFreq(v)}
          />
          <p className="text-xs text-zinc-400 mt-1">{lowFreq.toFixed(0)} Hz</p>
        </div>

        {/* Mid */}
        <div className="text-center">
          <h3 className="font-semibold text-sm text-amber-400 mb-2">Mid</h3>
          <GangstaSlider
            min={-12}
            max={12}
            step={0.1}
            value={midGain}
            onChange={(v) => setMidGain(v)}
          />
          <p className="text-xs text-zinc-400 mt-1">{midGain.toFixed(1)} dB</p>

          <div className="mt-4" />
          <GangstaSlider
            min={200}
            max={5000}
            step={10}
            value={midFreq}
            onChange={(v) => setMidFreq(v)}
          />
          <p className="text-xs text-zinc-400 mt-1">{midFreq.toFixed(0)} Hz</p>
        </div>

        {/* High */}
        <div className="text-center">
          <h3 className="font-semibold text-sm text-amber-400 mb-2">High</h3>
          <GangstaSlider
            min={-12}
            max={12}
            step={0.1}
            value={highGain}
            onChange={(v) => setHighGain(v)}
          />
          <p className="text-xs text-zinc-400 mt-1">{highGain.toFixed(1)} dB</p>

          <div className="mt-4" />
          <GangstaSlider
            min={3000}
            max={14000}
            step={50}
            value={highFreq}
            onChange={(v) => setHighFreq(v)}
          />
          <p className="text-xs text-zinc-400 mt-1">{highFreq.toFixed(0)} Hz</p>
        </div>
      </div>
    </div>
  );
}
