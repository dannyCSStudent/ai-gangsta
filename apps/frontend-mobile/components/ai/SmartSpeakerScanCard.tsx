import React from "react";
import { ScrollView } from "react-native";
import SmartSpeakerScanCard from "../ai/SmartSpeakerScanCard";

export default function SmartScanScreen() {
  return (
    <ScrollView className="flex-1 bg-gray-100 p-4">
      <SmartSpeakerScanCard />
    </ScrollView>
  );
}
