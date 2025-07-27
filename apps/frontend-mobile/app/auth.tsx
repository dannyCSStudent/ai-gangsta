
import { View, Text, TextInput, TouchableOpacity } from 'react-native'
import { cn } from '../utils/cn' // Not needed unless you use it elsewhere
import { useState } from 'react' // <-- Add this import
import '../styles/tailwind.css'
export default function AuthForm({
  title = 'Sign in',
  onSubmit,
  buttonLabel = 'Continue',
}: {
  title?: string
  onSubmit: (email: string, password: string) => void
  buttonLabel?: string
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <View className="w-full max-w-md px-4 py-6 space-y-4">
      <Text className="text-2xl font-bold text-center">{title}</Text>
      <TextInput
        placeholder="Email"
        className="border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-base text-black dark:text-white"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        placeholder="Password"
        className="border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-base text-black dark:text-white"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity
        className="bg-black dark:bg-white rounded-md py-3"
        onPress={() => onSubmit(email, password)}
      >
        <Text className="text-white dark:text-black text-center text-base font-semibold">
          {buttonLabel}
        </Text>
      </TouchableOpacity>
    </View>
  )
}