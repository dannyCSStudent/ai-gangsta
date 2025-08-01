import { Text } from 'react-native'
import { ScreenContainer } from '@repo/ui/src/layout/ScreenContainer'

export default function HomeScreen() {
  return (
    <ScreenContainer className="items-center justify-center">
      <Text className="text-2xl font-bold text-gray-800">🏠 Home Screen</Text>
    </ScreenContainer>
  )
}
