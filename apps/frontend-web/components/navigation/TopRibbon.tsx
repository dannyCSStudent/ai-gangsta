"use client";

import { useEffect, useState } from "react";
import {
  LuScanEye,
  LuCpu,
  LuWifi,
  LuActivity,
  LuShieldCheck,
} from "react-icons/lu";

export default function TopRibbon() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [messageIndex, setMessageIndex] = useState(0);

  const hologramMessages = [
    "Initializing global parallax matrix…",
    "Cross-referencing narrative cohesion fields…",
    "Connecting to off-world intel relay…",
    "Decrypting high-level info signals…",
    "Scanning multi-spectrum bias layers…",
    "Reconstructing hidden propaganda vectors…",
    "Activating autonomous truth harmonizer…",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex(i => (i + 1) % hologramMessages.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [hologramMessages.length]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) - 0.5,
        y: (e.clientY / window.innerHeight) - 0.5
      });
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  return (
    <div
      className="
        w-full relative z-50 h-24 
        overflow-hidden border-b border-tron-cyan/20 
        bg-tron-dark/40 backdrop-blur-3xl
      "
      style={{
        transform: `perspective(1200px)
                    rotateX(${mousePos.y * 6}deg)
                    rotateY(${-mousePos.x * 6}deg)`
      }}
    >

      {/* ——— Parallax Layer 1: Hologram Grid ——— */}
      <div
        className="absolute inset-0 opacity-[0.15] hologram-grid pointer-events-none"
        style={{
          transform: `translateX(${mousePos.x * 20}px)
                      translateY(${mousePos.y * 20}px)`
        }}
      />

      {/* ——— Parallax Layer 2: Light Sweep ——— */}
      <div className="absolute inset-0 hologram-sweep pointer-events-none" />

      {/* ——— Parallax Layer 3: Particles ——— */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="holo-particle"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* ——— Ribbon Content ——— */}
      <div className="relative h-full flex items-center justify-between px-8">

        {/* LEFT — Hologram Icon Core */}
        <div
          className="flex items-center gap-4"
          style={{
            transform: `translateX(${mousePos.x * 10}px)
                        translateY(${mousePos.y * 10}px)`
          }}
        >
          <div className="relative">
            <LuScanEye className="text-tron-cyan text-4xl animate-rotateSlow" />

            {/* hologram ring */}
            <div className="
              absolute inset-0 rounded-full
              border border-tron-cyan/40
              animate-holoRing
            "></div>
          </div>

          <div className="flex flex-col">
            <span className="text-cyan-400 font-bold text-lg tracking-wider hologram-text">
              GANGSTA INTELLIGENCE DECK
            </span>
            <span className="text-xs text-tron-green/80 tracking-wider">
              PARALLAX MODE: ONLINE
            </span>
          </div>
        </div>

        {/* CENTER — Narrative Scanner Message */}
        <div className="w-[40%] overflow-hidden whitespace-nowrap">
          <div
            key={messageIndex}
            className="text-tron-green text-sm hologram-text animate-slideLeftSlow inline-block min-w-full"
          >
            {hologramMessages[messageIndex]}
          </div>
        </div>

        {/* RIGHT — Sensors */}
        <div
          className="flex items-center gap-10"
          style={{
            transform: `translateX(${mousePos.x * -10}px)
                        translateY(${mousePos.y * -10}px)`
          }}
        >
          {/* Trust Meter */}
          <div className="flex items-center gap-3">
            <LuShieldCheck className="text-tron-green text-xl" />
            <div className="relative w-32 h-2 bg-tron-green/20 rounded-full overflow-hidden">
              <div className="absolute inset-0 hologram-wave" />
            </div>
          </div>

          {/* Activity */}
          <div className="flex items-center gap-2">
            <LuActivity className="text-tron-yellow text-xl animate-pulse" />
            <span className="text-tron-yellow text-sm hologram-text">
              Flux Stable
            </span>
          </div>

          {/* CPU Node */}
          <div className="flex items-center gap-2">
            <LuCpu className="text-tron-purple text-2xl animate-spinSlow" />
            <span className="text-tron-purple text-sm">Neural-Core</span>
          </div>

          <LuWifi className="text-tron-cyan text-xl animate-blinkSlow" />
        </div>
      </div>
    </div>
  );
}
