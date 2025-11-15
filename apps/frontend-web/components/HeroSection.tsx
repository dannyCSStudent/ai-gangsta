"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "../../../packages/ui/src/components/ui/button"; 
import { ArrowRight } from "lucide-react"; 
import Image from "next/image";
const tronGrid = "/assets/tron_grid.png";


export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center items-center text-center overflow-hidden bg-[#010512]">
      {/* Tron Grid Background */}
      <div className="absolute inset-0 opacity-30">
        <Image
          src={tronGrid}
          alt="Tron Grid"
          fill
          className="w-full h-full object-cover"
          priority
        />
      </div>

      {/* Glow Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#00ffff10] to-[#010512]" />

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
        className="relative z-10 max-w-3xl px-6"
      >
        <motion.h1
          className="font-orbitron text-6xl md:text-7xl font-bold text-[#00E5FF] drop-shadow-[0_0_15px_#00E5FF]"
          initial={{ textShadow: "0 0 0px #00E5FF" }}
          animate={{
            textShadow: [
              "0 0 10px #00E5FF",
              "0 0 25px #00E5FF",
              "0 0 10px #00E5FF",
            ],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          GANGSTA AI
        </motion.h1>

        <p className="text-[#B3EFFF] mt-6 text-lg md:text-xl leading-relaxed font-inter">
          Truth. Intelligence. Power.  
          <br /> The future of news is self-aware.
        </p>

        {/* Neon Button */}
        <motion.div
          whileHover={{ scale: 1.05, boxShadow: "0 0 25px #00FFFF" }}
          className="mt-10 inline-block"
        >
          <Button
            size="lg"
            className="relative px-8 py-4 text-lg font-orbitron tracking-wide bg-[#00E5FF] text-black rounded-xl shadow-[0_0_15px_#00E5FF] hover:shadow-[0_0_30px_#00E5FF] transition-all duration-300"
          >
            Enter the Network
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </motion.div>
      </motion.div>

      {/* Bottom Glow Bar */}
      <div className="absolute bottom-0 left-0 w-full h-[120px] bg-gradient-to-t from-[#00FFFF20] to-transparent blur-3xl" />
    </section>
  );
}
