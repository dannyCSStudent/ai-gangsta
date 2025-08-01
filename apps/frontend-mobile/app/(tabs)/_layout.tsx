import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#1D4ED8', // Tailwind blue-700
        tabBarInactiveTintColor: '#94A3B8', // Tailwind slate-400
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOpacity: 0.05,
          shadowRadius: 10,
          height: 60,
        },
        tabBarIcon: ({ color, size }) => {
          switch (route.name) {
            case 'index':
              return <Ionicons name="home-outline" size={size} color={color} />
            case 'news/index':
              return <Ionicons name="newspaper-outline" size={size} color={color} />
            case 'speaker-scan/index':
              return <Ionicons name="mic-outline" size={size} color={color} />
            case 'scan-history/index':
              return <Ionicons name="mic-outline" size={size} color={color} />
            default:
              return null
          }
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="news/index" options={{ title: 'News' }} />
      <Tabs.Screen name="speaker-scan/index" options={{ title: 'Scan' }} />
      <Tabs.Screen name="scan-history/index" options={{ title: 'Scan Histroy' }} />
    </Tabs>
  )
}
