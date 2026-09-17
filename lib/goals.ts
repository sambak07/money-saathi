import { deleteFromStore, readStore, writeStore } from './db'

export type Goal = { id: string; name: string; targetChetrum: number; savedChetrum: number; targetDate?: string; createdAt: string; updatedAt: string }
export function goalRemaining(goal: Goal) { return Math.max(goal.targetChetrum - goal.savedChetrum, 0) }
export function goalProgressPercent(goal: Goal) { return goal.targetChetrum <= 0 ? 0 : Number(((goal.savedChetrum / goal.targetChetrum) * 100).toFixed(2)) }
export function goalVisualProgress(goal: Goal) { return Math.min(100, Math.max(0, goalProgressPercent(goal))) }
export function goalReached(goal: Goal) { return goal.savedChetrum >= goal.targetChetrum }
export function createGoal(input: Pick<Goal, 'name' | 'targetChetrum' | 'savedChetrum' | 'targetDate'>): Goal { const now = new Date().toISOString(); return { id: crypto.randomUUID(), name: input.name.trim(), targetChetrum: input.targetChetrum, savedChetrum: input.savedChetrum, ...(input.targetDate ? { targetDate: input.targetDate } : {}), createdAt: now, updatedAt: now } }
export function updateGoal(goal: Goal, input: Pick<Goal, 'name' | 'targetChetrum' | 'targetDate'>): Goal { return { ...goal, name: input.name.trim(), targetChetrum: input.targetChetrum, ...(input.targetDate ? { targetDate: input.targetDate } : {}), updatedAt: new Date().toISOString() } }
export function adjustGoal(goal: Goal, savedChetrum: number): Goal { return { ...goal, savedChetrum, updatedAt: new Date().toISOString() } }
export function addGoalProgress(goal: Goal, amountChetrum: number): Goal { return adjustGoal(goal, goal.savedChetrum + amountChetrum) }
export const goalsRepository = { list: () => readStore<Goal>('goals'), save: (goal: Goal) => writeStore('goals', goal), update: (goal: Goal) => writeStore('goals', goal), remove: (id: string) => deleteFromStore('goals', id) }
export function sortGoals(items: Goal[]) { return [...items].sort((a, b) => Number(goalReached(a)) - Number(goalReached(b)) || a.name.localeCompare(b.name)) }
export function validGoalDate(value: string) { if (!value) return true; if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false; const [year, month, day] = value.split('-').map(Number); const date = new Date(Date.UTC(year, month - 1, day)); return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day }
export function validGoalAmount(value: number) { return Number.isSafeInteger(value) && value >= 0 }
export function validGoalTarget(value: number) { return Number.isSafeInteger(value) && value > 0 }
export function validIsoTimestamp(value: unknown) { return typeof value === 'string' && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString() === value }
export function formatGoalDate(value?: string) { if (!value) return ''; const [year, month, day] = value.split('-'); return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(Number(year), Number(month) - 1, Number(day))) }
export function goalStats(goals: Goal[]) { return { totalTargets: goals.reduce((sum, goal) => sum + goal.targetChetrum, 0), totalSaved: goals.reduce((sum, goal) => sum + goal.savedChetrum, 0), active: goals.filter(goal => !goalReached(goal)).length, reached: goals.filter(goal => goalReached(goal)).length } }
export function validateGoalRecord(input: unknown): input is Goal { if (!input || typeof input !== 'object') return false; const value = input as Record<string, unknown>; return typeof value.id === 'string' && typeof value.name === 'string' && !!value.name.trim() && validGoalTarget(value.targetChetrum as number) && validGoalAmount(value.savedChetrum as number) && validIsoTimestamp(value.createdAt) && validIsoTimestamp(value.updatedAt) && (value.targetDate === undefined || (typeof value.targetDate === 'string' && validGoalDate(value.targetDate))) }
export const goalExampleNames = ['Emergency fund', 'Vehicle', 'Education', 'Travel', 'Home']
export const goalDisplayPercent = (goal: Goal) => `${goalProgressPercent(goal).toFixed(0)}%`
export const goalAmountLabel = (goal: Goal) => `Nu. ${(goal.savedChetrum / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })} of Nu. ${(goal.targetChetrum / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
export const goalRemainingLabel = (goal: Goal) => `Nu. ${(goalRemaining(goal) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })} remaining`
