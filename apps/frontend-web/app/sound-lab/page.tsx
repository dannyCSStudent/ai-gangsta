"use client";
import { useState } from "react";
import { BeatVisualizer } from "./components/BeatVisualizer";
import { MixerPanel } from "./components/MixerPanel";
import { RecorderControls } from "./components/RecorderControls";
import { FixMyGroovePanel } from "./components/FixMyGroovePanel";
import { TransportControls } from "./components/TransportControls";
import { GangstaEQPanel } from "./components/GangstaEQPanel";

export default function SoundLabPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [pan, setPan] = useState(0);
  const [fx, setFx] = useState(0);
  const [grooveData, setGrooveData] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-black text-white p-8 flex flex-col gap-8">
      <h1 className="text-4xl font-bold text-center text-amber-400 drop-shadow-md">
        🎧 Gangsta Sound Lab v2.0
      </h1>

      <BeatVisualizer isPlaying={isPlaying} />

      <TransportControls
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
      />

      <MixerPanel
        volume={volume}
        setVolume={setVolume}
        pan={pan}
        setPan={setPan}
        fx={fx}
        setFx={setFx}
      />

      <div className="mt-6">
        <GangstaEQPanel />
      </div>

      <RecorderControls
        isRecording={isRecording}
        setIsRecording={setIsRecording}
      />

      <FixMyGroovePanel
        grooveData={grooveData}
        setGrooveData={setGrooveData}
      />
    </div>
  );
}
