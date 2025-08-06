'use client'
import { useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, Linking, ActivityIndicator } from 'react-native'
import { supabase } from '@repo/supabase'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Audio } from 'expo-av'
import { Picker } from '@react-native-picker/picker';

export default function NewsScreen() {
  const [news, setNews] = useState<any[]>([])
  const [songs, setSongs] = useState<any[]>([]) // 🎵 Song history
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [genre, setGenre] = useState('gangsta rap')
  const insets = useSafeAreaInsets()
  const [sound, setSound] = useState<Audio.Sound | null>(null)

  // 1️⃣ Load initial news
  useEffect(() => {
    supabase
      .from('smart_news')
      .select('*')
      .order('published_at', { ascending: false })
      .then(({ data }) => {
        if (data) setNews(data)
      })

    // 2️⃣ Load initial songs history
    supabase
      .from('news_songs')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setSongs(data)
      })

    // 3️⃣ Subscribe to realtime inserts on news_songs
    const channel = supabase
      .channel('news_songs_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'news_songs' }, payload => {
        console.log('Realtime new song:', payload.new)
        setSongs(prev => [payload.new, ...prev]) // prepend new song
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function generateSong(newsItem: any, genre = 'gangsta rap') {
    try {
      setLoadingId(newsItem.id)
      const res = await fetch(`http://localhost:3002/api/news-to-song`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ news_id: newsItem.id, genre }),
      })
      const data = await res.json()
      console.log('Song response:', data)

      if (data.song_url) {
        playSong(`http://localhost:3002${data.song_url}`, newsItem.id)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingId(null)
    }
  }

  async function playSong(url: string, id: string) {
    try {
      if (sound) {
        await sound.stopAsync()
        await sound.unloadAsync()
      }

      const { sound: newSound } = await Audio.Sound.createAsync({ uri: url })
      setSound(newSound)
      setPlayingId(id)
      await newSound.playAsync()
    } catch (error) {
      console.error('Error playing audio:', error)
    }
  }

  return (
    <FlatList
      data={news}
      contentContainerStyle={{ padding: 16, paddingTop: insets.top + 16 }}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View className="mb-6">
          <Text className="text-2xl font-bold mb-2 dark:text-white">📰 Gangsta News</Text>

          {/* 🎵 Song History */}
          {songs.length > 0 && (
            <View className="mb-6">
              <Text className="text-lg font-bold mb-2 dark:text-white">🎵 Your Song History</Text>
              {songs.map(song => (
                <TouchableOpacity
                  key={song.id}
                  className="mb-2 p-3 bg-gray-200 dark:bg-zinc-800 rounded-xl"
                  onPress={() => playSong(`http://localhost:3002${song.song_url}`, song.news_id)}
                >
                  <Text className="text-sm dark:text-white">{song.genre} • {new Date(song.created_at).toLocaleTimeString()}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      }
      renderItem={({ item }) => (
        <View className="mb-4 rounded-2xl p-4 bg-white dark:bg-zinc-900 shadow">
          <TouchableOpacity onPress={() => Linking.openURL(item.source_url)}>
            <Text className="text-xl font-bold dark:text-white">{item.title}</Text>
            <Text className="text-sm text-zinc-500 mt-1">{item.source_name}</Text>
            <View className="flex-row items-center mt-2 space-x-2">
              <Text className="text-xs px-2 py-1 rounded-full bg-zinc-200 dark:bg-zinc-800">
                🎯 {item.bias.toUpperCase()}
              </Text>
              <Text className="text-xs">Trust Score: {item.trust_score}%</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => generateSong(item, genre)}
            className="mt-3 px-4 py-2 bg-black rounded-xl"
            disabled={loadingId === item.id}
          >
            {loadingId === item.id ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-center">
                {playingId === item.id ? '🔊 Playing...' : '🎵 Remix to Song'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    />
  )
}
