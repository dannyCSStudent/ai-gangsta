'use client'

import React, { useEffect, useState } from 'react';

/**
 * Interface for a single item in the truth scan history.
 * Defines the expected data structure for each item fetched from the API.
 */
interface TruthScanHistoryItem {
  scan_id: string;
  caption: string;
  truth_summary: string;
  score: number;
  mismatch_reason: string;
  entities: {
    persons: string[];
    organizations: string[];
    locations: string[];
    events: string[];
  };
  created_at: string;
}

/**
 * Renders the truth scan history page for the web application.
 * It fetches a list of past post scans and displays them as a scrollable list.
 */
export default function TruthScanHistoryPage() {
  const [history, setHistory] = useState<TruthScanHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Defines the base URL for the API, specific to the web environment.
   */
  const getBaseUrl = () => {
    // This should match your backend service URL in development
    return "http://localhost:3002";
  };

  /**
   * Fetches the truth scan history from the backend on component mount.
   */
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${getBaseUrl()}/post-scans`);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        setHistory(data || []);
      } catch (err: unknown) {
        let message = 'Failed to fetch truth scan history.';
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
      <div className="w-full min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-center items-center">
        <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">Loading history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-center items-center">
        <p className="text-red-500 text-center px-8">{`Error: ${error}`}</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="w-full min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-center items-center">
        <p className="text-zinc-500 dark:text-zinc-400 text-center px-8">
          No scans yet. Upload a post to start building your history.
        </p>
      </div>
    );
  }

  // Utility to determine the color of the score badge
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
    if (score >= 50) return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
    return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold mb-6 text-zinc-900 dark:text-white">Truth Scan History</h1>
      <div className="grid gap-4">
        {history.map((item) => (
          <div
            key={item.scan_id}
            className="block cursor-pointer bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm transition-transform transform hover:scale-[1.02] hover:shadow-md border border-zinc-100 dark:border-zinc-800"
          >
            <div className="flex justify-between items-start mb-2">
              <p className="text-zinc-800 dark:text-zinc-100 font-semibold mb-1 flex-1 pr-2">{item.caption}</p>
              <div className={`px-2 py-1 rounded-full ${getScoreColor(item.score)}`}>
                <p className="text-xs font-semibold">
                  {item.score.toFixed(1)}%
                </p>
              </div>
            </div>
            
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2 line-clamp-2">
              <span className="font-bold">Summary:</span> {item.truth_summary}
            </p>
            
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2 line-clamp-2">
              <span className="font-bold">Reason:</span> {item.mismatch_reason}
            </p>
            
            {item.entities && (
              <div className="mt-4 border-t border-zinc-200 dark:border-zinc-700 pt-4">
                <p className="text-sm font-bold text-zinc-800 dark:text-white mb-2">Entities</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="font-semibold">People:</span> {item.entities.persons.join(', ') || 'None'}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="font-semibold">Organizations:</span> {item.entities.organizations.join(', ') || 'None'}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="font-semibold">Locations:</span> {item.entities.locations.join(', ') || 'None'}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
