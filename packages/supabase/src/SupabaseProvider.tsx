'use client'

import { PropsWithChildren, createContext, useContext } from 'react'
import { supabase } from '../supabaseClient'

const SupabaseContext = createContext(supabase)

export function SupabaseProvider({ children }: PropsWithChildren) {
  return (
    <SupabaseContext.Provider value={supabase}>
      {children}
    </SupabaseContext.Provider>
  )
}

export function useSupabase() {
  return useContext(SupabaseContext)
}
