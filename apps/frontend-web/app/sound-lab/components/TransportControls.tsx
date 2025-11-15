"use client";
export function TransportControls({
  isPlaying,
  setIsPlaying,
}: {
  isPlaying: boolean;
  setIsPlaying: (val: boolean) => void;
}) {
  return (
    <div className="flex justify-center gap-6">
      <button
        onClick={() => setIsPlaying(!isPlaying)}
        className="bg-amber-500 text-black px-8 py-3 rounded-full font-semibold hover:bg-amber-400 transition"
      >
        {isPlaying ? "⏸ Pause" : "▶ Play"}
      </button>
    </div>
  );
}
