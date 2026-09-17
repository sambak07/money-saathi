export function nextEraseStep(step: 'erase' | 'eraseConfirm', action: 'continue' | 'back' | 'cancel' | 'confirm') {
  if (step === 'erase' && action === 'continue') return 'eraseConfirm' as const
  if (step === 'eraseConfirm' && action === 'back') return 'erase' as const
  return null
}

export function mapBackupPasswordError(error: unknown) {
  return error instanceof Error && error.message.includes('password')
    ? 'That password could not unlock this backup.'
    : 'Could not read this backup. Your existing data was not intentionally changed.'
}

export function createSingleFlightGuard() {
  let busy = false
  return {
    enter() { if (busy) return false; busy = true; return true },
    release() { busy = false },
  }
}
