import { readStore, writeStore } from './db'
export type AppSettings = { key: 'app'; openingBalanceChetrum: number; currency: 'BTN'; sampleData: boolean; onboardingComplete?: boolean; displayName?: string }
const defaults: AppSettings = { key: 'app', openingBalanceChetrum: 0, currency: 'BTN', sampleData: false }
export async function getSettings() { return (await readStore<AppSettings>('settings')).find(item => item.key === 'app') || defaults }
export async function saveSettings(settings: AppSettings) { return writeStore('settings', settings) }
