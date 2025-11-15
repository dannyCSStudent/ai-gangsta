"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";

const tronGrid = "/assets/tron_grid.png";

export default function JoinNetwork() {
  return (
    <section className="relative bg-black text-white py-32 overflow-hidden">
      {/* Background Layers */}
      <div className="absolute inset-0 opacity-40">
        <Image
          src={tronGrid}
          alt="Tron Grid"
          fill
          className="object-cover"
          priority
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black via-[#001018]/80 to-transparent z-0" />

      {/* Animated Glow Sweep */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 via-cyan-300/20 to-cyan-400/10 mix-blend-screen z-0"
        animate={{ backgroundPositionX: ["0%", "100%"] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        style={{ backgroundSize: "200% 100%" }}
      />

      {/* Content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto px-8">
        <motion.h2
          className="text-4xl md:text-5xl font-orbitron text-tron-cyan mb-6 tron-flicker"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          Join the Network
        </motion.h2>

        <p className="text-gray-300 mb-10">
          Become part of the world’s most intelligent truth infrastructure.
          Stay ahead of manipulation and signal distortion — together, we make
          the information era transparent again.
        </p>

        {/* Glowing Join Button */}
        <motion.button
          whileHover={{
            scale: 1.08,
            boxShadow: "0 0 30px rgba(0,229,255,0.5)",
            textShadow: "0 0 10px #00ffff",
          }}
          transition={{ type: "spring", stiffness: 200, damping: 10 }}
          className="bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-orbitron px-10 py-4 rounded-full text-lg shadow-tronGlow hover:shadow-cyan-500/50"
        >
          Activate Access
        </motion.button>

        {/* Decorative Cyan Ring Animation */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 bottom-20 w-[400px] h-[400px] rounded-full border border-cyan-500/10"
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
      </div>
    </section>
  );
}
