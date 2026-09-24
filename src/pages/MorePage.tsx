import { Link } from 'react-router-dom'

import AppShell from '../components/AppShell'
import '../styles/more.css'

interface MoreLink {
  to: string
  label: string
  description: string
}

interface MoreGroup {
  title: string
  links: MoreLink[]
}

const groups: MoreGroup[] = [
  {
    title: 'Plan and understand',
    links: [
      {
        to: '/app/month',
        label: 'My Month',
        description: 'See recorded money, commitments, Safe to Spend and the rest of this month together.',
      },
      {
        to: '/app/forecast',
        label: 'Cash-flow forecast',
        description: 'Look 30, 60 and 90 days ahead using your recorded balance and Regular Money schedule.',
      },
      {
        to: '/app/debt-goals',
        label: 'Debt & goals',
        description: 'Understand recorded debt, liquid savings and the funding pace of your goals.',
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
        to: '/app/upcoming',
        label: 'Upcoming',
        description: 'See money events that are coming next.',
      },
      {
        to: '/app/calendar',
        label: 'Money calendar',
        description: 'View scheduled money by date.',
      },
      {
        to: '/app/money-health',
        label: 'Money health',
        description: 'Understand the signals in your records.',
      },
      {
        to: '/app/saathi',
        label: 'Saathi',
        description: 'Get plain-language financial guidance from your own local records.',
      },
      {
        to: '/app/saathi/ask',
        label: 'Ask Saathi',
        description: 'Run verified local tools for affordability, spending, attention and debt.',
      },
      {
        to: '/app/explain',
        label: 'Explain my money',
        description: 'See how Money Saathi reached its figures.',
      },
      {
        to: '/app/financial-safety',
        label: 'Financial safety',
        description: 'Plan a practical safety reserve.',
      },
      {
        to: '/app/irregular-income',
        label: 'Income rhythm',
        description: 'Adapt planning for uneven income.',
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
    links: [
      {
        to: '/app/my-money',
        label: 'My Money',
        description: 'Savings, deposits and tracked assets.',
      },
      {
        to: '/app/vault',
        label: 'Money Vault',
        description: 'Keep important financial reference numbers encrypted on this device.',
      },
      {
        to: '/app/my-money/loans',
        label: 'Loans',
        description: 'Track outstanding loan commitments.',
      },
      {
        to: '/app/my-money/schemes',
        label: 'Schemes',
        description: 'Keep financial schemes and commitments together.',
      },
      {
        to: '/app/loan-reminders',
        label: 'Loan reminders',
        description: 'Review verified payment reminders.',
      },
      {
        to: '/app/business',
        label: 'Business',
        description: 'Keep business money separate from personal money.',
      },
      {
        to: '/app/business/credit',
        label: 'Customers & dues',
        description: 'Track customers, suppliers, receivables and payables for a business.',
      },
      {
        to: '/app/business/inventory',
        label: 'Inventory',
        description: 'Track stock items, quantities, unit cost and low-stock levels.',
      },
      {
        to: '/app/business/trade',
        label: 'Sales & purchases',
        description: 'Record item-level sales, purchases, payment-at-entry and explicit COGS.',
      },
    ],
  },
  {
    title: 'Privacy, data and setup',
    links: [
      {
        to: '/app/alerts',
        label: 'Alerts',
        description: 'Review reminders that need attention.',
      },
      {
        to: '/app/saathi/privacy',
        label: 'Saathi data permissions',
        description: 'Control and preview what local Saathi question tools may use.',
      },
      {
        to: '/app/security',
        label: 'App Lock',
        description: 'Manage the local six-digit privacy lock.',
      },
      {
        to: '/app/backup',
        label: 'Backup',
        description: 'Create or restore an encrypted local backup.',
      },
      {
        to: '/app/data-export',
        label: 'Export data',
        description: 'Export readable local CSV records.',
      },
      {
        to: '/app/settings',
        label: 'Settings',
        description: 'Manage preferences and local data controls.',
      },
      {
        to: '/app/setup',
        label: 'My setup',
        description: 'Adjust what Money Saathi prioritizes for you.',
      },
      {
        to: '/app/install',
        label: 'Install',
        description: 'Install Money Saathi as an app when supported.',
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

function MorePage() {
  return (
    <AppShell>
      <div className="dashboard-container more-page">
        <header className="more-header">
          <p className="dashboard-eyebrow">
            All tools
          </p>

          <h1>More</h1>

          <p>
            Find planning, privacy, data and advanced tools here.
            Your everyday money actions stay easy to reach from
            the main navigation.
          </p>
        </header>

        <div className="more-groups">
          {groups.map((group) => (
            <section
              key={group.title}
              className="more-group"
              aria-labelledby={
                `more-${group.title
                  .toLowerCase()
                  .replaceAll(' ', '-')}`
              }
            >
              <h2
                id={
                  `more-${group.title
                    .toLowerCase()
                    .replaceAll(' ', '-')}`
                }
              >
                {group.title}
              </h2>

              <div className="more-link-list">
                {group.links.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="more-link-row"
                  >
                    <span>
                      <strong>{item.label}</strong>
                      <small>{item.description}</small>
                    </span>

                    <span
                      className="more-link-arrow"
                      aria-hidden="true"
                    >
                      →
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </AppShell>
  )
}

export default MorePage