'use client'

import { useCallback, useState } from 'react'

export type MoneySaathiView = 'Home' | 'Transactions' | 'Reports' | 'Budget' | 'Settings'

export function useMoneySaathi() {
  const [active, setActive] = useState<MoneySaathiView>('Home')
  const navigate = useCallback((view: string) => setActive(view as MoneySaathiView), [])
  return { active, navigate }
}
