'use client'

import { useEffect, useId, useRef, type ReactNode } from 'react'

type Props = { open: boolean; title: string; description?: string; children: ReactNode; onClose: () => void; destructive?: boolean }

export function AppDialog({ open, title, description, children, onClose, destructive = false }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const descriptionId = useId()
  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const getFocusable = () => Array.from(panelRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])') || [])
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return }
      if (event.key !== 'Tab') return
      const focusable = getFocusable()
      if (!focusable.length) return
      const first = focusable[0]; const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.body.style.overflow = 'hidden'; document.addEventListener('keydown', onKeyDown)
    window.setTimeout(() => { const focusable = getFocusable(); (destructive ? focusable.find(item => item.classList.contains('secondary-button')) : focusable[0])?.focus() }, 0)
    return () => { document.body.style.overflow = ''; document.removeEventListener('keydown', onKeyDown); previous?.focus() }
  }, [open, onClose, destructive])
  if (!open) return null
  return <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && !destructive) onClose() }}><div className={`app-dialog${destructive ? ' app-dialog-destructive' : ''}`} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined} ref={panelRef}><h2 id={titleId}>{title}</h2>{description && <p id={descriptionId} className="subheading">{description}</p>}{children}</div></div>
}

export function DialogActions({ children }: { children: ReactNode }) { return <div className="form-actions dialog-actions">{children}</div> }
