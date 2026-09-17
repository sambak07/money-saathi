'use client'
import type { ReactNode } from 'react'
import { AppDialog, DialogActions } from './app-dialog'

type Props = { open: boolean; title: string; description: string; confirmLabel: string; cancelLabel?: string; onCancel: () => void; onConfirm: () => void | Promise<void>; busy?: boolean; children?: ReactNode }
export function ConfirmDialog({ open, title, description, confirmLabel, cancelLabel = 'Cancel', onCancel, onConfirm, busy = false, children }: Props) { return <AppDialog open={open} title={title} description={description} onClose={onCancel} destructive><>{children}<DialogActions><button className="secondary-button" type="button" onClick={onCancel} disabled={busy}>{cancelLabel}</button><button className="danger-button" type="button" onClick={() => void onConfirm()} disabled={busy}>{busy ? 'Working…' : confirmLabel}</button></DialogActions></></AppDialog> }
