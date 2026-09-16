'use client'

import type { ReactNode } from 'react'

type HomeViewProps = { children: ReactNode }

export function HomeView({ children }: HomeViewProps) {
  return <>{children}</>
}
