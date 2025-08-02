/**
 * This file contains the shared TypeScript type definitions for the Supabase
 * data models used throughout the application.
 */

// Represents a single news article fetched from the 'smart_news' Supabase table.
export type NewsArticle = {
  id: string;
  created_at: string; // The timestamp when the record was created in the database.
  title: string; // The title of the news article.
  source_name: string; // The name of the news source (e.g., 'BBC News').
  source_url: string; // The URL to the original news article.
  bias: string; // The political bias of the article (e.g., 'LEFT', 'CENTER', 'RIGHT').
  trust_score: number; // A numerical score representing the trustworthiness of the source.
  published_at: string; // The publication date and time of the article.
};

// You can add more types here as your application grows,
// such as types for user profiles, comments, etc.
