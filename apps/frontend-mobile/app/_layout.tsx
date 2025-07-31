'use client'

import { Slot } from 'expo-router'
import { AppReadyProvider } from '@repo/supabase/src/AppReadyProvider'
import { SupabaseProvider } from '@repo/supabase/src/SupabaseProvider'
import '../styles/tailwind.css'
export default function Layout() {
  return (
    <AppReadyProvider>
      <SupabaseProvider>
        <Slot />
      </SupabaseProvider>
    </AppReadyProvider>
  )
}
