"use client"

import React, { useState, useEffect, useRef } from "react";
import * as Tone from "tone";
import MonacoEditor from "@monaco-editor/react";
import WaveSurfer from "wavesurfer.js";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";

export default function GangstaSoundLab() {
  const [code, setCode] = useState<string>(
    `// Welcome to Gangsta Sound Lab 🎧
// Try changing notes or BPM
const synth = new Tone.Synth().toDestination();
const notes = ["C4", "E4", "G4", "B4"];
let index = 0;
Tone.Transport.scheduleRepeat(() => {
  synth.triggerAttackRelease(notes[index % notes.length], "8n");
  index++;
}, "4n");
Tone.Transport.bpm.value = 90;`
  );

  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const waveformContainerRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = async () => {
    await Tone.start();
    if (isPlaying) {
      Tone.Transport.stop();
      Tone.Transport.cancel();
      setIsPlaying(false);
      return;
    }

    try {
      // eslint-disable-next-line no-eval
      eval(code);
      Tone.Transport.start();
      setIsPlaying(true);
    } catch (err) {
      console.error("Error in code:", err);
    }
  };

  useEffect(() => {
    if (waveformContainerRef.current && !wavesurferRef.current) {
      wavesurferRef.current = WaveSurfer.create({
        container: waveformContainerRef.current,
        waveColor: "#888",
        progressColor: "#4ade80",
        height: 60,
      });
    }
  }, []);

  return (
    <div className="grid grid-cols-2 gap-4 p-6 min-h-screen bg-black text-white">
      <Card className="bg-zinc-900 border border-zinc-800">
        <CardContent className="p-2">
          <MonacoEditor
            height="70vh"
            defaultLanguage="javascript"
            theme="vs-dark"
            value={code}
            onChange={(value) => setCode(value || "")}
          />
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center">
        <CardContent className="p-4 w-full text-center">
          <h2 className="text-xl font-semibold mb-2">🎶 Gangsta Sound Lab</h2>
          <div ref={waveformContainerRef} className="w-full mb-4" />
          <Button
            onClick={handlePlay}
            className="bg-green-500 hover:bg-green-600 text-black font-bold"
          >
            {isPlaying ? "Stop" : "Play Beat"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
