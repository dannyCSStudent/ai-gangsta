'use client'
import { useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, Linking, ActivityIndicator } from 'react-native'
import { supabase } from '@repo/supabase'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Audio } from 'expo-av'

type NewsItem = {
  id: string
  title: string
  summary: string
  source_url: string
  source_name: string
  bias: string
  trust_score: number
}

export default function NewsScreen() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loadingSongId, setLoadingSongId] = useState<string | null>(null)
  const insets = useSafeAreaInsets()

  useEffect(() => {
    supabase
      .from('smart_news')
      .select('*')
      .order('published_at', { ascending: false })
      .then(({ data }) => {
        if (data) setNews(data as NewsItem[])
      })
  }, [])

  const handleMakeSong = async (item: NewsItem) => {
    try {
      setLoadingSongId(item.id)
      console.log('Sending request:', { news_id: item.id, genre: 'gangsta rap' })

      const res = await fetch("http://localhost:3002/api/news-to-song", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
        news_id: item.id,
        genre: "gangsta rap"
    }),
  })

const data = await res.json()
console.log("Song response:", data)


      if (data.song_url) {
        // Play the song using expo-av
        const { sound } = await Audio.Sound.createAsync({
          uri: `http://localhost:3002${data.song_url}`,
        })
        await sound.playAsync()
      }
    } catch (err) {
      console.error('Error generating song:', err)
    } finally {
      setLoadingSongId(null)
    }
  }

  return (
    <FlatList
      data={news}
      contentContainerStyle={{ padding: 16, paddingTop: insets.top + 16 }}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View className="mb-4 rounded-2xl p-4 bg-white dark:bg-zinc-900 shadow">
          <TouchableOpacity onPress={() => Linking.openURL(item.source_url)}>
            <Text className="text-xl font-bold dark:text-white">{item.title}</Text>
            <Text className="text-sm text-zinc-500 mt-1">{item.source_name}</Text>
          </TouchableOpacity>

          <View className="flex-row items-center mt-2 space-x-2">
            <Text className="text-xs px-2 py-1 rounded-full bg-zinc-200 dark:bg-zinc-800">
              🎯 {item.bias.toUpperCase()}
            </Text>
            <Text className="text-xs">Trust Score: {item.trust_score}%</Text>
          </View>

          <TouchableOpacity
            onPress={() => handleMakeSong(item)}
            className="mt-3 px-4 py-2 bg-purple-600 rounded-xl"
          >
            {loadingSongId === item.id ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-center font-bold">🎵 Make it a Song</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    />
  )
}
