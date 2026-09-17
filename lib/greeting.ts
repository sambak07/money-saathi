export function greetingForHour(hour: number, displayName?: string) {
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const name = displayName?.trim()
  return name ? `${greeting}, ${name}` : greeting
}

export function localGreeting(displayName?: string, now = new Date()) {
  return greetingForHour(now.getHours(), displayName)
}

export function normalizeDisplayName(value: string) {
  return value.trim().slice(0, 50)
}

export function validDisplayName(value: string) {
  return normalizeDisplayName(value).length <= 50
}
