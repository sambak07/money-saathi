import { readStore, writeStore } from './db'
export const USER_TYPES = ['student', 'salaried', 'individual', 'small-business'] as const
export type UserType = typeof USER_TYPES[number]
export type AppSettings = { key: 'app'; openingBalanceChetrum: number; currency: 'BTN'; sampleData: boolean; onboardingComplete?: boolean; displayName?: string; userType?: UserType }
const defaults: AppSettings = { key: 'app', openingBalanceChetrum: 0, currency: 'BTN', sampleData: false }
export async function getSettings() { return (await readStore<AppSettings>('settings')).find(item => item.key === 'app') || defaults }
export async function saveSettings(settings: AppSettings) { return writeStore('settings', settings) }
