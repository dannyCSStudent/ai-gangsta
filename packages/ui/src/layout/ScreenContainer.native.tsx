import React from 'react'
import { SafeAreaView, View, ViewStyle } from 'react-native'

type Props = {
  children: React.ReactNode
  style?: ViewStyle
  className?: string
}

export function ScreenContainer({ children, style }: Props) {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={[{ flex: 1, padding: 16 }, style]}>{children}</View>
    </SafeAreaView>
  )
}
