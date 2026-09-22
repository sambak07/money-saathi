import { Link } from 'react-router-dom'

function OnboardingPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '24px',
      }}
    >
      <section
        style={{
          width: 'min(100%, 560px)',
          padding: '32px',
          background: 'white',
          border: '1px solid var(--color-border)',
          borderRadius: '24px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <p
          style={{
            margin: '0 0 12px',
            color: 'var(--color-brand)',
            fontWeight: 700,
          }}
        >
          Money Saathi
        </p>

        <h1
          style={{
            margin: 0,
            fontSize: '40px',
            lineHeight: 1.08,
            letterSpacing: '-0.04em',
          }}
        >
          Let&apos;s set things up.
        </h1>

        <p
          style={{
            margin: '18px 0 28px',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.65,
          }}
        >
          We will build the real onboarding flow in the next stage.
        </p>

        <Link to="/" className="secondary-button">
          Back to home
        </Link>
      </section>
    </main>
  )
}

export default OnboardingPage
