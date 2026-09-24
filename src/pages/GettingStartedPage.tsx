import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  Link,
} from 'react-router-dom'

import AppShell from '../components/AppShell'
import {
  getBusinessProfiles,
  getGoals,
  getRegularMoney,
  getTransactions,
} from '../storage/db'
import {
  getProfile,
} from '../profile/userProfile'
import {
  getPreferences,
} from '../settings/preferences'
import {
  buildGettingStartedJourney,
} from '../utils/gettingStarted'

import '../styles/getting-started.css'

interface StartData {
  transactionCount: number
  regularMoneyCount: number
  goalCount: number
  businessCount: number
}

function GettingStartedPage() {
  const [profile] =
    useState(() => getProfile())

  const [preferences] =
    useState(() => getPreferences())

  const [data, setData] =
    useState<StartData | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const [
          transactions,
          regularMoney,
          goals,
          businesses,
        ] = await Promise.all([
          getTransactions(),
          getRegularMoney(),
          getGoals(),
          getBusinessProfiles(),
        ])

        if (!active) return

        setData({
          transactionCount:
            transactions.length,
          regularMoneyCount:
            regularMoney.length,
          goalCount:
            goals.length,
          businessCount:
            businesses.length,
        })
      } catch {
        if (active) {
          setError(
            'Money Saathi could not prepare your getting-started journey.',
          )
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [])

  const journey = useMemo(() => {
    if (!data) return null

    return buildGettingStartedJourney(
      profile,
      {
        ...data,
        safetyBufferChetrum:
          preferences.safetyBufferChetrum,
      },
    )
  }, [
    data,
    preferences.safetyBufferChetrum,
    profile,
  ])

  if (loading) {
    return (
      <AppShell>
        <div className="dashboard-container">
          <div className="dashboard2-loading">
            Preparing your starting path...
          </div>
        </div>
      </AppShell>
    )
  }

  if (error || !journey) {
    return (
      <AppShell>
        <div className="dashboard-container">
          <div
            className="dashboard2-error"
            role="alert"
          >
            {error ||
              'Money Saathi could not prepare your starting path.'}
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="dashboard-container getting-started-page getting-started-focused">
        <header className="getting-started-hero">
          <div>
            <p className="dashboard-eyebrow">
              Start small
            </p>

            <h1>Start with the basics</h1>

            <p>
              You do not need to set up everything. Complete the
              next useful step and return to Home whenever you
              are ready.
            </p>
          </div>

          <div
            className="getting-started-progress"
            aria-label={`${journey.completedCount} of ${journey.totalCount} steps ready`}
          >
            <div>
              <span>Progress</span>
              <strong>
                {journey.completedCount}
                /
                {journey.totalCount}
              </strong>
            </div>

            <div
              className="getting-started-progress-track"
              aria-hidden="true"
            >
              <span
                style={{
                  width:
                    `${(
                      journey.completedCount /
                      journey.totalCount
                    ) * 100}%`,
                }}
              />
            </div>
          </div>
        </header>

        {journey.isComplete ? (
          <section className="getting-started-complete">
            <div>
              <p className="dashboard-eyebrow">
                Ready
              </p>

              <h2>Your foundation is in place.</h2>

              <p>
                Keep using Money Saathi at your own pace.
              </p>
            </div>

            <Link to="/app">
              Go to Home
            </Link>
          </section>
        ) : (
          <section className="getting-started-next">
            <div>
              <p className="dashboard-eyebrow">
                Next step
              </p>

              <h2>
                {journey.nextStep?.title}
              </h2>

              <p>
                {journey.nextStep?.description}
              </p>
            </div>

            {journey.nextStep && (
              <Link to={journey.nextStep.href}>
                {journey.nextStep.action}
              </Link>
            )}
          </section>
        )}

        <section
          className="getting-started-steps"
          aria-label="Getting started steps"
        >
          {journey.steps.map(
            (step, index) => (
              <article
                key={step.id}
                className={
                  step.complete
                    ? 'getting-started-step complete'
                    : 'getting-started-step'
                }
              >
                <div
                  className="getting-started-step-number"
                  aria-hidden="true"
                >
                  {step.complete
                    ? '✓'
                    : index + 1}
                </div>

                <div className="getting-started-step-copy">
                  <strong>
                    {step.title}
                  </strong>

                  <p>
                    {step.description}
                  </p>
                </div>

                <Link to={step.href}>
                  {step.complete
                    ? 'Review'
                    : step.action}
                </Link>
              </article>
            ),
          )}
        </section>

        <footer className="getting-started-footer">
          <span>
            Your real activity completes these steps. There are
            no artificial checkboxes.
          </span>

          <Link to="/app">
            Back to Home
          </Link>
        </footer>
      </div>
    </AppShell>
  )
}

export default GettingStartedPage
