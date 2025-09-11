'use client'
import { useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native'
import { supabase } from '@repo/supabase'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Audio } from 'expo-av'
import * as FileSystem from 'expo-file-system'

export default function NewsSongsHistory() {
  const insets = useSafeAreaInsets()
  const [history, setHistory] = useState<any[]>([])
  const [sound, setSound] = useState<Audio.Sound | null>(null)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function fetchHistory() {
    const { data } = await supabase
      .from('news_songs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
    if (data) setHistory(data)
  }

  // Initial load
  useEffect(() => {
    fetchHistory()

    // Subscribe to real-time inserts
    const channel = supabase
      .channel('news_songs_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'news_songs' },
        (payload) => {
          console.log('Realtime insert:', payload)
          setHistory((prev) => [payload.new, ...prev])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function playSong(url: string, id: string) {
    try {
      setLoadingId(id)

      // Download to local file first
      const localUri = `${FileSystem.documentDirectory}${id}_song.wav`
      await FileSystem.downloadAsync(`http://10.0.2.2:3002${url}`, localUri)

      // Stop previous playback
      if (sound) {
        await sound.stopAsync()
        await sound.unloadAsync()
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: localUri },
        { shouldPlay: true }
      )
      setSound(newSound)
      setPlayingId(id)
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) {
          console.error('Playback status not loaded:', status)
        }
      })
    } catch (error) {
      console.error('Error playing audio:', error)
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <FlatList
      data={history}
      contentContainerStyle={{ padding: 16, paddingTop: insets.top + 16 }}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View className="mb-4 rounded-2xl p-4 bg-white dark:bg-zinc-900 shadow">
          <Text className="text-xl font-bold dark:text-white mb-1">{item.genre.toUpperCase()}</Text>
          <Text className="text-sm text-zinc-500 mb-2" numberOfLines={2}>
            {item.lyrics}
          </Text>

          <TouchableOpacity
            onPress={() => playSong(item.song_url, item.id)}
            className="px-4 py-2 bg-black rounded-xl"
            disabled={loadingId === item.id}
          >
            {loadingId === item.id ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-center">
                {playingId === item.id ? '🔊 Playing...' : '▶ Play Song'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    />
  )
}
