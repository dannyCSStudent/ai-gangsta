"use client";
import { GangstaSlider } from "./ui/GangstaSlider";

export function MixerPanel({
  volume,
  setVolume,
  pan,
  setPan,
  fx,
  setFx,
}: {
  volume: number;
  setVolume: (v: number) => void;
  pan: number;
  setPan: (p: number) => void;
  fx: number;
  setFx: (f: number) => void;
}) {
  return (
    <div className="bg-zinc-900 rounded-2xl p-6 shadow-md border border-zinc-800">
      <h2 className="text-xl mb-4 font-semibold text-amber-300 text-center">
        🎚 Mixer Panel
      </h2>
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col items-center">
          <label className="block mb-2 text-sm">Volume</label>
          <GangstaSlider
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(v) => setVolume(v)}
          />
          <p className="text-xs mt-1 opacity-70">{(volume * 100).toFixed(0)}%</p>
        </div>

        <div className="flex flex-col items-center">
          <label className="block mb-2 text-sm">Pan</label>
          <GangstaSlider
            min={-1}
            max={1}
            step={0.01}
            value={pan}
            onChange={(v) => setPan(v)}
          />
          <p className="text-xs mt-1 opacity-70">
            {pan < 0 ? `${(pan * -100).toFixed(0)}% L` : `${(pan * 100).toFixed(0)}% R`}
          </p>
        </div>

        <div className="flex flex-col items-center">
          <label className="block mb-2 text-sm">FX Depth</label>
          <GangstaSlider
            min={0}
            max={1}
            step={0.01}
            value={fx}
            onChange={(v) => setFx(v)}
          />
          <p className="text-xs mt-1 opacity-70">{(fx * 100).toFixed(0)}%</p>
        </div>
      </div>
    </div>
  );
}
