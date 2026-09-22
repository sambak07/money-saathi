import '../styles/dashboard.css'

const futureNavigation = [
  'Transactions',
  'Budget',
  'Regular money',
  'Goals',
  'My Money',
  'Reports',
  'Settings',
]

function DashboardPage() {
  return (
    <div className="app-layout">
      <aside className="app-sidebar">
        <div className="app-brand">
          <span className="app-brand-mark">M</span>
          <span>Money Saathi</span>
        </div>

        <p className="sidebar-label">Overview</p>

        <nav className="sidebar-nav" aria-label="Money Saathi navigation">
          <button type="button" className="sidebar-item active">
            Home
          </button>

          {futureNavigation.map((item) => (
            <button
              key={item}
              type="button"
              className="sidebar-item"
              disabled
              title="Coming in the next build stages"
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          Local-first personal finance
          <br />
          Built around Nu.
        </div>
      </aside>

      <main className="app-main">
        <div className="dashboard-container">
          <header className="dashboard-header">
            <div>
              <p className="dashboard-eyebrow">
                Your money today
              </p>

              <h1>Home</h1>
            </div>

            <button type="button" className="add-money-button" disabled>
              + Add
            </button>
          </header>

          <section
            className="dashboard-grid"
            aria-label="Money overview"
          >
            <article className="dashboard-card">
              <p className="dashboard-card-label">
                Current balance
              </p>

              <h2 className="dashboard-balance">
                Nu. 0.00
              </h2>
            </article>

            <article className="dashboard-card">
              <p className="dashboard-card-label">
                Money in
              </p>

              <h2 className="dashboard-card-value">
                Nu. 0.00
              </h2>
            </article>

            <article className="dashboard-card">
              <p className="dashboard-card-label">
                Money out
              </p>

              <h2 className="dashboard-card-value">
                Nu. 0.00
              </h2>
            </article>
          </section>

          <section className="empty-panel">
            <div className="empty-content">
              <div className="empty-icon" aria-hidden="true">
                +
              </div>

              <h2>Your money story starts here</h2>

              <p>
                You do not have any transactions yet. We will build
                transaction entry and local storage in the next stage.
              </p>

              <button
                type="button"
                className="empty-action"
                disabled
              >
                Add first transaction
              </button>
            </div>
          </section>
        </div>
      </main>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        <button type="button" className="mobile-nav-item active">
          Home
        </button>

        <button type="button" className="mobile-nav-item" disabled>
          Money
        </button>

        <button type="button" className="mobile-nav-item" disabled>
          Goals
        </button>

        <button type="button" className="mobile-nav-item" disabled>
          More
        </button>
      </nav>
    </div>
  )
}

export default DashboardPage
