import { describe, expect, it, vi } from 'vitest'
import { cancelDelete, confirmDelete, openDeleteIntent } from './delete-intent'

describe('planning delete intent', () => {
  it('opens confirmation without deleting', () => {
    const remove = vi.fn()
    const intent = openDeleteIntent('budget', { id: 'budget-1' })
    expect(intent.item.id).toBe('budget-1')
    expect(remove).not.toHaveBeenCalled()
  })

  it('cancels without deleting', () => {
    const remove = vi.fn()
    expect(cancelDelete(openDeleteIntent('recurring', { id: 'recurring-1' }))).toBeNull()
    expect(remove).not.toHaveBeenCalled()
  })

  it('confirms a budget exactly once', async () => {
    const remove = vi.fn(async () => undefined)
    const intent = openDeleteIntent('budget', { id: 'budget-1' })
    await expect(confirmDelete(intent, remove)).resolves.toBe(true)
    expect(remove).toHaveBeenCalledTimes(1)
  })

  it('confirms a recurring item exactly once', async () => {
    const remove = vi.fn(async () => undefined)
    const intent = openDeleteIntent('recurring', { id: 'recurring-1' })
    await expect(confirmDelete(intent, remove)).resolves.toBe(true)
    expect(remove).toHaveBeenCalledTimes(1)
  })
})
