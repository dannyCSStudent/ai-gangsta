'use client'

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

/**
 * Interface for the detailed scan information.
 * It defines the data structure for a single scan item fetched from the backend.
 */
interface ScanDetail {
  id: string;
  transcript: string;
  author: string;
  confidence: number;
  raw_scores?: Record<string, number>;
  timestamp: string;
}

/**
 * Renders the scan details page for the web application.
 * It fetches the details of a specific scan based on the ID from the URL and displays them.
 */
export default function ScanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [scan, setScan] = useState<ScanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  /**
   * Defines the base URL for the API, specific to the web environment.
   */
  const getBaseUrl = () => {
    return 'http://localhost:3002';
  };

  /**
   * Fetches the detailed scan data from the backend based on the ID from the URL parameters.
   */
  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) {
        setError('No scan ID provided.');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${getBaseUrl()}/scan-history/${id}`);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        setScan(data);
      } catch (e: unknown) {
        let message = 'Failed to fetch scan details.';
        if (e instanceof Error) {
          message = e.message;
        }
        console.error('Error fetching scan details:', e);
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  // Conditional rendering for loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">Loading scan details...</p>
      </div>
    );
  }

  // Conditional rendering for error state
  if (error) {
    return (
      <div className="flex-1 flex justify-center items-center min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <p className="text-red-500 text-center px-8">{`Error: ${error}`}</p>
      </div>
    );
  }

  // Conditional rendering for scan not found
  if (!scan) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <p className="text-zinc-500 dark:text-zinc-400">Scan not found.</p>
        <button
          onClick={() => router.back()}
          className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Logic to determine the color of the confidence text
  const confidenceColor =
    scan.confidence > 0.7
      ? 'text-green-700'
      : scan.confidence > 0.4
      ? 'text-yellow-700'
      : 'text-red-700';

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 bg-zinc-50 dark:bg-zinc-950 flex justify-center">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-md w-full max-w-2xl">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">
          {scan.author}
        </h1>
        <p className={`text-lg font-semibold mb-3 ${confidenceColor}`}>
          Confidence: {(scan.confidence * 100).toFixed(1)}%
        </p>
        <p className="text-sm text-zinc-400 dark:text-zinc-500 mb-4">
          {new Date(scan.timestamp).toLocaleString()}
        </p>

        <p className="text-zinc-800 dark:text-zinc-200 leading-relaxed mb-4">
          {scan.transcript}
        </p>

        {scan.raw_scores && (
          <div className="mt-4 border-t border-zinc-200 dark:border-zinc-700 pt-4">
            <h2 className="text-zinc-600 dark:text-zinc-400 font-semibold mb-2">
              Author Match Scores
            </h2>
            {Object.entries(scan.raw_scores).map(([author, score]) => (
              <p key={author} className="text-zinc-700 dark:text-zinc-300">
                {author}: {(score * 100).toFixed(1)}%
              </p>
            ))}
          </div>
        )}

        <button
          onClick={() => router.back()}
          className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
        >
          ← Back to History
        </button>
      </div>
    </div>
  );
}
