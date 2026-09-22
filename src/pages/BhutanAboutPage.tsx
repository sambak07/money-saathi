import {
  Link,
} from 'react-router-dom'

import {
  BHUTAN_AUDIENCES,
  BHUTAN_IDENTITY,
  BHUTAN_PRODUCT_PRINCIPLES,
} from '../bhutan/bhutanIdentity'
import AppShell from '../components/AppShell'

import '../styles/bhutan-identity.css'

function BhutanAboutPage() {
  return (
    <AppShell>
      <div className="dashboard-container bhutan-about">
        <section className="bhutan-about-hero">
          <p className="dashboard-eyebrow">
            {BHUTAN_IDENTITY.madeInLabel}
          </p>

          <h1>
            Bhutanese at heart.
            Modern by design.
          </h1>

          <p>
            Money Saathi is being built around how people in
            Bhutan understand, earn, spend, save and plan money.
            The goal is not to decorate a generic finance app
            with Bhutanese symbols. The goal is to make Bhutan
            part of the product itself.
          </p>
        </section>

        <section className="bhutan-about-promise">
          <span>Money Saathi promise</span>

          <strong>
            {BHUTAN_IDENTITY.promise}
          </strong>
        </section>

        <section className="bhutan-principle-grid">
          {BHUTAN_PRODUCT_PRINCIPLES.map(
            (principle, index) => (
              <article key={principle.title}>
                <span>
                  0{index + 1}
                </span>

                <strong>
                  {principle.title}
                </strong>

                <p>
                  {principle.description}
                </p>
              </article>
            ),
          )}
        </section>

        <section className="bhutan-audience-section">
          <p className="dashboard-eyebrow">
            Financial inclusion
          </p>

          <h2>
            One Money Saathi, many kinds of lives
          </h2>

          <p>
            A student should not need to understand the screens
            of a business owner. A pensioner should not be forced
            into salary-first assumptions. People can use the
            level of Money Saathi that fits their life today.
          </p>

          <div className="bhutan-audience-chips">
            {BHUTAN_AUDIENCES.map(
              (audience) => (
                <span key={audience}>
                  {audience}
                </span>
              ),
            )}
          </div>
        </section>

        <section className="bhutan-language-section">
          <div>
            <p className="dashboard-eyebrow">
              Language foundation
            </p>

            <h2>
              English for Bhutan today.
              Dzongkha-ready tomorrow.
            </h2>

            <p>
              The app now declares the Bhutan English locale
              foundation. Dzongkha should be added carefully
              after financial terminology and translations are
              reviewed, rather than inserting unverified wording.
            </p>
          </div>

          <Link to="/app/setup">
            Personalize Money Saathi
          </Link>
        </section>
      </div>
    </AppShell>
  )
}

export default BhutanAboutPage
