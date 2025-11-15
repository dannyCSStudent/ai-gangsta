import { ScreenContainer } from '@repo/ui'
import React from "react";
import HeroSection from "@/components/HeroSection";
import FeatureGrid from "@/components/FeatureGrid";
import CredibilityEngine from "@/components/CredibilityEngine";
import IntelligenceFeed from "@/components/IntelligenceFeed";
import JoinNetwork from "@/components/JoinNetwork";

export default function Home() {
  return (
    <ScreenContainer className="items-center justify-center">
      <main className="bg-[#010512] text-white overflow-hidden">
      <HeroSection />
      <FeatureGrid />
      <CredibilityEngine />
      <IntelligenceFeed />
      <JoinNetwork />
    </main>
    </ScreenContainer>
  )
}
