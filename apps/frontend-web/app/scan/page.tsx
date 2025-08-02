'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ScreenContainer } from '@repo/ui/';
/**
 * Renders the Scan page for the web application.
 * This component allows users to upload an audio file for real-time transcription and speaker identification.
 * It uses a streaming API endpoint to receive transcript data and speaker information as it becomes available.
 */
export default function ScanPage() {
  const router = useRouter();
  const [transcript, setTranscript] = useState('');
  const [speaker, setSpeaker] = useState('');
  const [confidence, setConfidence] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Defines the base URL for the API, specific to the web environment.
   * This replaces the platform-specific logic from the mobile version.
   */
  const getBaseUrl = () => {
    return 'http://localhost:3002';
  };

  /**
   * Handles the file selection event from the file input element.
   * @param event The change event from the file input.
   */
  const pickAudio = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadAudio(file);
    }
  };

  /**
   * Uploads the selected audio file to the backend for analysis.
   * It uses a streaming API to receive data in real time.
   * @param file The audio file to upload.
   */
  const uploadAudio = async (file: File) => {
    setLoading(true);
    setError(null);
    setTranscript('Analyzing speaker in real time...');
    setSpeaker('');
    setConfidence(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        `${getBaseUrl()}/generate_transcription/stream`,
        {
          method: 'POST',
          body: formData,
          headers: {
            Accept: 'text/event-stream',
          },
        }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }

      // Handle SSE streaming data.
      const reader = response.body!.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const event of events) {
          if (event.startsWith('data:')) {
            const data = event.replace(/^data:\s*/, '').trim();

            if (data === '[DONE]') {
              setLoading(false);
              return;
            }

            if (data.startsWith('Quick Transcript:')) {
              setTranscript(data.replace('Quick Transcript:', '').trim());
            } else if (data.startsWith('Author:')) {
              const match = data.match(/Author:\s(.+)\s\(([\d.]+)%\)/);
              if (match) {
                setSpeaker(match[1]);
                setConfidence(parseFloat(match[2]) / 100);
              }
            } else {
              setTranscript((prev) => prev + ' ' + data);
            }
          }
        }
      }
    } catch (e: unknown) {
      // Safely handle errors using a type guard.
      let message = 'Upload failed or server error.';
      if (e instanceof Error) {
        message = e.message;
      }
      console.error(e);
      setError(message);
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-zinc-50 dark:bg-zinc-950">
        {/* Main Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-xl w-full max-w-md">
          <h1 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-white">
            Smart Speaker Scan
          </h1>

          {loading ? (
            <div className="flex flex-col items-center">
              <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-zinc-700 dark:text-zinc-200 animate-pulse">
                {transcript}
              </p>
            </div>
          ) : (
            <>
              {error ? (
                <p className="text-red-500 mb-4">{error}</p>
              ) : transcript ? (
                <>
                  <p className="text-zinc-800 dark:text-zinc-100 mt-2">{transcript}</p>
                  {speaker && (
                    <p className="mt-4 font-semibold text-blue-600 dark:text-blue-400 text-lg">
                      🎤 {speaker} ({Math.round((confidence ?? 0) * 100)}%)
                    </p>
                  )}
                </>
              ) : (
                <p className="text-zinc-500 dark:text-zinc-400 mb-4">
                  Upload an audio file to analyze the speaker.
                </p>
              )}
            </>
          )}

          {/* File Input and Button */}
          <div className="mt-6">
            <label htmlFor="audio-upload" className="block w-full">
              <button
                onClick={() => document.getElementById('audio-upload')?.click()}
                className={`w-full py-3 px-6 rounded-xl transition-colors duration-300 ${
                  loading ? 'bg-blue-300 dark:bg-blue-700 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
                }`}
                disabled={loading}
              >
                <p className="text-white text-center font-semibold text-base">
                  {loading ? 'Analyzing...' : 'Upload Audio'}
                </p>
              </button>
            </label>
            <input
              id="audio-upload"
              type="file"
              accept="audio/*"
              onChange={pickAudio}
              className="hidden"
              disabled={loading}
            />
          </div>
        </div>

        {/* Floating History Button */}
        <button
          onClick={() => router.push('/scan-history')}
          className="fixed bottom-8 right-8 bg-blue-600 dark:bg-blue-500 rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition-transform transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-500 dark:focus:ring-blue-400"
        >
          <span className="text-white text-2xl" role="img" aria-label="History">
            📜
          </span>
        </button>
      </div>
    </ScreenContainer>
  );
}
