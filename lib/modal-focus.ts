// Shared, DOM-free focus-management logic for every Money Saathi modal.
// Keeping the decisions here (instead of inside a component effect) lets the
// exact keyboard-trap behaviour be unit-tested without a DOM, and guarantees
// the AppDialog card and the Add/Edit transaction sheet behave identically.

export const MODAL_FOCUSABLE_SELECTOR =
  'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'

// Decide which focusable element Tab should move to so focus can never leave the
// dialog. `activeIndex` is the index of the currently focused element within the
// dialog's focusable list, or -1 when focus has escaped the dialog entirely.
// Returns the index to force focus to, or null to let the browser move focus
// naturally (i.e. we are in the middle of the list, away from the wrap points).
export function resolveTabTarget(count: number, activeIndex: number, shiftKey: boolean): number | null {
  if (count <= 0) return null
  const last = count - 1
  if (activeIndex < 0) return shiftKey ? last : 0 // focus escaped the dialog — pull it back inside
  if (shiftKey && activeIndex === 0) return last // wrap backwards from the first element
  if (!shiftKey && activeIndex === last) return 0 // wrap forwards from the last element
  return null
}

export type ModalKeyAction = { type: 'close' } | { type: 'focus'; index: number } | { type: 'none' }

// Translate a keydown into the modal's response. Escape only closes when the
// dialog is currently closable (e.g. not while a save is running); Tab/Shift+Tab
// keep focus trapped inside; every other key is ignored here.
export function resolveModalKey(
  key: string,
  shiftKey: boolean,
  options: { closable: boolean; focusableCount: number; activeIndex: number },
): ModalKeyAction {
  if (key === 'Escape') return options.closable ? { type: 'close' } : { type: 'none' }
  if (key !== 'Tab') return { type: 'none' }
  const target = resolveTabTarget(options.focusableCount, options.activeIndex, shiftKey)
  return target === null ? { type: 'none' } : { type: 'focus', index: target }
}
