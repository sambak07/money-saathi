import { Link } from 'react-router-dom'
import '../styles/landing.css'

function LandingPage() {
  return (
    <div className="landing">
      <header className="site-header">
        <Link to="/" className="brand-lockup" aria-label="Money Saathi home">
          <span className="brand-mark" aria-hidden="true">M</span>
          <span>Money Saathi</span>
        </Link>

        <div className="site-header-actions">
          <Link to="/app" className="header-action">
            Open Money Saathi
          </Link>

          <Link to="/onboarding" className="header-action primary-header-action">
            Get started
          </Link>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="eyebrow-dot" aria-hidden="true" />
              Bhutan-first personal finance
            </p>

            <h1>
              Understand your money.
            </h1>

            <p className="hero-subtitle">
              Plan it. Track it. Grow with it. Money Saathi helps you see
              where your money goes and make better everyday decisions,
              without making finance complicated.
            </p>

            <div className="hero-actions">
              <Link to="/onboarding" className="primary-button">
                Start with Money Saathi
              </Link>

              <Link to="/app" className="secondary-button">
                Open existing Money Saathi
              </Link>
            </div>

            <div className="trust-line" aria-label="Money Saathi principles">
              <span className="trust-item">
                <span className="trust-check" aria-hidden="true">✓</span>
                No bank connection
              </span>

              <span className="trust-item">
                <span className="trust-check" aria-hidden="true">✓</span>
                Your data stays local
              </span>

              <span className="trust-item">
                <span className="trust-check" aria-hidden="true">✓</span>
                Built around Nu.
              </span>

              <span className="trust-item">
                <span className="trust-check" aria-hidden="true">✓</span>
                Made in Bhutan
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
                  A clear view of your money — without financial jargon.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="benefits" id="why-money-saathi">
          <article className="benefit-card">
            <span className="benefit-number">01</span>
            <h2>Know where you stand</h2>
            <p>
              Bring income, spending and savings together so your current
              position is easy to understand.
            </p>
          </article>

          <article className="benefit-card">
            <span className="benefit-number">02</span>
            <h2>Plan without complexity</h2>
            <p>
              Build practical budgets and goals using language made for
              everyday people, not finance professionals.
            </p>
          </article>

          <article className="benefit-card">
            <span className="benefit-number">03</span>
            <h2>Keep control of your data</h2>
            <p>
              Money Saathi is designed to work locally without requiring
              access to your bank account.
            </p>
          </article>
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
