import {
  type FormEvent,
  useState,
} from 'react'
import {
  Link,
} from 'react-router-dom'

import AppShell from '../components/AppShell'
import {
  getPreferences,
  savePreferences,
} from '../settings/preferences'
import {
  formatChetrumForSafetyInput,
  parseNuInputToChetrum,
} from '../utils/safeToSpend'

import '../styles/safety-buffer.css'

function SafetyBufferPage() {
  const [input, setInput] = useState(
    () =>
      formatChetrumForSafetyInput(
        getPreferences().safetyBufferChetrum,
      ),
  )

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function save(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setMessage('')
    setError('')

    const chetrum =
      parseNuInputToChetrum(input)

    if (chetrum === null) {
      setError(
        'Enter a valid Nu. amount with no more than two decimal places.',
      )
      return
    }

    const current = getPreferences()

    savePreferences({
      ...current,
      safetyBufferChetrum: chetrum,
    })

    setInput(
      formatChetrumForSafetyInput(chetrum),
    )

    setMessage(
      'Protected buffer saved on this device.',
    )
  }

  return (
    <AppShell>
      <div className="dashboard-container safety-buffer-page">
        <header className="safety-buffer-header">
          <p className="dashboard-eyebrow">
            Protect before spending
          </p>

          <h1>Safety buffer</h1>

          <p>
            Choose an amount Money Saathi should protect when
            estimating Safe to Spend. This does not move money,
            create a transaction or change any account balance.
          </p>
        </header>

        {message && (
          <div
            className="safety-buffer-message"
            role="status"
          >
            {message}
          </div>
        )}

        {error && (
          <div
            className="safety-buffer-error"
            role="alert"
          >
            {error}
          </div>
        )}

        <section className="safety-buffer-panel">
          <div>
            <p className="dashboard-eyebrow">
              Protected amount
            </p>

            <h2>Keep this amount outside normal spending</h2>

            <p>
              This is a planning preference, not a separate bank
              account. A higher buffer makes Safe to Spend more
              conservative.
            </p>
          </div>

          <form
            className="safety-buffer-form"
            onSubmit={save}
          >
            <label htmlFor="safety-buffer-amount">
              Safety buffer (Nu.)
            </label>

            <input
              id="safety-buffer-amount"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={input}
              onChange={(event) =>
                setInput(event.target.value)
              }
            />

            <button type="submit">
              Save safety buffer
            </button>
          </form>
        </section>

        <section className="safety-buffer-facts">
          <article>
            <span>Safe to Spend starts from</span>
            <strong>Recorded transaction balance</strong>
            <p>
              Money Saathi does not add your FD, RD, insurance
              cover or future benefits to spendable cash.
            </p>
          </article>

          <article>
            <span>Then it protects</span>
            <strong>Known upcoming commitments</strong>
            <p>
              Unrecorded Regular Money expenses are reserved up
              to the next scheduled income, or month-end when no
              scheduled income is available.
            </p>
          </article>

          <article>
            <span>Future income</span>
            <strong>Never added before receipt</strong>
            <p>
              A scheduled salary or pension can set the planning
              horizon, but it does not increase Safe to Spend
              before it is actually recorded.
            </p>
          </article>
        </section>

        <div className="safety-buffer-note">
          The safety buffer is a device preference and is not a
          financial transaction.
          <Link to="/app">
            Return Home
          </Link>
        </div>
      </div>
    </AppShell>
  )
}

export default SafetyBufferPage
