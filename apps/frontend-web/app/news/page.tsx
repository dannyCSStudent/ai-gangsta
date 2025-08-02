'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@repo/supabase/supabaseClient';
import { type NewsArticle } from '@repo/supabase/types/types';
import { LuExternalLink } from 'react-icons/lu';

/**
 * Renders the news page for the web application.
 * It fetches news articles from a Supabase table and displays them in a list.
 */
export default function NewsPage() {
  // State to store the fetched news articles.
  const [news, setNews] = useState<NewsArticle[]>([]);
  // State to handle loading and error messages.
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches news data from Supabase on component mount.
   */
  useEffect(() => {
    async function fetchNews() {
      try {
        const { data, error: supabaseError } = await supabase
          .from('smart_news')
          .select('*')
          .order('published_at', { ascending: false });

        if (supabaseError) {
          throw supabaseError;
        }

        if (data) {
          setNews(data as NewsArticle[]);
        }
      } catch (e: unknown) {
        // Handle the error safely by checking its type.
        // The catch block now uses 'unknown' instead of 'any' to satisfy TypeScript strictness.
        let message = 'An unknown error occurred.';
        if (e instanceof Error) {
          message = e.message;
        }
        console.error('Error fetching news:', e);
        setError(message);
      } finally {
        // Set loading to false once the fetch is complete.
        setIsLoading(false);
      }
    }

    fetchNews();
  }, []);

  // Display a loading message while data is being fetched.
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-zinc-50 dark:bg-zinc-950">
        <p className="text-xl text-zinc-500 dark:text-zinc-400">Loading news...</p>
      </div>
    );
  }

  // Display an error message if the fetch failed.
  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-zinc-50 dark:bg-zinc-950">
        <p className="text-xl text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 lg:p-12 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-center mb-8">Latest News</h1>
      {news.length === 0 ? (
        // Display a message if no news articles are found.
        <div className="text-center text-zinc-500 dark:text-zinc-400">
          No news articles found.
        </div>
      ) : (
        // Map over the news array to render each article.
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {news.map((item) => (
            <a
              key={item.id}
              href={item.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col justify-between rounded-3xl p-6 bg-white dark:bg-zinc-900 shadow-xl transition-transform transform hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-blue-500 dark:focus:ring-blue-400"
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">{item.source_name}</span>
                  <LuExternalLink className="h-5 w-5 text-zinc-400 dark:text-zinc-500 group-hover:text-blue-500 transition-colors" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {item.title}
                </h2>
              </div>
              <div className="mt-4 flex flex-col space-y-2">
                <div className="flex flex-wrap items-center space-x-2">
                  <span className="text-xs px-3 py-1 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200">
                    🎯 {item.bias.toUpperCase()}
                  </span>
                  <span className="text-xs px-3 py-1 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200">
                    Trust Score: {item.trust_score}%
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
