'use client'

import { useState } from 'react'
import { validPin } from '@/lib/security'

export function LockScreen({ hasLock, onUnlock, onCreate, onReset }: { hasLock: boolean; onUnlock: (pin: string) => Promise<boolean>; onCreate: (pin: string) => Promise<void>; onReset: () => Promise<void> }) {
  const [pin, setPin] = useState(''); const [confirm, setConfirm] = useState(''); const [error, setError] = useState(''); const firstTime = !hasLock
  async function submit(event: React.FormEvent) { event.preventDefault(); setError(''); if (!validPin(pin)) { setError('Use a 4–8 digit PIN.'); return } if (firstTime && pin !== confirm) { setError('PINs do not match.'); return } if (firstTime) await onCreate(pin); else if (!await onUnlock(pin)) setError('That PIN was not correct.') ; setPin(''); setConfirm('') }
  return <main className="lock-screen"><form className="lock-card" onSubmit={submit}><p className="eyebrow">Money Saathi</p><h1>{firstTime ? 'Create your private PIN' : 'Unlock your money space'}</h1><p className="subheading">Your records stay on this device. Money Saathi cannot recover a forgotten PIN.</p><label>PIN<input type="password" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{4,8}" value={pin} onChange={event => setPin(event.target.value.replace(/\D/g, '').slice(0, 8))} required /></label>{firstTime && <label>Confirm PIN<input type="password" inputMode="numeric" value={confirm} onChange={event => setConfirm(event.target.value.replace(/\D/g, '').slice(0, 8))} required /></label>}{error && <p className="form-error">{error}</p>}<button className="primary-button" type="submit">{firstTime ? 'Create PIN' : 'Unlock'}</button>{!firstTime && <button type="button" className="text-button" onClick={() => { if (window.confirm('Reset Money Saathi on this device? This will erase local financial data unless you have backed it up.')) void onReset() }}>Forgot PIN?</button>}</form></main>
}
