import {
  useRegisterSW,
} from 'virtual:pwa-register/react'

import '../styles/pwa-update.css'

function PwaUpdatePrompt() {
  const {
    needRefresh: [
      needRefresh,
      setNeedRefresh,
    ],
    offlineReady: [
      offlineReady,
      setOfflineReady,
    ],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
  })

  if (
    !needRefresh &&
    !offlineReady
  ) {
    return null
  }

  return (
    <div
      className="pwa-update-banner"
      role="status"
      aria-live="polite"
    >
      <div>
        <strong>
          {needRefresh
            ? 'A Money Saathi update is ready.'
            : 'Money Saathi is ready for offline use.'}
        </strong>

        <span>
          {needRefresh
            ? 'Finish what you are entering, then update when convenient.'
            : 'Previously loaded screens can now reopen without a network connection.'}
        </span>
      </div>

      <div className="pwa-update-actions">
        {needRefresh && (
          <button
            type="button"
            onClick={() =>
              void updateServiceWorker(
                true,
              )
            }
          >
            Update now
          </button>
        )}

        <button
          type="button"
          className="secondary"
          onClick={() => {
            setNeedRefresh(
              false,
            )
            setOfflineReady(
              false,
            )
          }}
        >
          Not now
        </button>
      </div>
    </div>
  )
}

export default PwaUpdatePrompt