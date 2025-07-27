'use client'

import { PropsWithChildren, useEffect, useState } from 'react'

export function AppReadyProvider({ children }: PropsWithChildren) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => setReady(true), 0)
    return () => clearTimeout(timeout)
  }, [])

  if (!ready) return null
  return <>{children}</>
}
