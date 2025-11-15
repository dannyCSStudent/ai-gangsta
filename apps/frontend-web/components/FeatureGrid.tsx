"use client";

import React from "react";
import { motion } from "framer-motion";
import { Brain, Target, Fingerprint } from "lucide-react";
import Image from "next/image";
const tronGrid = "/assets/tron_grid.png";

export default function FeatureGrid() {
  const features = [
    {
      icon: <Brain size={40} />,
      title: "Truth Intelligence",
      desc: "Autonomous AI that scans sources, detects manipulation, and rebuilds trust in information.",
    },
    {
      icon: <Target size={40} />,
      title: "Bias Detection",
      desc: "Identifies political, ideological, or institutional bias using advanced linguistic analysis.",
    },
    {
      icon: <Fingerprint size={40} />,
      title: "Author Fingerprinting",
      desc: "Recognizes patterns in speech or writing to infer likely authorship or influence networks.",
    },
  ];

  return (
    <section className="py-32 bg-black text-white relative z-10 px-8 sm:px-8"><div className="absolute inset-0 opacity-30">
            <Image
              src={tronGrid}
              alt="Tron Grid"
              fill
              className="w-full h-full object-cover"
              priority
            />
          </div>
      <div className="gap-y-14 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-8 max-w-7xl mx-auto">

        {features.map((f, i) => (
          <motion.div
            key={i}
            className="relative border border-cyan-500/20 rounded-2xl p-8 bg-gradient-to-b from-[#001018] to-[#000000] shadow-[0_0_30px_#00e5ff10] overflow-hidden group"
            whileHover={{
              scale: 1.03,
              boxShadow: "0 0 40px rgba(0, 229, 255, 0.4)",
            }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            {/* Glow animation layer */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-cyan-500/10 opacity-0 group-hover:opacity-100"
              animate={{
                backgroundPositionX: ["0%", "100%"],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="text-cyan-400 mb-4">{f.icon}</div>
              <h3 className="font-orbitron text-xl mb-2">{f.title}</h3>
              <p className="text-sm text-gray-300">{f.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

    </section>
  );
}
