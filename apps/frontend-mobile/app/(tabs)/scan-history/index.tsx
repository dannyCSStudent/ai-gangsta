import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Platform } from "react-native";

const getBaseUrl = () => {
  if (Platform.OS === "android") return "http://10.0.2.2:3002";
  if (Platform.OS === "web") return "http://localhost:3002";
  return "http://localhost:3002"; // Adjust if using device
};

interface ScanHistoryItem {
  id: string;
  transcript: string;
  author: string;
  confidence: number;
  timestamp: string;
}

export default function ScanHistoryScreen() {
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${getBaseUrl()}/scan-history`);
        const data = await res.json();
        setHistory(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const renderItem = ({ item }: { item: ScanHistoryItem }) => {
    const confidenceColor =
      item.confidence > 0.7
        ? "bg-green-100 text-green-800"
        : item.confidence > 0.4
        ? "bg-yellow-100 text-yellow-800"
        : "bg-red-100 text-red-800";

    return (
      <TouchableOpacity
        onPress={() => router.push(`/scan-detail/${item.id}`)}
        className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100"
      >
        <Text className="text-gray-800 font-semibold mb-1">{item.author}</Text>
        <Text
          className="text-gray-500 text-sm mb-2"
          numberOfLines={2}
        >
          {item.transcript}
        </Text>
        <View className="flex-row justify-between items-center">
          <Text className="text-xs text-gray-400">
            {new Date(item.timestamp).toLocaleString()}
          </Text>
          <View className={`px-2 py-1 rounded-full ${confidenceColor}`}>
            <Text className="text-xs font-semibold">
              {(item.confidence * 100).toFixed(1)}%
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-gray-50 p-4">
      <Text className="text-2xl font-bold mb-4 text-gray-900">Scan History</Text>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#4B9CD3" />
          <Text className="mt-2 text-gray-600">Loading history...</Text>
        </View>
      ) : history.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-500 text-center px-8">
            No scans yet. Upload an audio file to start building your history.
          </Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
