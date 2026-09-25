import {
  Link,
} from 'react-router-dom'

import AppShell from '../components/AppShell'

import '../styles/more.css'

interface MoreLink {
  to: string
  label: string
  description: string
}

interface MoreGroup {
  title: string
  description: string
  links: MoreLink[]
}

const quickLinks: MoreLink[] = [
  {
    to: '/app/month',
    label: 'My Month',
    description: 'See this month’s money position and plan.',
  },
  {
    to: '/app/forecast',
    label: 'Forecast',
    description: 'Look ahead 30, 60 and 90 days.',
  },
  {
    to: '/app/alerts',
    label: 'Alerts',
    description: 'See dates and commitments needing attention.',
  },
  {
    to: '/app/saathi/ask',
    label: 'Ask Saathi',
    description: 'Use local financial guidance from your records.',
  },
  {
    to: '/app/my-money',
    label: 'My Money',
    description: 'Savings, deposits and tracked assets.',
  },
  {
    to: '/app/business',
    label: 'Business',
    description: 'Open your separate business workspace.',
  },
]

const groups: MoreGroup[] = [
  {
    title: 'Plan and understand',
    description:
      'Budget, upcoming money and deeper planning tools.',
    links: [
      {
        to: '/app/budget',
        label: 'Budget',
        description: 'Plan monthly spending.',
      },
      {
        to: '/app/regular-money',
        label: 'Regular money',
        description: 'Track repeating income and expenses.',
      },
      {
        to: '/app/goals',
        label: 'Goals',
        description: 'Plan money for things that matter.',
      },
      {
        to: '/app/debt-goals',
        label: 'Debt & goal plan',
        description: 'Compare debt reduction and goal progress.',
      },
      {
        to: '/app/upcoming',
        label: 'Upcoming',
        description: 'See money events coming next.',
      },
      {
        to: '/app/calendar',
        label: 'Money calendar',
        description: 'View scheduled money by date.',
      },
      {
        to: '/app/money-health',
        label: 'Money health',
        description: 'Understand signals in your records.',
      },
      {
        to: '/app/financial-safety',
        label: 'Financial safety',
        description: 'Plan a practical safety reserve.',
      },
      {
        to: '/app/irregular-income',
        label: 'Income rhythm',
        description: 'Plan around uneven income.',
      },
      {
        to: '/app/explain',
        label: 'Explain my money',
        description: 'See how Money Saathi reached its figures.',
      },
      {
        to: '/app/reports',
        label: 'Reports',
        description: 'Review recorded money over time.',
      },
    ],
  },
  {
    title: 'Money and commitments',
    description:
      'Loans, schemes, reminders and protected references.',
    links: [
      {
        to: '/app/my-money/loans',
        label: 'Loans',
        description: 'Track outstanding loan commitments.',
      },
      {
        to: '/app/my-money/schemes',
        label: 'Schemes',
        description: 'Track financial schemes and commitments.',
      },
      {
        to: '/app/loan-reminders',
        label: 'Loan reminders',
        description: 'Manage user-verified payment dates.',
      },
      {
        to: '/app/vault',
        label: 'Money Vault',
        description: 'Keep financial reference numbers encrypted.',
      },
    ],
  },
  {
    title: 'Privacy, data and setup',
    description:
      'Security, backup, permissions and app preferences.',
    links: [
      {
        to: '/app/saathi/privacy',
        label: 'Saathi data permissions',
        description: 'Control which local records Saathi may use.',
      },
      {
        to: '/app/security',
        label: 'App Lock',
        description: 'Manage the local six-digit privacy lock.',
      },
      {
        to: '/app/backup',
        label: 'Encrypted backup',
        description: 'Create or restore a protected local backup.',
      },
      {
        to: '/app/data-export',
        label: 'Export data',
        description: 'Create readable CSV or JSON exports.',
      },
      {
        to: '/app/settings',
        label: 'Settings',
        description: 'Manage preferences and local data controls.',
      },
      {
        to: '/app/setup',
        label: 'My setup',
        description: 'Adjust what Money Saathi prioritizes.',
      },
      {
        to: '/app/install',
        label: 'Install',
        description: 'Install Money Saathi when supported.',
      },
      {
        to: '/app/start',
        label: 'Start Here',
        description: 'Return to the guided first steps.',
      },
      {
        to: '/app/about',
        label: 'About Money Saathi',
        description: 'Read the local-first product principles.',
      },
    ],
  },
]

function MoreLinkRow({
  item,
}: {
  item: MoreLink
}) {
  return (
    <Link
      to={item.to}
      className="more-link-row"
    >
      <span>
        <strong>
          {item.label}
        </strong>

        <small>
          {item.description}
        </small>
      </span>

      <span
        className="more-link-arrow"
        aria-hidden="true"
      >
        →
      </span>
    </Link>
  )
}

function MorePage() {
  return (
    <AppShell>
      <div className="dashboard-container more-page">
        <header className="more-header">
          <p className="dashboard-eyebrow">
            More tools
          </p>

          <h1>More</h1>

          <p>
            Start with the shortcuts below. Open a section only
            when you need deeper planning, money records or
            privacy controls.
          </p>
        </header>

        <section
          className="more-quick"
          aria-labelledby="more-quick-heading"
        >
          <div className="more-section-heading">
            <div>
              <p className="dashboard-eyebrow">
                Useful now
              </p>

              <h2 id="more-quick-heading">
                Quick tools
              </h2>
            </div>
          </div>

          <div className="more-quick-grid">
            {quickLinks.map(
              (item) => (
                <MoreLinkRow
                  key={item.to}
                  item={item}
                />
              ),
            )}
          </div>
        </section>

        <div className="more-groups">
          {groups.map(
            (group) => (
              <details
                key={group.title}
                className="more-group"
              >
                <summary>
                  <span>
                    <strong>
                      {group.title}
                    </strong>

                    <small>
                      {group.description}
                    </small>
                  </span>

                  <span
                    className="more-summary-mark"
                    aria-hidden="true"
                  >
                    +
                  </span>
                </summary>

                <div className="more-link-list">
                  {group.links.map(
                    (item) => (
                      <MoreLinkRow
                        key={item.to}
                        item={item}
                      />
                    ),
                  )}
                </div>
              </details>
            ),
          )}
        </div>

        <p className="more-footnote">
          Your everyday navigation stays in the main menu.
          These are supporting tools, not extra steps you need
          to complete.
        </p>
      </div>
    </AppShell>
  )
}

export default MorePage