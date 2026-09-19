'use client'

import { useEffect, useRef } from 'react'
import { MODAL_FOCUSABLE_SELECTOR, resolveModalKey } from '@/lib/modal-focus'

type Options = {
  open: boolean
  onClose: () => void
  // When false (e.g. a save is running) Escape and other dismiss paths are ignored.
  closable?: boolean
  // Which control receives focus when the dialog opens.
  initialFocus?: 'first' | 'secondary'
}

// The single modal-accessibility primitive shared by every Money Saathi dialog.
// It traps Tab/Shift+Tab focus inside the panel, closes on Escape (unless locked),
// locks background scroll, moves focus into the panel on open, and restores focus
// to the opener on close. Presentation (card vs. bottom sheet) is left to callers.
export function useModalDialog<T extends HTMLElement>({ open, onClose, closable = true, initialFocus = 'first' }: Options) {
  const panelRef = useRef<T>(null)
  const onCloseRef = useRef(onClose)
  const closableRef = useRef(closable)
  // Keep the latest callback/closable flag available to the keydown handler
  // without re-running the trap effect (which would steal focus on every render).
  useEffect(() => { onCloseRef.current = onClose; closableRef.current = closable })
  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const getFocusable = () => Array.from(panelRef.current?.querySelectorAll<HTMLElement>(MODAL_FOCUSABLE_SELECTOR) || [])
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' && event.key !== 'Tab') return
      const focusable = getFocusable()
      const activeIndex = focusable.indexOf(document.activeElement as HTMLElement)
      const action = resolveModalKey(event.key, event.shiftKey, { closable: closableRef.current, focusableCount: focusable.length, activeIndex })
      if (action.type === 'close') { event.preventDefault(); onCloseRef.current() }
      else if (action.type === 'focus') { event.preventDefault(); focusable[action.index]?.focus() }
    }
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeyDown)
    const focusTimer = window.setTimeout(() => { const focusable = getFocusable(); (initialFocus === 'secondary' ? focusable.find(item => item.classList.contains('secondary-button')) : focusable[0])?.focus() }, 0)
    return () => { document.body.style.overflow = ''; document.removeEventListener('keydown', onKeyDown); window.clearTimeout(focusTimer); previous?.focus() }
  }, [open, initialFocus])
  return panelRef
}
