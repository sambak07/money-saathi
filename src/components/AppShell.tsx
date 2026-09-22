import BhutanMark from './BhutanMark'
import '../styles/accessibility.css'
import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

import '../styles/dashboard.css'

interface AppShellProps {
  children: ReactNode
}

const futureItems: string[] = []

function AppShell({ children }: AppShellProps) {
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
              isActive ? 'sidebar-item active' : 'sidebar-item'
            }
          >
            Home
          </NavLink>

          <NavLink
            to="/app/transactions"
            className={({ isActive }) =>
              isActive ? 'sidebar-item active' : 'sidebar-item'
            }
          >
            Transactions
          </NavLink>

          <NavLink
            to="/app/budget"
            className={({ isActive }) =>
              isActive ? 'sidebar-item active' : 'sidebar-item'
            }
          >
            Budget
          </NavLink>

          <NavLink
            to="/app/regular-money"
            className={({ isActive }) =>
              isActive ? 'sidebar-item active' : 'sidebar-item'
            }
          >
            Regular money
          </NavLink>

          <NavLink
            to="/app/goals"
            className={({ isActive }) =>
              isActive ? 'sidebar-item active' : 'sidebar-item'
            }
          >
            Goals
          </NavLink>

          <NavLink
            to="/app/my-money"
            className={({ isActive }) =>
              isActive ? 'sidebar-item active' : 'sidebar-item'
            }
          >
            My Money
          </NavLink>

          <NavLink
            to="/app/my-money/loans"
            className={({ isActive }) =>
              isActive ? 'sidebar-item active' : 'sidebar-item'
            }
          >
            Loans
          </NavLink>

          <NavLink
            to="/app/my-money/schemes"
            className={({ isActive }) =>
              isActive ? 'sidebar-item active' : 'sidebar-item'
            }
          >
            Schemes
          </NavLink>

          <NavLink
            to="/app/reports"
            className={({ isActive }) =>
              isActive ? 'sidebar-item active' : 'sidebar-item'
            }
          >
            Reports
          </NavLink>

                    <NavLink
            to="/app/security"
            className={({ isActive }) =>
              isActive ? 'sidebar-item active' : 'sidebar-item'
            }
          >
            App Lock
          </NavLink>
          <NavLink
            to="/app/backup"
            className={({ isActive }) =>
              isActive ? 'sidebar-item active' : 'sidebar-item'
            }
          >
            Backup
          </NavLink>
          <NavLink
            to="/app/settings"
            className={({ isActive }) =>
              isActive ? 'sidebar-item active' : 'sidebar-item'
            }
          >
            Settings
          </NavLink>
          <NavLink
            to="/app/install"
            className={({ isActive }) =>
              isActive ? 'sidebar-item active' : 'sidebar-item'
            }
          >
            Install
          </NavLink>
{futureItems.map((item) => (
            <button
              key={item}
              type="button"
              className="sidebar-item"
              disabled
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          Your core money records stay on this device.
        </div>
      </aside>

      <main id="main-content" tabIndex={-1} className="app-main">
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
          className={({ isActive }) =>
            isActive ? 'mobile-nav-item active' : 'mobile-nav-item'
          }
        >
          Home
        </NavLink>

        <NavLink
          to="/app/transactions"
          className={({ isActive }) =>
            isActive ? 'mobile-nav-item active' : 'mobile-nav-item'
          }
        >
          Txns
        </NavLink>

        <NavLink
          to="/app/budget"
          className={({ isActive }) =>
            isActive ? 'mobile-nav-item active' : 'mobile-nav-item'
          }
        >
          Budget
        </NavLink>

        <NavLink
          to="/app/regular-money"
          className={({ isActive }) =>
            isActive ? 'mobile-nav-item active' : 'mobile-nav-item'
          }
        >
          Regular
        </NavLink>

        <NavLink
          to="/app/goals"
          className={({ isActive }) =>
            isActive ? 'mobile-nav-item active' : 'mobile-nav-item'
          }
        >
          Goals
        </NavLink>

        <NavLink
          to="/app/my-money"
          className={({ isActive }) =>
            isActive ? 'mobile-nav-item active' : 'mobile-nav-item'
          }
        >
          Money
        </NavLink>
      </nav>
    </div>
  )
}

export default AppShell












