import {
  Link,
} from 'react-router-dom'

import AppShell from '../components/AppShell'

import '../styles/business-quick-add.css'

const quickActions = [
  {
    to: '/app/business/trade',
    title: 'Sale',
    description:
      'Record what you sold, how much was paid now, and item-level COGS.',
    note:
      'Use this when goods or services were sold.',
  },
  {
    to: '/app/business/trade',
    title: 'Purchase',
    description:
      'Record stock or goods purchased for the business.',
    note:
      'Use this for purchase-register entries, not ordinary running expenses.',
  },
  {
    to: '/app/business/cash',
    title: 'Expense',
    description:
      'Record rent, transport, wages, utilities or another cash expense.',
    note:
      'This records actual business money going out.',
  },
  {
    to: '/app/business/credit',
    title: 'Payment received',
    description:
      'Update money collected from a customer who owed the business.',
    note:
      'Record the related cash movement separately when money actually arrives.',
  },
  {
    to: '/app/business/credit',
    title: 'Payment made',
    description:
      'Update money paid to a supplier the business owed.',
    note:
      'Record the related cash movement separately when money actually leaves.',
  },
] as const

function BusinessQuickAddPage() {
  return (
    <AppShell>
      <div className="dashboard-container business-quick-add-page">
        <header className="business-quick-add-header">
          <div>
            <p className="dashboard-eyebrow">
              Business
            </p>

            <h1>
              Add
            </h1>

            <p>
              Choose what happened. Money Saathi will take you to the
              right business record without mixing sales, cash and dues.
            </p>
          </div>

          <Link to="/app/business">
            Business Home
          </Link>
        </header>

        <section className="business-quick-add-grid">
          {quickActions.map(
            (action) => (
              <Link
                key={
                  action.title
                }
                to={
                  action.to
                }
                className="business-quick-add-card"
              >
                <span>
                  Record
                </span>

                <strong>
                  {action.title}
                </strong>

                <p>
                  {action.description}
                </p>

                <small>
                  {action.note}
                </small>
              </Link>
            ),
          )}
        </section>

        <section className="business-quick-add-boundary">
          <strong>
            Simple on the surface. Separate underneath.
          </strong>

          <span>
            A sale is not automatically cash received. A customer due is
            not cash in hand. A stock purchase is not the same thing as
            every business expense. Money Saathi keeps those records
            separate so the simple overview stays financially truthful.
          </span>
        </section>

        <section className="business-quick-add-secondary">
          <p className="dashboard-eyebrow">
            Other
          </p>

          <div>
            <Link to="/app/business/inventory">
              Stock
            </Link>

            <Link to="/app/business/credit">
              Customers & suppliers
            </Link>

            <Link to="/app/business/cash">
              Business cash
            </Link>

            <Link to="/app/business/trade">
              Sales & purchase register
            </Link>
          </div>
        </section>
      </div>
    </AppShell>
  )
}

export default BusinessQuickAddPage