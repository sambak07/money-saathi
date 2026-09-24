import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import '../styles/onboarding.css'

type MoneySituation =
  | 'salary'
  | 'business'
  | 'student'
  | 'mixed'
  | 'other'

type MoneyGoal =
  | 'control-spending'
  | 'save-more'
  | 'build-goals'
  | 'understand-money'

const situations: Array<{
  id: MoneySituation
  title: string
  description: string
}> = [
  {
    id: 'salary',
    title: 'Salaried',
    description: 'I mainly receive a regular salary.',
  },
  {
    id: 'business',
    title: 'Business or self-employed',
    description: 'My income can change from month to month.',
  },
  {
    id: 'student',
    title: 'Student',
    description: 'I am learning to manage limited money well.',
  },
  {
    id: 'mixed',
    title: 'Mixed income',
    description: 'I receive money from more than one source.',
  },
]

const goals: Array<{
  id: MoneyGoal
  title: string
  description: string
}> = [
  {
    id: 'control-spending',
    title: 'Control my spending',
    description: 'See where my money goes and stay within a plan.',
  },
  {
    id: 'save-more',
    title: 'Save more consistently',
    description: 'Build a healthier savings habit over time.',
  },
  {
    id: 'build-goals',
    title: 'Plan for goals',
    description: 'Set aside money for things that matter to me.',
  },
  {
    id: 'understand-money',
    title: 'Understand my money better',
    description: 'Get a simple overall view of my finances.',
  },
]

function OnboardingPage() {
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [situation, setSituation] = useState<MoneySituation | null>(null)
  const [goal, setGoal] = useState<MoneyGoal | null>(null)

  const totalSteps = 4

  const progress = useMemo(
    () => `${(step / totalSteps) * 100}%`,
    [step],
  )

  const canContinue =
    (step === 1 && name.trim().length >= 2) ||
    (step === 2 && situation !== null) ||
    (step === 3 && goal !== null) ||
    step === 4

  function goBack() {
    if (step > 1) {
      setStep((current) => current - 1)
    }
  }

  function goNext() {
    if (!canContinue) {
      return
    }

    if (step < totalSteps) {
      setStep((current) => current + 1)
      return
    }

    navigate('/app')
  }

  return (
    <div className="onboarding-page">
      <aside className="onboarding-side">
        <Link to="/" className="onboarding-brand">
          <span className="onboarding-brand-mark">M</span>
          <span>Money Saathi</span>
        </Link>

        <div className="onboarding-side-copy">
          <p>A clearer relationship with your money</p>

          <h2>
            Start simple.
            <br />
            Build from there.
          </h2>

          <span>
            Money Saathi is designed to help you understand your real
            financial position without overwhelming you with jargon.
          </span>
        </div>

        <span className="onboarding-side-note">
          Your financial information is designed to stay on your device.
        </span>
      </aside>

      <main className="onboarding-main">
        <div className="onboarding-topbar">
          <Link to="/" className="back-home">
            ← Home
          </Link>

          <span className="step-label">
            Step {step} of {totalSteps}
          </span>
        </div>

        <div className="onboarding-progress" aria-hidden="true">
          <div
            className="onboarding-progress-fill"
            style={{ width: progress }}
          />
        </div>

        <section className="onboarding-content">
          {step === 1 && (
            <>
              <p className="step-kicker">Welcome</p>

              <h1>What should we call you?</h1>

              <p className="step-description">
                Money Saathi should feel personal, but we only need a
                simple name to begin.
              </p>

              <div className="form-section">
                <label className="field-label" htmlFor="name">
                  Your name
                </label>

                <input
                  id="name"
                  className="text-input"
                  type="text"
                  value={name}
                  maxLength={50}
                  autoComplete="given-name"
                  placeholder="Enter your name"
                  onChange={(event) => setName(event.target.value)}
                  autoFocus
                />

                <p className="field-hint">
                  This is only for your Money Saathi experience.
                </p>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <p className="step-kicker">Your money</p>

              <h1>How does money usually come to you?</h1>

              <p className="step-description">
                This helps us shape the experience around your everyday
                financial life.
              </p>

              <div className="choice-grid">
                {situations.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={
                      situation === item.id
                        ? 'choice-card selected'
                        : 'choice-card'
                    }
                    onClick={() => setSituation(item.id)}
                    aria-pressed={situation === item.id}
                  >
                    <span className="choice-title">
                      {item.title}
                    </span>

                    <span className="choice-description">
                      {item.description}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <p className="step-kicker">Your priority</p>

              <h1>What would help you most right now?</h1>

              <p className="step-description">
                There is no wrong answer. You can use every Money Saathi
                feature later.
              </p>

              <div className="choice-grid">
                {goals.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={
                      goal === item.id
                        ? 'choice-card selected'
                        : 'choice-card'
                    }
                    onClick={() => setGoal(item.id)}
                    aria-pressed={goal === item.id}
                  >
                    <span className="choice-title">
                      {item.title}
                    </span>

                    <span className="choice-description">
                      {item.description}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <p className="step-kicker">Privacy first</p>

              <h1>Your money should remain yours.</h1>

              <p className="step-description">
                Money Saathi is being built as a local-first personal
                finance tool.
              </p>

              <div className="privacy-box">
                <h3>Before you begin</h3>

                <p>
                  Money Saathi does not need a connection to your bank
                  account to help you understand your finances.
                </p>

                <ul className="privacy-points">
                  <li>
                    <span className="privacy-check">✓</span>
                    <span>
                      Transactions will be entered and managed by you.
                    </span>
                  </li>

                  <li>
                    <span className="privacy-check">✓</span>
                    <span>
                      Core financial data will be stored locally on your
                      device.
                    </span>
                  </li>

                  <li>
                    <span className="privacy-check">✓</span>
                    <span>
                      Encrypted backup and restore are available when
                      you want a portable copy of your local data.
                    </span>
                  </li>
                </ul>
              </div>
            </>
          )}

          <div className="onboarding-actions">
            {step > 1 && (
              <button
                type="button"
                className="onboarding-button secondary"
                onClick={goBack}
              >
                Back
              </button>
            )}

            <button
              type="button"
              className="onboarding-button primary"
              disabled={!canContinue}
              onClick={goNext}
            >
              {step === totalSteps ? 'Enter Money Saathi' : 'Continue'}
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}

export default OnboardingPage
