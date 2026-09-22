import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

import '../styles/dashboard.css'

interface AppShellProps {
  children: ReactNode
}

const futureItems = [
  'My Money',
  'Reports',
  'Settings',
]

function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-layout">
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

      <main className="app-main">{children}</main>

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
      </nav>
    </div>
  )
}

export default AppShell
