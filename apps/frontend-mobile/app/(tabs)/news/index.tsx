import { useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, Linking, ActivityIndicator } from 'react-native'
import { supabase } from '@repo/supabase'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Audio } from 'expo-av'
import * as FileSystem from 'expo-file-system'
import { Picker } from '@react-native-picker/picker'

export default function NewsScreen() {
  const [news, setNews] = useState<any[]>([])
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const insets = useSafeAreaInsets()
  const [sound, setSound] = useState<Audio.Sound | null>(null)
  const [genre, setGenre] = useState('gangsta rap')
  const [scanResult, setScanResult] = useState<any | null>(null)
  const [scanningId, setScanningId] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('smart_news')
      .select('*')
      .order('published_at', { ascending: false })
      .then(({ data }) => {
        if (data) setNews(data)
      })
  }, [])

  // Inside your news card item
const runTruthScan = async (article: any) => {
  try {
    const response = await fetch(article.thumbnail_url);
    const blob = await response.blob();

    console.log("Fetched blob:", blob.type, blob.size, article.thumbnail_url);

    if (!blob.type.startsWith("image/") || blob.size === 0) {
      console.error("❌ Not a valid image:", article.thumbnail_url);
      return;
    }

    const file = new File([blob], "thumbnail.jpg", { type: blob.type });

    const formData = new FormData();
    formData.append("caption", article.title);
    formData.append("media", file);

    const res = await fetch("http://localhost:3002/analyze-post", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      console.error("Truth scan failed", await res.text());
      return;
    }

    const data = await res.json();
    console.log("✅ Truth scan result:", data);

    // update state properly
    setNews(prev =>
      prev.map(a =>
        a.id === article.id ? { ...a, truthScan: data } : a
      )
    );
  } catch (err) {
    console.error("❌ Error running truth scan", err);
  }
};


  async function generateSong(newsItem: any, style = 'gangsta rap') {
    try {
      setLoadingId(newsItem.id)

      const res = await fetch(`http://localhost:3002/api/news-to-song`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: newsItem.summary || newsItem.title,
          style,
          use_ai_lyrics: true,
        }),
      })

      const data = await res.json()
      console.log('Song response:', data)

      if (data.download_url) {
        await playSong(data.download_url, newsItem.id)
      }
    } catch (err) {
      console.error('❌ Error generating song:', err)
    } finally {
      setLoadingId(null)
    }
  }

  async function playSong(url: string, id: string) {
    try {
      console.log('Downloading for playback:', url)

      const localUri = `${FileSystem.documentDirectory}${id}_song.wav`
      await FileSystem.downloadAsync(url, localUri)

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
          const errorStatus = status as any
          if (errorStatus.error) {
            console.error('🎵 Playback error:', errorStatus.error)
          }
        }
      })
    } catch (error) {
      console.error('🎵 Error playing audio:', error)
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
            <View className="flex-row items-center mt-2 space-x-2">
              <Text className="text-xs px-2 py-1 rounded-full bg-zinc-200 dark:bg-zinc-800">
                🎯 {item.bias?.toUpperCase?.()}
              </Text>
              <Text className="text-xs">Trust Score: {item.trust_score}%</Text>
            </View>
          </TouchableOpacity>

          {/* Genre Picker */}
          <Picker
            selectedValue={genre}
            style={{ height: 40, width: 200 }}
            onValueChange={(val) => setGenre(val)}
          >
            <Picker.Item label="Gangsta Rap" value="gangsta rap" />
            <Picker.Item label="Rock" value="rock" />
            <Picker.Item label="Country" value="country" />
            <Picker.Item label="Jazz" value="jazz" />
          </Picker>

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

          <TouchableOpacity
  onPress={() => runTruthScan(item)}
  className="mt-2 px-3 py-1 rounded-full bg-blue-600"
>
  <Text className="text-white font-semibold">Run Truth Scan</Text>
</TouchableOpacity>

{item.truthScan && (
  <View className="mt-2 p-2 bg-gray-100 rounded-xl">
    <Text className="font-bold">Truth Score: {item.truthScan.score}</Text>
    <Text className="text-sm text-gray-700">{item.truthScan.truth_summary}</Text>
    {item.truthScan.mismatch_reason && (
      <Text className="text-xs text-red-500 mt-1">
        Mismatch: {item.truthScan.mismatch_reason}
      </Text>
    )}
  </View>
)}


          
        </View>
      )}
    />
  )
}
