export type DeleteIntentKind = 'budget' | 'recurring'

export type DeleteIntent<T> = {
  kind: DeleteIntentKind
  item: T
}

export function openDeleteIntent<T>(kind: DeleteIntentKind, item: T): DeleteIntent<T> {
  return { kind, item }
}

export async function confirmDelete<T>(intent: DeleteIntent<T> | null, remove: (item: T) => Promise<void>): Promise<boolean> {
  if (!intent) return false
  await remove(intent.item)
  return true
}

export function cancelDelete<T>(intent: DeleteIntent<T> | null): null {
  void intent
  return null
}
