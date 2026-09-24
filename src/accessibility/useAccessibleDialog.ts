import {
  useEffect,
  useRef,
} from 'react'

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export function useAccessibleDialog(
  open: boolean,
  onClose: () => void,
) {
  const dialogRef =
    useRef<HTMLElement | null>(
      null,
    )

  const onCloseRef =
    useRef(onClose)

  useEffect(() => {
    onCloseRef.current =
      onClose
  }, [onClose])

  useEffect(() => {
    if (!open) {
      return
    }

    const dialog =
      dialogRef.current

    if (!dialog) {
      return
    }

    const activeDialog: HTMLElement =
      dialog

    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null

    const previousOverflow =
      document.body.style.overflow

    function getFocusable(): HTMLElement[] {
      return Array.from(
        activeDialog.querySelectorAll<HTMLElement>(
          FOCUSABLE_SELECTOR,
        ),
      )
    }

    const firstFocusable =
      getFocusable()[0] ??
      activeDialog

    firstFocusable.focus()
    document.body.style.overflow =
      'hidden'

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }

      if (event.key !== 'Tab') {
        return
      }

      const focusable =
        getFocusable()

      if (focusable.length === 0) {
        event.preventDefault()
        activeDialog.focus()
        return
      }

      const first =
        focusable[0]

      const last =
        focusable[
          focusable.length - 1
        ]

      const active =
        document.activeElement

      if (
        event.shiftKey &&
        (
          active === first ||
          !activeDialog.contains(active)
        )
      ) {
        event.preventDefault()
        last.focus()
        return
      }

      if (
        !event.shiftKey &&
        active === last
      ) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener(
      'keydown',
      handleKeyDown,
    )

    return () => {
      document.removeEventListener(
        'keydown',
        handleKeyDown,
      )

      document.body.style.overflow =
        previousOverflow

      previousFocus?.focus()
    }
  }, [open])

  return dialogRef
}