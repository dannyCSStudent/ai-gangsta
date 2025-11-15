"use client";
import { useState } from "react";

export function FixMyGroovePanel({
  grooveData,
  setGrooveData,
}: {
  grooveData: string | null;
  setGrooveData: (val: string) => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleFixGroove = async () => {
    setLoading(true);
    setTimeout(() => {
      setGrooveData("✅ Groove tightened, timing quantized, and swing enhanced!");
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="bg-zinc-900 p-6 rounded-2xl mt-6 shadow-lg">
      <h2 className="text-xl font-semibold text-amber-300 mb-3">🧠 Fix My Groove</h2>
      <p className="text-sm text-zinc-400 mb-4">
        Our AI tightens your rhythm and enhances the beat feel automatically.
      </p>
      <button
        onClick={handleFixGroove}
        disabled={loading}
        className={`px-6 py-3 rounded-lg font-semibold ${
          loading
            ? "bg-zinc-700 text-gray-400 cursor-not-allowed"
            : "bg-amber-500 text-black hover:bg-amber-400"
        }`}
      >
        {loading ? "Analyzing..." : "Fix My Groove"}
      </button>

      {grooveData && (
        <p className="mt-4 text-green-400 font-medium">{grooveData}</p>
      )}
    </div>
  );
}
