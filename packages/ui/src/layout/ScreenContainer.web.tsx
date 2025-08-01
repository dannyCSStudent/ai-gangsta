import React from 'react'

type Props = {
  children: React.ReactNode
  className?: string
}

export function ScreenContainer({ children, className = '' }: Props) {
  return (
    <div className={`min-h-screen w-full p-4 ${className}`}>
      {children}
    </div>
  )
}
