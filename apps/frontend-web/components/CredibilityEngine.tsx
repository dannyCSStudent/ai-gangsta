"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Activity, Zap } from "lucide-react";
import Image from "next/image";
const tronGrid = "/assets/tron_grid.png";

export default function CredibilityEngine() {
  return (
    <section className="relative bg-black text-white py-32 overflow-hidden">
      {/* Background Grid Glow */}
      <div className="absolute inset-0 opacity-30">
        <Image
          src={tronGrid}
          alt="Tron Grid"
          fill
          className="w-full h-full object-cover"
          priority
        />
      </div>      {/* Animated Glow Lines */}
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/20 via-transparent to-black blur-2xl z-0" />      
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-cyan-300/20 to-cyan-500/10 mix-blend-screen z-0"
        animate={{ backgroundPositionX: ["0%", "100%"] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        style={{ backgroundSize: "200% 100%" }}
      />


      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-8 text-center">
        <h2 className="text-4xl font-orbitron text-cyan-400 mb-6">
          Credibility Engine
        </h2>    
        <p className="text-cyan-200 max-w-2xl mx-auto mb-16 leading-relaxed">
          Gangsta AI’s core engine continuously evaluates every piece of information across the network — tracing origins, weighting source trust, and filtering manipulation patterns in real-time.
        </p>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-10">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="border border-cyan-400/30 rounded-2xl p-8 bg-gradient-to-b from-[#001018] to-[#000000] hover:border-cyan-300/60 hover:shadow-[0_0_30px_#00ffffaa] transition-all duration-300"
          >

            <ShieldCheck className="text-cyan-400 w-12 h-12 mx-auto mb-4" />
            <h3 className="font-orbitron text-lg text-tron-glow drop-shadow-[0_0_10px_#00ffff] mb-2">
              Source Integrity
            </h3>

            <p className="text-gray-400 text-sm">
              Evaluates source reliability and historical truth alignment.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(0,229,255,0.4)" }}
            className="border border-cyan-500/20 rounded-2xl p-8 bg-gradient-to-b from-[#001018] to-[#000000]"
          >
            <Activity className="text-cyan-400 w-12 h-12 mx-auto mb-4" />
            <h3 className="font-orbitron text-lg mb-2">Signal Analysis</h3>
            <p className="text-gray-400 text-sm">
              Detects coordinated narratives and synthetic amplification.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(0,229,255,0.4)" }}
            className="border border-cyan-500/20 rounded-2xl p-8 bg-gradient-to-b from-[#001018] to-[#000000]"
          >
            <Zap className="text-cyan-400 w-12 h-12 mx-auto mb-4" />
            <h3 className="font-orbitron text-lg mb-2">Trust Index</h3>
            <p className="text-gray-400 text-sm">
              Assigns dynamic credibility scores to content and publishers.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
