import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Platform } from "react-native";
import { Pressable } from "react-native-gesture-handler";

const getBaseUrl = () => {
  if (Platform.OS === "android") return "http://10.0.2.2:3002";
  if (Platform.OS === "web") return "http://localhost:3002";
  return "http://localhost:3002";
};

interface ScanDetail {
  id: string;
  transcript: string;
  author: string;
  confidence: number;
  raw_scores?: Record<string, number>;
  timestamp: string;
}

export default function ScanDetailScreen() {
  const { id } = useLocalSearchParams();
  const [scan, setScan] = useState<ScanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`${getBaseUrl()}/scan-history/${id}`);
        const data = await res.json();
        setScan(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#4B9CD3" />
        <Text className="mt-2 text-gray-600">Loading scan details...</Text>
      </View>
    );
  }

  if (!scan) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-gray-500">Scan not found.</Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-4 px-4 py-2 bg-blue-600 rounded-xl"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const confidenceColor =
    scan.confidence > 0.7
      ? "text-green-700"
      : scan.confidence > 0.4
      ? "text-yellow-700"
      : "text-red-700";

  return (
    <ScrollView className="flex-1 bg-gray-50 p-4">
      <View className="bg-white rounded-2xl p-6 shadow-md">
        <Text className="text-2xl font-bold text-gray-900 mb-1">
          {scan.author}
        </Text>
        <Text className={`text-lg font-semibold mb-3 ${confidenceColor}`}>
          Confidence: {(scan.confidence * 100).toFixed(1)}%
        </Text>
        <Text className="text-sm text-gray-400 mb-4">
          {new Date(scan.timestamp).toLocaleString()}
        </Text>

        <Text className="text-gray-800 leading-6 mb-4">{scan.transcript}</Text>

        {scan.raw_scores && (
          <View className="mt-4 border-t border-gray-200 pt-4">
            <Text className="text-gray-600 font-semibold mb-2">
              Author Match Scores
            </Text>
            {Object.entries(scan.raw_scores).map(([author, score]) => (
              <Text key={author} className="text-gray-700">
                {author}: {(score * 100).toFixed(1)}%
              </Text>
            ))}
          </View>
        )}

        <Pressable
          onPress={() => router.back()}
          className="mt-6 px-4 py-2 bg-blue-600 rounded-xl self-start"
        >
          <Text className="text-white font-semibold">← Back to History</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
