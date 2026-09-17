'use client'

import { useEffect, useRef, type ReactNode } from 'react'

type Props = { open: boolean; title: string; description?: string; children: ReactNode; onClose: () => void; destructive?: boolean }

export function AppDialog({ open, title, description, children, onClose, destructive = false }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  useEffect(() => { if (!open) return; const previous = document.activeElement as HTMLElement | null; const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); onClose() } }; document.body.style.overflow = 'hidden'; document.addEventListener('keydown', onKeyDown); window.setTimeout(() => panelRef.current?.querySelector<HTMLElement>('button, input, select, textarea')?.focus(), 0); return () => { document.body.style.overflow = ''; document.removeEventListener('keydown', onKeyDown); previous?.focus() } }, [open, onClose])
  if (!open) return null
  return <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && !destructive) onClose() }}><div className={`app-dialog${destructive ? ' app-dialog-destructive' : ''}`} role="dialog" aria-modal="true" aria-labelledby="app-dialog-title" aria-describedby={description ? 'app-dialog-description' : undefined} ref={panelRef}><h2 id="app-dialog-title">{title}</h2>{description && <p id="app-dialog-description" className="subheading">{description}</p>}{children}</div></div>
}

export function DialogActions({ children }: { children: ReactNode }) { return <div className="form-actions dialog-actions">{children}</div> }
