import {
  useState,
} from 'react'
import {
  Link,
} from 'react-router-dom'

import AppShell from '../components/AppShell'
import {
  MONEY_NEEDS,
  type MoneyNeed,
  type MoneySaathiProfile,
  getProfile,
  saveProfile,
  toggleNeed,
} from '../profile/userProfile'

import '../styles/adaptive-setup.css'

function AdaptiveSetupPage() {
  const [profile, setProfile] =
    useState<MoneySaathiProfile>(
      () => getProfile(),
    )

  const [message, setMessage] = useState('')

  function chooseNeed(need: MoneyNeed) {
    setMessage('')
    setProfile((current) =>
      toggleNeed(current, need),
    )
  }

  function save() {
    saveProfile(profile)
    setMessage(
      profile.needs.length > 0
        ? 'Your Money Saathi setup is saved on this device.'
        : 'Setup saved. Money Saathi will keep the general experience.',
    )
  }

  return (
    <AppShell>
      <div className="dashboard-container adaptive-setup-page">
        <div className="adaptive-bhutan-note">
          <strong>Bhutan-first by design</strong>
          <span>
            Ngultrum, local money habits and different Bhutanese
            life stages stay at the center of Money Saathi.
          </span>
        </div>

        <header className="adaptive-setup-header">
          <p className="dashboard-eyebrow">
            Make Money Saathi yours
          </p>

          <h1>What do you want help with?</h1>

          <p>
            Choose one or more. This does not permanently label
            you as a student, employee, business owner or
            pensioner. It simply tells Money Saathi what should
            matter most to you.
          </p>
        </header>

        {message && (
          <div
            className="adaptive-setup-message"
            role="status"
          >
            {message}
          </div>
        )}

        <section
          className="adaptive-needs-grid"
          aria-label="Money needs"
        >
          {MONEY_NEEDS.map((need) => {
            const selected =
              profile.needs.includes(need.id)

            return (
              <button
                key={need.id}
                type="button"
                className={
                  selected
                    ? 'adaptive-need-card selected'
                    : 'adaptive-need-card'
                }
                aria-pressed={selected}
                onClick={() =>
                  chooseNeed(need.id)
                }
              >
                <span
                  className="adaptive-need-check"
                  aria-hidden="true"
                >
                  {selected ? '✓' : '+'}
                </span>

                <strong>{need.title}</strong>

                <span>
                  {need.description}
                </span>
              </button>
            )
          })}
        </section>

        <section className="adaptive-home-choice">
          <div>
            <p className="dashboard-eyebrow">
              Choose your Home
            </p>

            <h2>
              How much detail do you want?
            </h2>

            <p>
              Both views use exactly the same financial records.
              You can switch at any time.
            </p>
          </div>

          <div className="adaptive-home-choice-buttons">
            <button
              type="button"
              className={
                profile.homeExperience === 'simple'
                  ? 'selected'
                  : ''
              }
              aria-pressed={
                profile.homeExperience === 'simple'
              }
              onClick={() =>
                setProfile((current) => ({
                  ...current,
                  homeExperience: 'simple',
                }))
              }
            >
              <strong>Simple Home</strong>
              <span>
                Safe to Spend, money in, money out, goals and
                recent activity.
              </span>
            </button>

            <button
              type="button"
              className={
                profile.homeExperience === 'full'
                  ? 'selected'
                  : ''
              }
              aria-pressed={
                profile.homeExperience === 'full'
              }
              onClick={() =>
                setProfile((current) => ({
                  ...current,
                  homeExperience: 'full',
                }))
              }
            >
              <strong>Full Home</strong>
              <span>
                Budgets, assets, debt, schemes, reports and the
                complete financial dashboard.
              </span>
            </button>
          </div>
        </section>

        <section className="adaptive-setup-summary">
          <div>
            <p className="dashboard-eyebrow">
              Your selection
            </p>

            <h2>
              {profile.needs.length === 0
                ? 'General Money Saathi'
                : `${profile.needs.length} area${
                    profile.needs.length === 1
                      ? ''
                      : 's'
                  } selected`}
            </h2>

            <p>
              The financial engine stays the same. Future Home
              screens and guidance can adapt without splitting
              your data into separate apps.
            </p>
          </div>

          <button
            type="button"
            className="adaptive-save-button"
            onClick={save}
          >
            Save my setup
          </button>
        </section>

        <section className="adaptive-principles">
          <article>
            <span>For beginners</span>
            <strong>Simple first</strong>
            <p>
              Daily money and savings can stay simple without
              exposing advanced finance screens too early.
            </p>
          </article>

          <article>
            <span>For individuals</span>
            <strong>Grow with life</strong>
            <p>
              Salary, goals, loans, deposits and schemes remain
              available when they become useful.
            </p>
          </article>

          <article>
            <span>For business</span>
            <strong>Keep money separate</strong>
            <p>
              Business cash flow will use its own workspace so
              personal and business money are never silently
              mixed.
            </p>
          </article>

          <article>
            <span>For retirement</span>
            <strong>Clarity over complexity</strong>
            <p>
              Pension income, commitments, liquidity and safety
              can be emphasized without unnecessary clutter.
            </p>
          </article>
        </section>

        <div className="adaptive-next-note">
          <strong>Next foundation:</strong>{' '}
          Safe to Spend and Adaptive Home will use this setup to
          show the right financial priorities without changing
          the underlying records.
          <Link to="/app">
            Return Home
          </Link>
        </div>
      </div>
    </AppShell>
  )
}

export default AdaptiveSetupPage


