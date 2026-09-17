'use client'

import { useState } from 'react'
import { Banknote, CalendarClock, Landmark, Pencil, Plus, Trash2, Wallet } from 'lucide-react'
import { safeToChetrum } from '@/lib/currency'
import { formatCurrency } from '@/lib/currency'
import { financialAssetTypeLabels, financialTotals, formatAssetDate, formatAssetUpdated, interestRatePercent, sortFinancialAssets, type FinancialAsset, type FinancialAssetInput, type FinancialAssetType } from '@/lib/financial-assets'

type Props = {
  assets: FinancialAsset[]
  onCreate: (input: FinancialAssetInput) => Promise<void>
  onEdit: (asset: FinancialAsset, input: FinancialAssetInput) => Promise<void>
  onDelete: (asset: FinancialAsset) => void
}

const typeIcons: Record<FinancialAssetType, typeof Wallet> = { 'savings-account': Landmark, 'fixed-deposit': Banknote, 'recurring-deposit': CalendarClock }

function assetSubtitle(asset: FinancialAsset) {
  if (asset.type === 'recurring-deposit') return `${formatCurrency(asset.monthlyContributionChetrum)} / month`
  return asset.institution || financialAssetTypeLabels[asset.type]
}

function AssetCard({ asset, onEdit, onDelete }: { asset: FinancialAsset; onEdit: () => void; onDelete: () => void }) {
  const Icon = typeIcons[asset.type]
  return <article className="asset-card"><div className="asset-card-heading"><div className="asset-card-title"><span className="asset-icon" aria-hidden="true"><Icon size={18}/></span><div><h3>{asset.name}</h3><p className="muted">{assetSubtitle(asset)}</p></div></div><div className="asset-card-actions"><button className="icon-button" onClick={onEdit} aria-label={`Edit ${asset.name}`}><Pencil size={16}/></button><button className="icon-button" onClick={onDelete} aria-label={`Delete ${asset.name}`}><Trash2 size={16}/></button></div></div>
    <div className="asset-value">{formatCurrency(asset.currentValueChetrum)}</div>
    <div className="asset-meta">
      {asset.type === 'fixed-deposit' && <>
        <span>Principal {formatCurrency(asset.principalChetrum)}</span>
        {asset.interestRateBps !== undefined && <span>{interestRatePercent(asset.interestRateBps)} interest</span>}
        {asset.maturityDate && <span>Matures {formatAssetDate(asset.maturityDate)}</span>}
      </>}
      {asset.type === 'recurring-deposit' && <>
        <span>{formatCurrency(asset.totalContributedChetrum)} contributed</span>
        {asset.maturityDate && <span>Matures {formatAssetDate(asset.maturityDate)}</span>}
      </>}
      <span>{formatAssetUpdated(asset.updatedAt)}</span>
    </div>
  </article>
}

const blankFields = { name: '', institution: '', currentValue: '', principal: '', interestRate: '', monthlyContribution: '', totalContributed: '', startDate: '', maturityDate: '' }
type Fields = typeof blankFields

function fieldsFromAsset(asset: FinancialAsset): Fields {
  const chetrum = (value: number) => (value / 100).toString()
  const base = { ...blankFields, name: asset.name, institution: asset.institution || '', currentValue: chetrum(asset.currentValueChetrum) }
  if (asset.type === 'fixed-deposit') return { ...base, principal: chetrum(asset.principalChetrum), interestRate: asset.interestRateBps !== undefined ? (asset.interestRateBps / 100).toString() : '', startDate: asset.startDate || '', maturityDate: asset.maturityDate || '' }
  if (asset.type === 'recurring-deposit') return { ...base, monthlyContribution: chetrum(asset.monthlyContributionChetrum), totalContributed: chetrum(asset.totalContributedChetrum), startDate: asset.startDate || '', maturityDate: asset.maturityDate || '' }
  return base
}

function AssetForm({ type, initial, editing, onSubmit, onCancel }: { type: FinancialAssetType; initial?: FinancialAsset; editing?: boolean; onSubmit: (input: FinancialAssetInput) => Promise<void>; onCancel: () => void }) {
  const [fields, setFields] = useState<Fields>(initial ? fieldsFromAsset(initial) : blankFields)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const set = (key: keyof Fields, value: string) => setFields(current => ({ ...current, [key]: value }))

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (saving) return
    if (!fields.name.trim()) return setError('Enter a name.')
    const currentValue = safeToChetrum(fields.currentValue)
    if (currentValue.value === undefined || currentValue.value < 0) return setError('Enter a current value of zero or more.')
    const institution = fields.institution.trim() || undefined
    let input: FinancialAssetInput
    if (type === 'fixed-deposit') {
      const principal = safeToChetrum(fields.principal)
      if (principal.value === undefined || principal.value < 0) return setError('Enter a principal of zero or more.')
      let interestRateBps: number | undefined
      if (fields.interestRate.trim()) { const parsed = safeToChetrum(fields.interestRate); if (parsed.value === undefined || parsed.value < 0) return setError('Enter a valid interest rate.'); interestRateBps = parsed.value }
      input = { type, name: fields.name.trim(), institution, currentValueChetrum: currentValue.value, principalChetrum: principal.value, interestRateBps, startDate: fields.startDate || undefined, maturityDate: fields.maturityDate || undefined }
    } else if (type === 'recurring-deposit') {
      const monthly = safeToChetrum(fields.monthlyContribution)
      if (monthly.value === undefined || monthly.value < 0) return setError('Enter a monthly contribution of zero or more.')
      const total = safeToChetrum(fields.totalContributed)
      if (total.value === undefined || total.value < 0) return setError('Enter a total contributed of zero or more.')
      input = { type, name: fields.name.trim(), institution, currentValueChetrum: currentValue.value, monthlyContributionChetrum: monthly.value, totalContributedChetrum: total.value, startDate: fields.startDate || undefined, maturityDate: fields.maturityDate || undefined }
    } else {
      input = { type, name: fields.name.trim(), institution, currentValueChetrum: currentValue.value }
    }
    setSaving(true)
    try { await onSubmit(input) } catch { setSaving(false); setError('Could not save this record. Try again.') }
  }

  const nameLabel = type === 'savings-account' ? 'Account name' : 'Deposit name'
  return <form className="goal-form" onSubmit={submit}>
    <label>{nameLabel}<input value={fields.name} onChange={event => set('name', event.target.value)} placeholder={type === 'savings-account' ? 'Druk PNB Savings' : '3-year Fixed Deposit'} required disabled={saving}/></label>
    <label>Institution<input value={fields.institution} onChange={event => set('institution', event.target.value)} placeholder="Bank of Bhutan" disabled={saving}/></label>
    {type === 'savings-account' && <label>Current balance<input value={fields.currentValue} onChange={event => set('currentValue', event.target.value)} placeholder="Nu. 125,400" inputMode="decimal" required disabled={saving}/></label>}
    {type === 'fixed-deposit' && <>
      <label>Principal<input value={fields.principal} onChange={event => set('principal', event.target.value)} placeholder="Nu. 100,000" inputMode="decimal" required disabled={saving}/></label>
      <label>Current value<input value={fields.currentValue} onChange={event => set('currentValue', event.target.value)} placeholder="Nu. 108,000" inputMode="decimal" required disabled={saving}/></label>
      <label>Interest rate <span className="muted">(optional)</span><input value={fields.interestRate} onChange={event => set('interestRate', event.target.value)} placeholder="7.5" inputMode="decimal" disabled={saving}/></label>
      <label>Start date <span className="muted">(optional)</span><input type="date" value={fields.startDate} onChange={event => set('startDate', event.target.value)} disabled={saving}/></label>
      <label>Maturity date <span className="muted">(optional)</span><input type="date" value={fields.maturityDate} onChange={event => set('maturityDate', event.target.value)} disabled={saving}/></label>
    </>}
    {type === 'recurring-deposit' && <>
      <label>Monthly contribution<input value={fields.monthlyContribution} onChange={event => set('monthlyContribution', event.target.value)} placeholder="Nu. 10,000" inputMode="decimal" required disabled={saving}/></label>
      <label>Total contributed<input value={fields.totalContributed} onChange={event => set('totalContributed', event.target.value)} placeholder="Nu. 120,000" inputMode="decimal" required disabled={saving}/></label>
      <label>Current value<input value={fields.currentValue} onChange={event => set('currentValue', event.target.value)} placeholder="Nu. 122,400" inputMode="decimal" required disabled={saving}/></label>
      <label>Start date <span className="muted">(optional)</span><input type="date" value={fields.startDate} onChange={event => set('startDate', event.target.value)} disabled={saving}/></label>
      <label>Maturity date <span className="muted">(optional)</span><input type="date" value={fields.maturityDate} onChange={event => set('maturityDate', event.target.value)} disabled={saving}/></label>
    </>}
    <p className="form-hint">Update balances to match your actual financial position. This does not create a transaction or change your balance.</p>
    {error && <p className="form-error">{error}</p>}
    <div className="form-actions"><button className="secondary-button" type="button" onClick={onCancel} disabled={saving}>Cancel</button><button className="primary-button" type="submit" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Add record'}</button></div>
  </form>
}

export function MyMoneyView({ assets, onCreate, onEdit, onDelete }: Props) {
  const [mode, setMode] = useState<'none' | 'choose' | 'create' | 'edit'>('none')
  const [type, setType] = useState<FinancialAssetType>('savings-account')
  const [selected, setSelected] = useState<FinancialAsset | null>(null)
  const totals = financialTotals(assets)
  const sorted = sortFinancialAssets(assets)

  const openCreate = () => { setSelected(null); setMode('choose') }
  const chooseType = (next: FinancialAssetType) => { setType(next); setMode('create') }
  const openEdit = (asset: FinancialAsset) => { setSelected(asset); setType(asset.type); setMode('edit') }
  const close = () => { setMode('none'); setSelected(null) }

  return <section className="money-page">
    <div className="panel-heading"><div><p className="eyebrow">My Money</p><h1>Your financial position</h1><p className="subheading">Keep a simple view of the money you hold across savings and deposits.</p></div><button className="primary-button" onClick={openCreate}><Plus size={16}/> Add</button></div>

    <div className="money-notice"><Wallet size={18}/><p>Balances are updated by you. Money Saathi is not connected to your bank.</p></div>

    <section className="money-summary"><p className="card-label">Tracked financial assets</p><div className="money-summary-value">{formatCurrency(totals.total)}</div></section>

    <div className="money-breakdown">
      <div className="money-breakdown-item"><span>Savings accounts</span><strong>{formatCurrency(totals.savings)}</strong></div>
      <div className="money-breakdown-item"><span>Fixed deposits</span><strong>{formatCurrency(totals.fixedDeposits)}</strong></div>
      <div className="money-breakdown-item"><span>Recurring deposits</span><strong>{formatCurrency(totals.recurringDeposits)}</strong></div>
    </div>

    <div className="panel-heading money-list-heading"><div><p className="eyebrow">Your money</p><h2>Savings and deposits</h2></div></div>
    {sorted.length === 0
      ? <div className="empty-state"><Wallet size={20}/><h2>Your financial picture starts here.</h2><p>Add savings accounts and deposits to see your money in one place.</p><button className="primary-button" onClick={openCreate}>Add your first asset</button></div>
      : <div className="asset-list">{sorted.map(asset => <AssetCard key={asset.id} asset={asset} onEdit={() => openEdit(asset)} onDelete={() => onDelete(asset)}/>)}</div>}

    {mode === 'choose' && <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) close() }}>
      <div className="add-sheet" role="dialog" aria-modal="true" aria-label="Choose asset type">
        <div className="sheet-header"><div><p className="eyebrow">Add</p><h2>What would you like to add?</h2></div><button type="button" className="round-button small" onClick={close} aria-label="Close">×</button></div>
        <div className="more-list">{(['savings-account', 'fixed-deposit', 'recurring-deposit'] as FinancialAssetType[]).map(option => { const Icon = typeIcons[option]; return <button key={option} type="button" className="more-item" onClick={() => chooseType(option)}><Icon size={18}/><span>{financialAssetTypeLabels[option]}</span></button> })}</div>
      </div>
    </div>}

    {(mode === 'create' || mode === 'edit') && <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) close() }}>
      <div className="add-sheet" role="dialog" aria-modal="true" aria-label={mode === 'edit' ? 'Edit record' : 'Add record'}>
        <div className="sheet-header"><div><p className="eyebrow">{financialAssetTypeLabels[type]}</p><h2>{mode === 'edit' ? 'Edit record' : `Add ${financialAssetTypeLabels[type].toLowerCase()}`}</h2></div><button type="button" className="round-button small" onClick={close} aria-label="Close">×</button></div>
        <AssetForm type={type} initial={selected || undefined} editing={mode === 'edit'} onCancel={close} onSubmit={async input => { if (mode === 'edit' && selected) await onEdit(selected, input); else await onCreate(input); close() }}/>
      </div>
    </div>}
  </section>
}
