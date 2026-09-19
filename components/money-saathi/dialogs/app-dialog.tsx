'use client'

import { useId, type ReactNode } from 'react'
import { useModalDialog } from './use-modal-dialog'

type Props = { open: boolean; title: string; description?: string; children: ReactNode; onClose: () => void; destructive?: boolean }

export function AppDialog({ open, title, description, children, onClose, destructive = false }: Props) {
  const titleId = useId()
  const descriptionId = useId()
  const panelRef = useModalDialog<HTMLDivElement>({ open, onClose, initialFocus: destructive ? 'secondary' : 'first' })
  if (!open) return null
  return <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && !destructive) onClose() }}><div className={`app-dialog${destructive ? ' app-dialog-destructive' : ''}`} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined} ref={panelRef}><h2 id={titleId}>{title}</h2>{description && <p id={descriptionId} className="subheading">{description}</p>}{children}</div></div>
}

export function DialogActions({ children }: { children: ReactNode }) { return <div className="form-actions dialog-actions">{children}</div> }
