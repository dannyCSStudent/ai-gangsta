"use client";
import { useEffect, useRef } from "react";
import WaveSurfer, { WaveSurferOptions } from "wavesurfer.js";

export function BeatVisualizer({ isPlaying }: { isPlaying: boolean }) {
  const waveRef = useRef<HTMLDivElement>(null);
  const ws = useRef<WaveSurfer | null>(null);

  useEffect(() => {
    if (!waveRef.current) return;

    // Clean up any previous instance
    ws.current?.destroy();

    const options: WaveSurferOptions = {
      container: waveRef.current,
      waveColor: "#00ff99",
      progressColor: "#ff0066",
      cursorColor: "#fff",
      barWidth: 2,
      height: 120,
      normalize: true,
      interact: false,
    };

    const instance = WaveSurfer.create(options);
    ws.current = instance;

    instance.load("/audio/beat.mp3").catch((err) => {
      console.error("Error loading audio:", err);
    });

    // Handle responsive redraws safely in v7+
    const handleResize = () => {
      if (ws.current) {
        // Safely re-render by updating renderer size
        ws.current.setOptions({
          ...options,
          height: 120,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      ws.current?.destroy();
      ws.current = null;
    };
  }, []);

  // Handle play/pause
  useEffect(() => {
    const instance = ws.current;
    if (!instance) return;

    if (isPlaying) {
      instance.play().catch((err) => {
        console.warn("Playback start failed:", err);
      });
    } else {
      instance.pause();
    }
  }, [isPlaying]);

  return (
    <div
      ref={waveRef}
      className="rounded-xl overflow-hidden shadow-lg bg-zinc-900"
    />
  );
}
