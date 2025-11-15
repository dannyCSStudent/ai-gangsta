"use client";
import { useEffect, useRef } from "react";

export function RecorderControls({
  isRecording,
  setIsRecording,
}: {
  isRecording: boolean;
  setIsRecording: (val: boolean) => void;
}) {
  const mediaRecorder = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    if (isRecording) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        mediaRecorder.current = new MediaRecorder(stream);
        mediaRecorder.current.start();
        console.log("🎙 Recording started...");
      });
    } else if (mediaRecorder.current) {
      mediaRecorder.current.stop();
      console.log("🛑 Recording stopped");
    }
  }, [isRecording]);

  return (
    <div className="flex justify-center gap-4 mt-4">
      <button
        onClick={() => setIsRecording(!isRecording)}
        className={`px-6 py-3 rounded-full text-white font-semibold transition ${
          isRecording ? "bg-red-500 animate-pulse" : "bg-green-600 hover:bg-green-700"
        }`}
      >
        {isRecording ? "Stop Recording" : "Start Recording"}
      </button>
    </div>
  );
}
