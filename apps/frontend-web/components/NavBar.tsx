"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const scrollY = useMotionValue(0);

  // Detect scroll position for dynamic glow intensity
  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      scrollY.set(y);
      setScrolled(y > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrollY]);

  // Transform scroll position into glow intensity (0 → 1)
  const glowIntensity = useTransform(scrollY, [0, 800], [0.3, 1]);

  // Map intensity into text-shadow glow
  const glowShadow = useTransform(
    glowIntensity,
    (i) => `0 0 ${10 + i * 30}px rgba(0,255,255,${0.3 + i * 0.5}), 0 0 ${20 + i * 50}px rgba(0,180,255,${0.2 + i * 0.5})`
  );

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className={`fixed top-0 left-0 w-full z-50 backdrop-blur-md transition-all duration-500 ${
        scrolled
          ? "bg-black/60 border-b border-cyan-400/20 shadow-[0_0_30px_rgba(0,255,255,0.1)]"
          : "bg-transparent border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="text-2xl font-orbitron tracking-wider text-tron-cyan">
          <motion.span
            style={{ textShadow: glowShadow }}
            transition={{ duration: 0.3 }}
          >
            GANGSTA AI
          </motion.span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-10 text-gray-300">
          {[
            { label: "Home", href: "/" },
            { label: "Features", href: "#features" },
            { label: "Intelligence", href: "#intelligence" },
            { label: "Network", href: "#join" },
          ].map((link) => (
            <motion.div
              key={link.label}
              whileHover={{
                scale: 1.08,
                color: "#00ffff",
                textShadow: "0 0 8px #00ffff, 0 0 20px #00ffff",
              }}
              transition={{ type: "spring", stiffness: 250, damping: 12 }}
            >
              <Link href={link.href}>{link.label}</Link>
            </motion.div>
          ))}

          <motion.button
            whileHover={{
              scale: 1.05,
              boxShadow: "0 0 25px rgba(0,255,255,0.4)",
            }}
            transition={{ type: "spring", stiffness: 250, damping: 15 }}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-orbitron px-6 py-2 rounded-full text-sm shadow-tronGlow"
          >
            Access Console
          </motion.button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-gray-200"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-black/80 backdrop-blur-xl text-center overflow-hidden"
          >
            <div className="flex flex-col gap-6 py-8 text-gray-300">
              {[
                { label: "Home", href: "/" },
                { label: "Features", href: "#features" },
                { label: "Intelligence", href: "#intelligence" },
                { label: "Network", href: "#join" },
              ].map((link) => (
                <motion.div
                  key={link.label}
                  whileHover={{
                    scale: 1.1,
                    color: "#00ffff",
                    textShadow: "0 0 8px #00ffff",
                  }}
                >
                  <Link href={link.href} onClick={() => setIsOpen(false)}>
                    {link.label}
                  </Link>
                </motion.div>
              ))}

              <motion.button
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 0 25px rgba(0,255,255,0.4)",
                }}
                transition={{ type: "spring", stiffness: 250, damping: 15 }}
                className="mx-auto bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-orbitron px-6 py-2 rounded-full text-sm shadow-tronGlow"
              >
                Access Console
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
