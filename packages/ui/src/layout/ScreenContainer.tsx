'use client'

import React from 'react'

type Props = {
  children: React.ReactNode
  className?: string
  style?: any
}

export function ScreenContainer({ children, className = '', style }: Props) {
  // ✅ Combined base classes: same for SSR & client
  const baseClasses = `min-h-screen w-full ${className}`

  // ✅ SSR fallback & client initial markup MUST match
  return (
    <div className={baseClasses} style={style}>
      {children}
    </div>
  )
}
