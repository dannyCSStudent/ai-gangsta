'use client'
import { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@repo/supabase';

type ScanResult = {
  id: string;
  created_at: string;
  caption: string;
  truth_summary: string;
  score: number | null; // Allow score to be null
  mismatch_reason: string;
  entities: {
    persons: string[];
    organizations: string[];
    locations: string[];
    events: string[];
  };
  // Adding scan_id as a fallback for the unique key.
  scan_id: string;
};

const getScoreColor = (score: number | null) => {
  if (score === null) return 'bg-gray-400';
  // Adjusting colors to be more intuitive: green for a high truth score, red for low.
  if (score >= 90) return 'bg-green-500';
  if (score >= 50) return 'bg-yellow-400';
  return 'bg-red-500';
};

export default function TruthScanResults() {
  const insets = useSafeAreaInsets();
  const [scans, setScans] = useState<ScanResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchScans = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('scan_results')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching scans:', error);
      } else {
        console.log('Fetched scans:', data);
        setScans(data as ScanResult[]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchScans();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchScans();
  };

  const renderItem = ({ item }: { item: ScanResult }) => {
    const displayScore = item.score ?? 0;
    const scoreColor = getScoreColor(item.score);
    const scoreText = item.score !== null ? `${item.score.toFixed(0)}%` : 'N/A';
    
    return (
      <View className="mb-4 rounded-2xl p-4 bg-white dark:bg-zinc-900 shadow">
        <View className="flex-row justify-between items-start mb-2">
          <Text className="text-xl font-bold dark:text-white flex-1 mr-2">{item.caption}</Text>
          <View className={`${scoreColor} rounded-full px-3 py-1 flex-shrink-0`}>
            <Text className="text-white font-bold text-base">{scoreText}</Text>
          </View>
        </View>
        <Text className="text-sm font-semibold text-gray-600 dark:text-gray-400 mt-2">Summary:</Text>
        <Text className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">{item.truth_summary}</Text>
        <Text className="text-sm font-semibold text-gray-600 dark:text-gray-400 mt-2">Mismatch Reason:</Text>
        <Text className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">{item.mismatch_reason}</Text>
  
        {item.entities && (
          <View className="mt-4 pt-4 border-t border-gray-200 dark:border-zinc-700">
            <Text className="text-base font-bold dark:text-white">Entities</Text>
            {item.entities.persons.length > 0 && (
              <Text className="text-sm text-zinc-500 dark:text-zinc-400 mt-1"><Text className="font-bold">People:</Text> {item.entities.persons.join(', ')}</Text>
            )}
            {item.entities.organizations.length > 0 && (
              <Text className="text-sm text-zinc-500 dark:text-zinc-400 mt-1"><Text className="font-bold">Organizations:</Text> {item.entities.organizations.join(', ')}</Text>
            )}
            {item.entities.locations.length > 0 && (
              <Text className="text-sm text-zinc-500 dark:text-zinc-400 mt-1"><Text className="font-bold">Locations:</Text> {item.entities.locations.join(', ')}</Text>
            )}
          </View>
        )}
      </View>
    );
  };
  
  return (
    <FlatList
      data={scans}
      keyExtractor={item => item.id || item.scan_id}
      contentContainerStyle={{ padding: 16, paddingTop: insets.top + 16 }}
      renderItem={renderItem}
      ListEmptyComponent={() => (
        <View className="flex-1 justify-center items-center">
          {loading ? (
            <ActivityIndicator size="large" className="text-blue-500" />
          ) : (
            <Text className="text-lg text-gray-500">No scan results found.</Text>
          )}
        </View>
      )}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    />
  );
}
