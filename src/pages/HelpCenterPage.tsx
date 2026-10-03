﻿import {
  Link,
} from 'react-router-dom'

import AppShell from '../components/AppShell'
import HelpManual from '../components/HelpManual'

import '../styles/help-center.css'

interface HelpTask {
  to: string
  title: string
  description: string
  path: string
}

interface GuideItem {
  title: string
  useFor: string
  notFor: string
  to: string
}

const tasks: HelpTask[] = [
  {
    to: '/app/transactions/new',
    title: 'Record money I received or spent',
    description:
      'Add actual personal income or expenses that have already happened.',
    path: 'Transactions → Add',
  },
  {
    to: '/app',
    title: 'Know where my money stands',
    description:
      'See your current money position, recent activity and Safe to Spend.',
    path: 'Home',
  },
  {
    to: '/app/budget',
    title: 'Plan my monthly spending',
    description:
      'Set category limits and compare your plan with actual recorded expenses.',
    path: 'Budget',
  },
  {
    to: '/app/regular-money',
    title: 'Track salary, rent or EMI that repeats',
    description:
      'Create a schedule for money that normally repeats.',
    path: 'Regular money',
  },
  {
    to: '/app/goals',
    title: 'Save towards a goal',
    description:
      'Set a target and track contributions towards something important.',
    path: 'Goals',
  },
  {
    to: '/app/my-money',
    title: 'Track savings, FD or RD',
    description:
      'Keep money set aside separate from everyday income and spending.',
    path: 'My Money',
  },
  {
    to: '/app/my-money/loans',
    title: 'Track an outstanding loan',
    description:
      'Record loan commitments without mixing the loan balance into spending.',
    path: 'My Money → Loans',
  },
  {
    to: '/app/reports',
    title: 'Understand my month',
    description:
      'Review recorded income, expenses, categories and cash-flow patterns.',
    path: 'Reports',
  },
  {
    to: '/app/business',
    title: 'Manage my business',
    description:
      'Use the separate workspace for cash, sales, dues, stock and reports.',
    path: 'Business',
  },
  {
    to: '/app/backup',
    title: 'Protect my Money Saathi records',
    description:
      'Create an encrypted backup you can keep somewhere safe.',
    path: 'More → Encrypted backup',
  },
]

const guideItems: GuideItem[] = [
  {
    title: 'Transactions',
    useFor: 'Money that actually moved.',
    notFor: 'Monthly limits, repeating schedules or own-account transfers.',
    to: '/app/transactions',
  },
  {
    title: 'Budget',
    useFor: 'Planning how much you want to spend by category.',
    notFor: 'Recording an actual expense.',
    to: '/app/budget',
  },
  {
    title: 'Regular money',
    useFor: 'Salary, rent, EMI and other repeating schedules.',
    notFor: 'Changing your balance before the real transaction happens.',
    to: '/app/regular-money',
  },
  {
    title: 'Goals',
    useFor: 'Tracking progress towards a savings target.',
    notFor: 'Treating goal contributions as everyday spending.',
    to: '/app/goals',
  },
  {
    title: 'My Money',
    useFor: 'Savings, FD, RD and tracked financial assets.',
    notFor: 'Daily income and expense records.',
    to: '/app/my-money',
  },
  {
    title: 'Business',
    useFor: 'Business cash, sales, purchases, dues and stock.',
    notFor: 'Mixing business activity into personal money.',
    to: '/app/business',
  },
]

const learnLinks = [
  {
    to: '/app/start',
    label: 'Start Here',
    description: 'Follow Money Saathi’s guided first steps.',
  },
  {
    to: '/app/security',
    label: 'App Lock',
    description: 'Use a local screen-access PIN. App Lock does not encrypt the main financial database.',
  },
  {
    to: '/app/backup',
    label: 'Backup & Restore',
    description: 'Create a password-protected restorable backup. Restore replaces normal backed-up data; it does not merge.',
  },
  {
    to: '/app/saathi/privacy',
    label: 'Ask Saathi permissions',
    description: 'Control record access for Ask Saathi and the floating assistant. Saathi Guide has separate local-summary behavior.',
  },
  {
    to: '/app/install',
    label: 'Install & Offline',
    description: 'Learn how Money Saathi works as an installable offline-capable app.',
  },
  {
    to: '/app/vault',
    label: 'Money Vault',
    description: 'Store limited encrypted financial references with a separate Vault passphrase and separate Vault backup.',
  },
  {
    to: '/app/data-export',
    label: 'Export data',
    description: 'Create readable CSV or JSON files for review. Exports are not restore backups.',
  },
  {
    to: '/app/about',
    label: 'About Money Saathi',
    description: 'Read the Bhutan-first and local-first product principles.',
  },
]

function HelpCenterPage() {
  return (
    <AppShell>
      <div className="dashboard-container help-center-page">
        <header className="help-center-hero">
          <div>
            <p className="dashboard-eyebrow">
              Help & User Guide
            </p>

            <h1>
              You do not need every tab.
            </h1>

            <p>
              Start with what you want to do. Money Saathi will remain
              useful even if you use only Home, Transactions and one or
              two planning tools.
            </p>
          </div>

          <div className="help-center-version">
            <span>Money Saathi</span>
            <strong>3.1.2 Help</strong>
          </div>
        </header>

        <section
          className="help-start-card"
          aria-labelledby="help-start-heading"
        >
          <div>
            <p className="dashboard-eyebrow">
              New to Money Saathi?
            </p>

            <h2 id="help-start-heading">
              Start small. Add more only when it becomes useful.
            </h2>
          </div>

          <ol>
            <li>
              <strong>Record real money movement.</strong>
              <span>
                Add income and expenses through Transactions.
              </span>
            </li>
            <li>
              <strong>Check Home.</strong>
              <span>
                See your current position and recent activity.
              </span>
            </li>
            <li>
              <strong>Add one planning tool.</strong>
              <span>
                Use Budget, Regular money or Goals only if you need it.
              </span>
            </li>
            <li>
              <strong>Create an encrypted backup.</strong>
              <span>
                Local-first records need a safe backup in case browser
                data or the device is lost.
              </span>
            </li>
          </ol>
        </section>

        <section
          className="help-section"
          aria-labelledby="help-task-heading"
        >
          <header className="help-section-heading">
            <p className="dashboard-eyebrow">
              Find the right place
            </p>

            <h2 id="help-task-heading">
              What do you want to do?
            </h2>

            <p>
              Choose your goal instead of searching through every menu.
              Money Saathi does not have an own-account transfer record
              type, so moving money between your own accounts should not
              be recorded as fresh income or expense.
            </p>
          </header>

          <div className="help-task-grid">
            {tasks.map((task) => (
              <Link
                key={task.title}
                to={task.to}
                className="help-task-card"
              >
                <span className="help-task-path">
                  {task.path}
                </span>

                <strong>
                  {task.title}
                </strong>

                <p>
                  {task.description}
                </p>

                <span
                  className="help-task-open"
                  aria-hidden="true"
                >
                  Open →
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section
          className="help-section"
          aria-labelledby="help-tabs-heading"
        >
          <header className="help-section-heading">
            <p className="dashboard-eyebrow">
              Avoid common confusion
            </p>

            <h2 id="help-tabs-heading">
              Which tab should I use?
            </h2>

            <p>
              The important difference is whether you are recording
              something that happened, planning ahead or tracking money
              kept separately.
            </p>
          </header>

          <div className="help-guide-list">
            {guideItems.map((item) => (
              <article
                key={item.title}
                className="help-guide-row"
              >
                <div className="help-guide-name">
                  <strong>
                    {item.title}
                  </strong>
                </div>

                <div>
                  <span className="help-guide-label">
                    Use it for
                  </span>
                  <p>
                    {item.useFor}
                  </p>
                </div>

                <div>
                  <span className="help-guide-label">
                    Not for
                  </span>
                  <p>
                    {item.notFor}
                  </p>
                </div>

                <Link
                  to={item.to}
                  aria-label={'Open ' + item.title}
                >
                  Open
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section
          className="help-security-card"
          aria-labelledby="help-security-heading"
        >
          <div>
            <p className="dashboard-eyebrow">
              Privacy & Safety
            </p>

            <h2 id="help-security-heading">
              Money Saathi never needs your banking credentials.
            </h2>

            <p>
              Your core financial records stay on your device. Money
              Saathi does not log in to your bank or move money from
              your bank account. App Lock protects screen access; normal
              encrypted backup, Money Vault and Vault backup use separate
              protection and should not be treated as the same secret.
            </p>
          </div>

          <div className="help-security-points">
            <span>Never enter your bank PIN</span>
            <span>Never enter an ATM or card PIN</span>
            <span>Never enter an OTP or CVV</span>
            <span>Never enter a banking password</span>
            <span>App Lock PIN is only for Money Saathi</span>
            <span>Create encrypted backups regularly</span>
          </div>
        </section>

        <section
          className="help-section"
          aria-labelledby="help-learn-heading"
        >
          <header className="help-section-heading">
            <p className="dashboard-eyebrow">
              Learn more
            </p>

            <h2 id="help-learn-heading">
              Safety, setup and deeper guidance
            </h2>
          </header>

          <div className="help-learn-grid">
            {learnLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="help-learn-card"
              >
                <strong>
                  {item.label}
                </strong>

                <span>
                  {item.description}
                </span>

                <span
                  className="help-task-open"
                  aria-hidden="true"
                >
                  Open →
                </span>
              </Link>
            ))}
          </div>
        </section>

        <HelpManual />

        <p className="help-center-footnote">
          Money Saathi is a personal finance tracking and planning tool.
          It does not move money and does not replace professional
          accounting, tax, legal or regulated financial advice.
        </p>
      </div>
    </AppShell>
  )
}

export default HelpCenterPage
