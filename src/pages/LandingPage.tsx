﻿import { Link } from 'react-router-dom'
import '../styles/landing.css'

function LandingPage() {
  return (
    <div className="landing">
      <header className="site-header">
        <Link to="/" className="brand-lockup" aria-label="Money Saathi home">
          <span className="brand-mark" aria-hidden="true">
            <img
              src="/money-saathi-lockup.png"
              alt=""
            />
          </span>
          <span>Money Saathi</span>
        </Link>

        <div className="site-header-actions">
          <a href="#security" className="header-action">
            Privacy & Security
          </a>

          <Link to="/app" className="header-action primary-header-action">
            Open Money Saathi
          </Link>
        </div>
      </header>

      <main>
        <section className="landing-hero-shell">
          <div className="landing-logo-shadow" aria-hidden="true">
            <img src="/money-saathi-lockup.png" alt="" />
          </div>

          <div className="hero landing-hero">
            <div className="hero-copy">
              <p className="eyebrow">
                <span className="eyebrow-dot" aria-hidden="true" />
                Made in Bhutan · Built around Nu.
              </p>

              <h1>
                Understand your money. Keep control of it.
              </h1>

              <p className="hero-subtitle">
                Track, plan and understand everyday money without connecting
                your bank account. Money Saathi is built around Ngultrum,
                simplicity and local-first privacy.
              </p>

              <div className="hero-actions">
                <Link to="/onboarding" className="primary-button">
                  Start with Money Saathi
                </Link>

                <a href="#why-money-saathi" className="secondary-button">
                  Why Money Saathi?
                </a>
              </div>

              <div className="trust-line" aria-label="Money Saathi trust principles">
                <span className="trust-item">
                  <span className="trust-check" aria-hidden="true">✓</span>
                  No bank connection
                </span>

                <span className="trust-item">
                  <span className="trust-check" aria-hidden="true">✓</span>
                  No bank PIN or OTP
                </span>

                <span className="trust-item">
                  <span className="trust-check" aria-hidden="true">✓</span>
                  Records stay on your device
                </span>

                <span className="trust-item">
                  <span className="trust-check" aria-hidden="true">✓</span>
                  Works offline after first load
                </span>
              </div>
            </div>

            <div className="money-preview" aria-label="Money Saathi dashboard preview">
              <div className="preview-glow" aria-hidden="true" />

              <div className="preview-card">
                <div className="preview-top">
                  <div>
                    <p className="preview-label">Available money</p>
                    <p className="balance">Nu. 42,850</p>
                  </div>

                  <span className="preview-month">This month</span>
                </div>

                <div className="preview-summary">
                  <div className="summary-box">
                    <p className="summary-title">Money in</p>
                    <p className="summary-value positive">Nu. 75,000</p>
                  </div>

                  <div className="summary-box">
                    <p className="summary-title">Money out</p>
                    <p className="summary-value">Nu. 32,150</p>
                  </div>
                </div>

                <div className="spending-bar">
                  <div className="spending-row">
                    <span>Monthly plan</span>
                    <span>62% used</span>
                  </div>

                  <div className="bar-track" aria-hidden="true">
                    <div className="bar-fill" />
                  </div>

                  <p className="preview-note">
                    A clear view of your money — without financial jargon
                    or giving Money Saathi access to your bank account.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bhutan-first-strip" aria-label="Bhutan-first design">
          <div className="bhutan-first-mark" aria-hidden="true">
            Nu.
          </div>

          <div>
            <strong>Built for Bhutanese financial life</strong>
            <span>
              Salary · EMI · FD · RD · Savings · Goals · Household money · Small business
            </span>
          </div>

          <span className="bhutan-first-tag">
            Bhutan-first by design
          </span>
        </section>

        <section className="landing-section" id="why-money-saathi">
          <header className="landing-section-heading">
            <p className="landing-kicker">WHY MONEY SAATHI?</p>
            <h2>A finance app that feels like it belongs here.</h2>
            <p>
              Money Saathi is designed around how people in Bhutan manage
              everyday money — in Ngultrum, across household commitments,
              savings, deposits, loans and small business.
            </p>
          </header>

          <div className="landing-feature-grid">
            <article className="landing-feature-card">
              <span className="benefit-number">01</span>
              <h3>Ngultrum-first</h3>
              <p>
                Built around Ngultrum from the start, with the currency
                Bhutanese users live with every day.
              </p>
            </article>

            <article className="landing-feature-card">
              <span className="benefit-number">02</span>
              <h3>Everyday Bhutanese money</h3>
              <p>
                Salary, rent, EMI, FD, RD, savings and goals — built around
                everyday financial life.
              </p>
            </article>

            <article className="landing-feature-card">
              <span className="benefit-number">03</span>
              <h3>Personal and business, kept separate</h3>
              <p>
                Keep household money separate from business cash, sales,
                stock and dues.
              </p>
            </article>

            <article className="landing-feature-card">
              <span className="benefit-number">04</span>
              <h3>Local-first privacy</h3>
              <p>
                Your core financial records stay on your device, not in a
                Money Saathi cloud financial database.
              </p>
            </article>

            <article className="landing-feature-card">
              <span className="benefit-number">05</span>
              <h3>Works offline</h3>
              <p>
                After the first successful load, supported screens and local
                records can continue working offline.
              </p>
            </article>

            <article className="landing-feature-card">
              <span className="benefit-number">06</span>
              <h3>Encrypted backups</h3>
              <p>
                Create an encrypted backup when you choose and keep the file
                wherever you prefer.
              </p>
            </article>
          </div>
        </section>

        <section className="landing-section landing-life-section">
          <header className="landing-section-heading">
            <p className="landing-kicker">BUILT AROUND YOUR REAL LIFE</p>
            <h2>One place for the money decisions that actually matter.</h2>
          </header>

          <div className="landing-life-grid">
            <article>
              <strong>Track everyday money</strong>
              <span>Income, expenses and recent activity.</span>
            </article>

            <article>
              <strong>Plan ahead</strong>
              <span>Budgets, recurring money and goals.</span>
            </article>

            <article>
              <strong>See what you own and owe</strong>
              <span>Savings, FD, RD and loans.</span>
            </article>

            <article>
              <strong>Run a small business</strong>
              <span>Cash, sales, dues, stock and reports.</span>
            </article>
          </div>
        </section>

        <section className="landing-section" id="security">
          <div className="landing-security">
            <div>
              <p className="landing-kicker">MONEY SAATHI SECURITY PROMISE</p>
              <h2>Money Saathi never needs your banking credentials.</h2>
              <p>
                Money Saathi does not log in to your bank account, move your
                money, or require credentials that can operate your bank account.
              </p>
            </div>

            <div className="landing-never-box">
              <strong>NEVER ENTER OR SHARE WITH MONEY SAATHI</strong>

              <div>
                <span>Bank PIN</span>
                <span>ATM PIN</span>
                <span>OTP</span>
                <span>CVV</span>
                <span>Card PIN</span>
                <span>Banking password</span>
              </div>
            </div>
          </div>

          <p className="landing-local-warning">
            <strong>Local-first reminder:</strong> clearing browser/site data,
            losing the device or resetting the browser may remove local records.
            Create encrypted backups regularly and keep the backup password safe.
          </p>
        </section>

        <section className="landing-final-cta">
          <div>
            <h2>Made in Bhutan. Built for everyday Bhutanese money.</h2>
            <p>Simple. Private. Local-first. Built around Ngultrum.</p>
          </div>

          <Link to="/onboarding" className="landing-final-button">
            Start with Money Saathi
          </Link>
        </section>
      </main>

      <footer className="site-footer">
        <span>Money Saathi</span>
        <span>Understand your money. Plan it. Track it. Grow with it.</span>
      </footer>
    </div>
  )
}

export default LandingPage
