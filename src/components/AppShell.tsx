import AlertNotifier from './AlertNotifier'
import BhutanMark from './BhutanMark'
import '../styles/accessibility.css'
import type { ReactNode } from 'react'
import {
  NavLink,
  useLocation,
} from 'react-router-dom'

import {
  getProfile,
} from '../profile/userProfile'

import '../styles/dashboard.css'

interface AppShellProps {
  children: ReactNode
}

const sidebarMorePrefixes = [
  '/app/security',
  '/app/backup',
  '/app/settings',
  '/app/install',
  '/app/setup',
  '/app/safety-buffer',
  '/app/business',
  '/app/upcoming',
  '/app/money-health',
  '/app/about',
  '/app/start',
  '/app/financial-safety',
  '/app/irregular-income',
  '/app/explain',
  '/app/data-export',
  '/app/calendar',
  '/app/alerts',
  '/app/loan-reminders',
]

const planPrefixes = [
  '/app/budget',
  '/app/regular-money',
  '/app/goals',
]

function isWithin(
  pathname: string,
  prefix: string,
): boolean {
  return (
    pathname === prefix ||
    pathname.startsWith(`${prefix}/`)
  )
}

function AppShell({ children }: AppShellProps) {
  const { pathname } = useLocation()

  const showBusiness =
    getProfile().needs.includes(
      'small-business',
    )

  const sidebarMoreActive =
    pathname === '/app/more' ||
    sidebarMorePrefixes.some((prefix) => {
      if (
        prefix === '/app/business' &&
        showBusiness
      ) {
        return false
      }

      return isWithin(
        pathname,
        prefix,
      )
    })

  const mobileHomeActive =
    pathname === '/app'

  const mobileAddActive =
    pathname === '/app/transactions/new'

  const mobileTransactionsActive =
    pathname === '/app/transactions' ||
    (
      pathname.startsWith('/app/transactions/') &&
      !mobileAddActive
    )

  const mobilePlanActive =
    planPrefixes.some((prefix) =>
      isWithin(pathname, prefix),
    )

  const mobileMoreActive =
    !mobileHomeActive &&
    !mobileTransactionsActive &&
    !mobileAddActive &&
    !mobilePlanActive

  return (
    <div className="app-layout">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <aside className="app-sidebar">
        <NavLink to="/" className="app-brand">
          <span className="app-brand-mark">M</span>
          <span>Money Saathi</span>
        </NavLink>

        <p className="sidebar-label">Money</p>

        <nav
          className="sidebar-nav"
          aria-label="Money Saathi navigation"
        >
          <NavLink
            to="/app"
            end
            className={({ isActive }) =>
              isActive
                ? 'sidebar-item active'
                : 'sidebar-item'
            }
          >
            Home
          </NavLink>

          <NavLink
            to="/app/transactions"
            className={({ isActive }) =>
              isActive
                ? 'sidebar-item active'
                : 'sidebar-item'
            }
          >
            Transactions
          </NavLink>

          <NavLink
            to="/app/budget"
            className={({ isActive }) =>
              isActive
                ? 'sidebar-item active'
                : 'sidebar-item'
            }
          >
            Budget
          </NavLink>

          <NavLink
            to="/app/regular-money"
            className={({ isActive }) =>
              isActive
                ? 'sidebar-item active'
                : 'sidebar-item'
            }
          >
            Regular money
          </NavLink>

          <NavLink
            to="/app/goals"
            className={({ isActive }) =>
              isActive
                ? 'sidebar-item active'
                : 'sidebar-item'
            }
          >
            Goals
          </NavLink>

          <NavLink
            to="/app/my-money"
            className={({ isActive }) =>
              isActive
                ? 'sidebar-item active'
                : 'sidebar-item'
            }
          >
            My Money
          </NavLink>

          {showBusiness && (
            <NavLink
              to="/app/business"
              className={({ isActive }) =>
                isActive
                  ? 'sidebar-item active'
                  : 'sidebar-item'
              }
            >
              Business
            </NavLink>
          )}

          <NavLink
            to="/app/reports"
            className={({ isActive }) =>
              isActive
                ? 'sidebar-item active'
                : 'sidebar-item'
            }
          >
            Reports
          </NavLink>

          <NavLink
            to="/app/more"
            className={
              sidebarMoreActive
                ? 'sidebar-item active'
                : 'sidebar-item'
            }
          >
            More
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          Your core money records stay on this device.
        </div>
      </aside>

      <main
        id="main-content"
        tabIndex={-1}
        className="app-main"
      >
        <AlertNotifier />
        <BhutanMark />
        {children}
      </main>

      <nav
        className="mobile-nav"
        aria-label="Mobile navigation"
      >
        <NavLink
          to="/app"
          end
          className={
            mobileHomeActive
              ? 'mobile-nav-item active'
              : 'mobile-nav-item'
          }
        >
          Home
        </NavLink>

        <NavLink
          to="/app/transactions"
          className={
            mobileTransactionsActive
              ? 'mobile-nav-item active'
              : 'mobile-nav-item'
          }
        >
          Txns
        </NavLink>

        <NavLink
          to="/app/transactions/new"
          className={
            mobileAddActive
              ? 'mobile-nav-item mobile-nav-add active'
              : 'mobile-nav-item mobile-nav-add'
          }
        >
          Add
        </NavLink>

        <NavLink
          to="/app/budget"
          className={
            mobilePlanActive
              ? 'mobile-nav-item active'
              : 'mobile-nav-item'
          }
        >
          Plan
        </NavLink>

        <NavLink
          to="/app/more"
          className={
            mobileMoreActive
              ? 'mobile-nav-item active'
              : 'mobile-nav-item'
          }
        >
          More
        </NavLink>
      </nav>
    </div>
  )
}

export default AppShell