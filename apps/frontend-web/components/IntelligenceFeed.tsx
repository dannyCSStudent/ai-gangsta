"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from '@repo/supabase/supabaseClient';
import Image from "next/image";
const tronGrid = "/assets/tron_grid.png";

interface SmartNewsItem {
  id: string;
  title: string;
  summary: string;
  bias: string;
  source: string;
  published_at: string;
  trust_score?: number;
}

const biasColors: Record<string, string> = {
  left: "bg-red-500/30 border-red-400/50 text-red-300",
  right: "bg-blue-500/30 border-blue-400/50 text-blue-300",
  center: "bg-green-500/30 border-green-400/50 text-green-300",
  unknown: "bg-gray-600/30 border-gray-500/50 text-gray-300",
};

export default function IntelligenceFeed() {
  const [news, setNews] = useState<SmartNewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNews() {
      const { data, error } = await supabase
        .from("smart_news")
        .select("*")
        .order("published_at", { ascending: false })
        .limit(9);

      if (error) console.error("Error fetching news:", error);
      else setNews(data || []);
      setLoading(false);
    }

    fetchNews();

    // Optional: real-time updates
    const channel = supabase
      .channel("realtime:smart_news")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "smart_news" },
        (payload) => {
          setNews((prev) => [payload.new as SmartNewsItem, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <section className="relative bg-black text-white py-24 overflow-hidden">
      <div className="absolute inset-0 opacity-40">
        <Image
          src={tronGrid}
          alt="Tron Grid"
          fill
          className="object-cover"
          priority
        />
      </div>
      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-orbitron text-tron-cyan mb-10 tron-flicker">
          Gangsta Intelligence Feed
        </h2>
        {loading ? (
          <p className="text-gray-400">Loading real-time intelligence...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {news.map((item) => (
              <motion.div
                key={item.id}
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 0 40px rgba(0,229,255,0.5)",
                }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className={`border border-cyan-500/30 bg-gradient-to-b from-[#001018] to-black p-6 rounded-2xl text-left
                ${item.bias === "left"
                  ? "animate-pulse-red"
                  : item.bias === "right"
                  ? "animate-pulse-blue"
                  : item.bias === "center"
                  ? "animate-pulse-green"
                  : "animate-pulse-gray"
            }`}
      >
  <div
    className={`inline-block px-3 py-1 mb-3 rounded-full text-xs uppercase border ${biasColors[item.bias] || biasColors.unknown}`}
  >
    {item.bias || "unknown"}
  </div>

  <h3 className="font-orbitron text-xl text-cyan-300 mb-2">
    {item.title}
  </h3>

  <p className="text-gray-400 text-sm mb-4">{item.summary}</p>

  <div className="flex justify-between text-xs text-gray-500">
    <span>{item.source}</span>
    <span>
      {new Date(item.published_at).toLocaleDateString("en-US")}
    </span>
  </div>
</motion.div>

            ))}
          </div>
        )}
      </div>
    </section>
  );
}
