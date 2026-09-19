'use client'

import { useState } from 'react'
import { safeToChetrum } from '@/lib/currency'
import { normalizeDisplayName } from '@/lib/greeting'

export function Onboarding({ onComplete }: { onComplete: (openingBalance: number, protect: boolean, displayName: string) => Promise<void> }) {
  const [step, setStep] = useState(1)
  const [displayName, setDisplayName] = useState('')
  const [amount, setAmount] = useState('')
  const [balanceError, setBalanceError] = useState('')
  function continueFromBalance() {
    const trimmed = amount.trim()
    if (!trimmed) { setBalanceError('Enter your opening balance, or choose Skip · Nu. 0.'); return }
    const parsed = safeToChetrum(trimmed)
    if (parsed.value === undefined || parsed.value < 0) { setBalanceError(parsed.error || 'Enter a valid Ngultrum amount.'); return }
    setBalanceError(''); setStep(4)
  }
  function skipBalance() { setAmount(''); setBalanceError(''); setStep(4) }
  async function finish(protect = false) {
    const trimmed = amount.trim()
    const parsed = trimmed ? safeToChetrum(trimmed) : { value: 0 }
    const balance = parsed.value !== undefined && parsed.value >= 0 ? parsed.value : 0
    await onComplete(balance, protect, normalizeDisplayName(displayName))
  }
  return <main className="lock-screen"><section className="lock-card onboarding-card"><p className="eyebrow">Money Saathi · {step} of 4</p>{step === 1 && <><h1>What should Money Saathi call you?</h1><p className="subheading">A name makes Money Saathi feel more personal. It stays on this device.</p><label>Preferred name<input value={displayName} onChange={event => setDisplayName(event.target.value.slice(0, 50))} placeholder="Your name" maxLength={50} autoComplete="off" /></label><div className="onboarding-actions"><button className="text-button" onClick={() => setStep(2)}>Skip for now</button><button className="primary-button" onClick={() => setStep(2)}>Continue</button></div></>}{step === 2 && <><h1>Your money, simply.</h1><p className="subheading">Your data stays on this device, works offline, and never needs a bank connection.</p><button className="primary-button" onClick={() => setStep(3)}>Continue</button></>}{step === 3 && <><h1>Start with your balance</h1><p className="subheading">Add what you currently have. You can change this later.</p><label>Opening balance in Ngultrum<input inputMode="decimal" value={amount} onChange={event => { setAmount(event.target.value); if (balanceError) setBalanceError('') }} placeholder="0.00" aria-invalid={balanceError ? true : undefined} aria-describedby={balanceError ? 'onboarding-balance-error' : undefined} /></label>{balanceError && <p className="form-error" id="onboarding-balance-error" role="alert">{balanceError}</p>}<div className="onboarding-actions"><button className="text-button" onClick={skipBalance}>Skip · Nu. 0</button><button className="primary-button" onClick={continueFromBalance}>Continue</button></div></>}{step === 4 && <><h1>Protect Money Saathi</h1><p className="subheading">Set a local PIN to protect your financial records, or do it later from Settings.</p><button className="primary-button" onClick={() => { void finish(true) }}>Set App PIN</button><button className="text-button" onClick={() => void finish()}>Not now</button></>}</section></main>
}
