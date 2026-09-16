'use client'

import { useState } from 'react'

export function LockScreen({ hasLock, onUnlock, onCreate }: { hasLock: boolean; onUnlock: (password: string) => Promise<boolean>; onCreate: (password: string) => Promise<void> }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const firstTime = !hasLock
  async function submit(event: React.FormEvent) { event.preventDefault(); if (firstTime && password !== confirm) { setError('Passwords do not match.'); return } if (password.length < 8) { setError('Use at least 8 characters.'); return } if (firstTime) await onCreate(password); else if (!await onUnlock(password)) setError('That password was not correct.'); setPassword(''); setConfirm('') }
  return <main className="lock-screen"><form className="lock-card" onSubmit={submit}><p className="eyebrow">Money Saathi</p><h1>{firstTime ? 'Create your private lock' : 'Unlock your money space'}</h1><p className="subheading">Your records stay on this device. The password cannot be recovered.</p><label>Password<input type="password" autoFocus value={password} onChange={event => setPassword(event.target.value)} minLength={8} required /></label>{firstTime && <label>Confirm password<input type="password" value={confirm} onChange={event => setConfirm(event.target.value)} minLength={8} required /></label>}{error && <p className="form-error">{error}</p>}<button className="primary-button" type="submit">{firstTime ? 'Create lock' : 'Unlock'}</button></form></main>
}
