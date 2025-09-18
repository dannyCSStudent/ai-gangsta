'use client'

import React, { useState, useEffect } from 'react'
import { supabase, Session } from '@repo/supabase'

/**
 * Interface for the analysis result from the API.
 */
interface AnalysisResult {
  scan_id: string
  truth_summary: string
  score: number
  mismatch_reason: string
  entities: {
    persons: string[]
    organizations: string[]
    locations: string[]
  }
}

/**
 * Interface for a saved analysis item in Supabase.
 */
interface SavedAnalysis {
  id: number
  created_at: string
  content: string
  summary: string
  score: number
  mismatch_reason: string
  entities: {
    persons: string[]
    organizations: string[]
    locations: string[]
  }
}

const getScoreColor = (score: number) => {
  if (score <= 10) return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
  if (score <= 50) return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
  return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
}

const getBaseUrl = () => 'http://localhost:3002'

export default function TextAnalysisPage() {
  const [session, setSession] = useState<Session | null>(null)
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [history, setHistory] = useState<SavedAnalysis[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // ✅ Ensure we always have a session (existing or anonymous)
  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setSession(session)
      } else {
        const { data, error } = await supabase.auth.signInAnonymously()
        if (data?.session) {
          setSession(data.session)
        } else {
          console.error('Anon sign-in failed:', error)
        }
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])
  // Fetch & listen to history
  useEffect(() => {
    if (!session) {
      setHistory([])
      setHistoryLoading(false)
      return
    }

    setHistoryLoading(true)

    const fetchHistory = async () => {
      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .ilike('content', `%${searchQuery}%`)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Failed to fetch history:', error)
        setHistoryLoading(false)
      } else {
        setHistory(data as SavedAnalysis[])
        setHistoryLoading(false)
      }
    }

    fetchHistory()

    // Set up real-time subscription for new data
    const subscription = supabase
      .channel('public:analyses')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'analyses' }, () => {
        fetchHistory()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [session, searchQuery])

  const pollForResults = async (scanId: string) => {
    let attempts = 0;
    const maxAttempts = 20; // Poll for up to 40 seconds
    const pollInterval = 2000; // 2 seconds

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`${getBaseUrl()}/text-scan-results/${scanId}`);

        if (response.ok) {
          const data = await response.json();
          setResult(data as AnalysisResult);
          setLoading(false);
          setShowResult(true);

          // Save the result to Supabase
          const { error } = await supabase
            .from('analyses')
            .insert({
              user_id: session?.user.id,   // ✅ include logged-in user
              content: inputText,
              summary: data.truth_summary,
              score: data.score,
              mismatch_reason: data.mismatch_reason,
              entities: data.entities,
  });


          if (error) {
            console.error("Failed to save analysis:", error);
          }
          return;
        } else if (response.status === 202 || response.status === 404) {
          console.log(`Polling for results... Attempt ${attempts + 1}`);
          await new Promise(resolve => setTimeout(resolve, pollInterval));
        } else {
          const errorData = await response.json();
          throw new Error(errorData.detail || `Server error: ${response.status}`);
        }
      } catch (e: unknown) {
        let message = "An unknown error occurred.";
        if (e instanceof Error) {
          message = e.message;
        }
        console.error("Polling failed:", e);
        setError(`Analysis failed: ${message}`);
        setLoading(false);
        setShowResult(true);
        return;
      }
      attempts++;
    }

    setError("Analysis timed out. Please try again.");
    setLoading(false);
    setShowResult(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputText) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setShowResult(false);
    
    const newScanId = crypto.randomUUID();

    try {
      const response = await fetch(`${getBaseUrl()}/analyze-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText, scan_id: newScanId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || `Server error: ${response.status}`);
      }

      pollForResults(newScanId);

    } catch (e: unknown) {
      let message = "An unknown error occurred.";
      if (e instanceof Error) {
        message = e.message;
      }
      console.error("Analysis failed:", e);
      setError(`Analysis failed: ${message}`);
      setLoading(false);
      setShowResult(true);
    }
  };

  const handleReset = () => {
    setInputText('');
    setResult(null);
    setError(null);
    setShowResult(false);
  };

  const handleHistoryItemClick = (analysis: SavedAnalysis) => {
    setInputText(analysis.content);
    setResult({
      scan_id: analysis.id.toString(),
      truth_summary: analysis.summary,
      score: analysis.score,
      mismatch_reason: analysis.mismatch_reason,
      entities: analysis.entities,
    });
    setShowResult(true);
  };

  const getEntitiesDisplay = () => {
    if (!result?.entities) return 'None found.';

    const entities = result.entities;
    const parts = [];

    if (entities.persons?.length > 0) parts.push(`People: ${entities.persons.join(', ')}`);
    if (entities.organizations?.length > 0) parts.push(`Organizations: ${entities.organizations.join(', ')}`);
    if (entities.locations?.length > 0) parts.push(`Locations: ${entities.locations.join(', ')}`);
    
    return parts.length > 0 ? parts.join('\n') : 'None found.';
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen items-start p-4 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
      <div className="w-full lg:w-2/3 max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl p-6 sm:p-8 shadow-xl border border-zinc-100 dark:border-zinc-800 transition-all duration-300 transform scale-100 opacity-100 lg:mr-4 mb-4 lg:mb-0">
        <h1 className="text-3xl font-bold text-center mb-6">Text Truth Scanner</h1>
        
        {!showResult ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label htmlFor="inputText" className="block text-sm font-medium">
              Enter text or paste a news article summary to analyze
            </label>
            <textarea
              id="inputText"
              name="inputText"
              rows={8}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full resize-y rounded-lg border-2 border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 p-3 text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
              placeholder="Paste your text here..."
            />
            <button
              type="submit"
              className="w-full flex items-center justify-center space-x-2 rounded-lg bg-blue-600 px-4 py-3 text-white font-semibold shadow-md transition-all duration-300 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 dark:disabled:bg-blue-800"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center space-x-2">
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Analyzing...</span>
                </span>
              ) : (
                <span>Analyze Text</span>
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold mb-4 text-center">Analysis Results</h2>
            {error ? (
              <p className="text-red-500 text-center">{error}</p>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
                  <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg shadow-sm">
                    <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Score</p>
                    <div className={`mt-1 inline-block px-3 py-1 rounded-full text-lg font-bold ${getScoreColor(result?.score || 0)}`}>
                      {result?.score !== null && result?.score !== undefined ? `${result?.score.toFixed(1)}%` : 'N/A'}
                    </div>
                  </div>
                  <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg shadow-sm">
                    <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Mismatch Reason</p>
                    <p className="text-lg font-bold mt-1 break-words">{result?.mismatch_reason || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg shadow-sm">
                  <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Summary</p>
                  <p className="mt-1 break-words">{result?.truth_summary || 'N/A'}</p>
                </div>

                <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg shadow-sm">
                  <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Entities</p>
                  <p className="mt-1 whitespace-pre-wrap">{getEntitiesDisplay()}</p>
                </div>
              </div>
            )}
            <button
              onClick={handleReset}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white font-semibold shadow-md transition-all duration-300 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Analyze Another Text
            </button>
          </div>
        )}
      </div>

      <div className="w-full lg:w-1/3 max-w-sm bg-white dark:bg-zinc-900 rounded-2xl p-6 sm:p-8 shadow-xl border border-zinc-100 dark:border-zinc-800 mt-4 lg:mt-0">
        <h2 className="text-2xl font-bold text-center mb-4">Analysis History</h2>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border-2 border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 p-3 text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
          />
        </div>
        {historyLoading ? (
          <div className="flex justify-center items-center">
            <div className="h-6 w-6 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-2 text-zinc-500">Loading history...</span>
          </div>
        ) : history.length === 0 ? (
          <p className="text-center text-zinc-500 italic">No history found. Start by analyzing some text!</p>
        ) : (
          <div className="space-y-4 max-h-[calc(100vh-12rem)] overflow-y-auto pr-2">
            {history.map((item) => (
              <div
                key={item.id}
                onClick={() => handleHistoryItemClick(item)}
                className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg shadow-sm cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition duration-200"
              >
                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 truncate">
                  {item.content.substring(0, 50)}...
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Analyzed on: {new Date(item.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
