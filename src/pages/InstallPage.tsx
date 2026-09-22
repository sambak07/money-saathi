import {
  useEffect,
  useState,
} from 'react'

import AppShell from '../components/AppShell'
import { useInstallPrompt } from '../pwa/useInstallPrompt'

import '../styles/install.css'

function InstallPage() {
  const { canInstall, install } = useInstallPrompt()

  const [online, setOnline] = useState(
    () => navigator.onLine,
  )

  const [message, setMessage] = useState('')

  useEffect(() => {
    function updateStatus() {
      setOnline(navigator.onLine)
    }

    window.addEventListener('online', updateStatus)
    window.addEventListener('offline', updateStatus)

    return () => {
      window.removeEventListener('online', updateStatus)
      window.removeEventListener('offline', updateStatus)
    }
  }, [])

  async function installApp() {
    setMessage('')

    const accepted = await install()

    setMessage(
      accepted
        ? 'Money Saathi installation started.'
        : 'Installation was not completed.',
    )
  }

  return (
    <AppShell>
      <div className="dashboard-container install-page">
        <header className="install-header">
          <p className="dashboard-eyebrow">
            Local-first access
          </p>

          <h1>Install Money Saathi</h1>

          <p>
            Money Saathi can be installed on supported devices
            and reopened without a network connection after the
            app has been loaded once.
          </p>
        </header>

        <section className="install-status-grid">
          <article>
            <span>Connection</span>
            <strong>
              {online ? 'Online' : 'Offline'}
            </strong>
            <p>
              Your financial records remain in this browser
              whether the network is available or not.
            </p>
          </article>

          <article>
            <span>Installation</span>
            <strong>
              {canInstall
                ? 'Ready to install'
                : 'Browser controlled'}
            </strong>
            <p>
              Supported browsers decide when the install prompt
              is available.
            </p>
          </article>

          <article>
            <span>Data model</span>
            <strong>Local IndexedDB</strong>
            <p>
              Installing the app does not upload your financial
              records to a server.
            </p>
          </article>
        </section>

        <section className="install-panel">
          <div>
            <p className="dashboard-eyebrow">
              App installation
            </p>

            <h2>Use Money Saathi like an app</h2>

            <p>
              On supported Chromium browsers, the button below
              appears when the browser exposes an install
              prompt. On iPhone or iPad, use Safari's Share menu
              and choose Add to Home Screen.
            </p>
          </div>

          <button
            type="button"
            className="install-primary-button"
            disabled={!canInstall}
            onClick={() => void installApp()}
          >
            {canInstall
              ? 'Install Money Saathi'
              : 'Install option not available'}
          </button>

          {message && (
            <p className="install-message" role="status">
              {message}
            </p>
          )}
        </section>

        <section className="install-panel install-offline-panel">
          <div>
            <p className="dashboard-eyebrow">
              Offline behavior
            </p>

            <h2>What continues to work offline</h2>
          </div>

          <ul>
            <li>
              View and manage previously loaded Money Saathi
              screens.
            </li>
            <li>
              Add and edit local financial records.
            </li>
            <li>
              Use budgets, goals, assets, loans, schemes and
              reports from local data.
            </li>
            <li>
              Use App Lock and create encrypted backup files.
            </li>
          </ul>

          <p className="install-note">
            The first successful visit must occur while online so
            the browser can cache the application shell.
          </p>
        </section>
      </div>
    </AppShell>
  )
}

export default InstallPage
