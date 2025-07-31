'use client'
import { useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, Linking } from 'react-native'
import { supabase } from '@repo/supabase'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function NewsScreen() {
  const [news, setNews] = useState<any[]>([])
  const insets = useSafeAreaInsets()

  useEffect(() => {
    supabase
      .from('smart_news')
      .select('*')
      .order('published_at', { ascending: false })
      .then(({ data }) => {
        if (data) setNews(data)
      })
  }, [])

  return (
    <FlatList
      data={news}
      contentContainerStyle={{ padding: 16, paddingTop: insets.top + 16 }}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity
          className="mb-4 rounded-2xl p-4 bg-white dark:bg-zinc-900 shadow"
          onPress={() => Linking.openURL(item.source_url)}
        >
          <Text className="text-xl font-bold dark:text-white">{item.title}</Text>
          <Text className="text-sm text-zinc-500 mt-1">{item.source_name}</Text>
          <View className="flex-row items-center mt-2 space-x-2">
            <Text className="text-xs px-2 py-1 rounded-full bg-zinc-200 dark:bg-zinc-800">
              🎯 {item.bias.toUpperCase()}
            </Text>
            <Text className="text-xs">Trust Score: {item.trust_score}%</Text>
          </View>
        </TouchableOpacity>
      )}
    />
  )
}
