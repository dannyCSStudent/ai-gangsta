'use client'

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ScreenContainer } from '@repo/ui/layout';

/**
 * Interface for a single item in the scan history.
 * Defines the expected data structure for each item fetched from the API.
 */
interface ScanHistoryItem {
  id: string;
  transcript: string;
  author: string;
  confidence: number;
  timestamp: string;
}

/**
 * Renders the scan history page for the web application.
 * It fetches a list of past audio scans and displays them as a scrollable list.
 */
export default function ScanHistoryPage() {
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  /**
   * Defines the base URL for the API, specific to the web environment.
   * This replaces the platform-specific logic from the mobile version.
   */
  const getBaseUrl = () => {
    return "http://localhost:3002";
  };

  /**
   * Fetches scan history data from the backend on component mount.
   */
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${getBaseUrl()}/scan-history`);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        setHistory(data || []);
      } catch (err: unknown) {
        let message = 'Failed to fetch scan history.';
        if (err instanceof Error) {
          message = err.message;
        }
        console.error(err);
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  // Conditional rendering for loading, empty, and error states.
  if (loading) {
    return (
      <ScreenContainer>
        <div className="flex-1 flex justify-center items-center min-h-screen bg-zinc-50 dark:bg-zinc-950">
          <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">Loading history...</p>
        </div>
      </ScreenContainer>
    );
  }

  if (error) {
    return (
      <ScreenContainer>
        <div className="flex-1 flex justify-center items-center min-h-screen bg-zinc-50 dark:bg-zinc-950">
          <p className="text-red-500 text-center px-8">{`Error: ${error}`}</p>
        </div>
      </ScreenContainer>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex-1 flex justify-center items-center min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <p className="text-zinc-500 dark:text-zinc-400 text-center px-8">
          No scans yet. Upload an audio file to start building your history.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold mb-6 text-zinc-900 dark:text-white">Scan History</h1>

      <div className="grid gap-4">
        {history.map((item) => {
          // Determine the color of the confidence score badge based on its value.
          const confidenceColor =
            item.confidence > 0.7
              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
              : item.confidence > 0.4
              ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
              : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';

          return (
            <a
              key={item.id}
              onClick={() => router.push(`/scan-detail/${item.id}`)}
              className="block cursor-pointer bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm transition-transform transform hover:scale-[1.02] hover:shadow-md border border-zinc-100 dark:border-zinc-800"
            >
              <p className="text-zinc-800 dark:text-zinc-100 font-semibold mb-1">{item.author}</p>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-2 line-clamp-2">
                {item.transcript}
              </p>
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  {new Date(item.timestamp).toLocaleString()}
                </p>
                <div className={`px-2 py-1 rounded-full ${confidenceColor}`}>
                  <p className="text-xs font-semibold">
                    {(item.confidence * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
