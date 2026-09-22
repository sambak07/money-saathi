import SecurityPage from './pages/SecurityPage'
import AppLockGate from './security/AppLockGate'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'

import BudgetPage from './pages/BudgetPage'
import DashboardPage from './pages/DashboardPage'
import GoalsPage from './pages/GoalsPage'
import LandingPage from './pages/LandingPage'
import LoansPage from './pages/LoansPage'
import MyMoneyPage from './pages/MyMoneyPage'
import OnboardingPage from './pages/OnboardingPage'
import RegularMoneyPage from './pages/RegularMoneyPage'
import ReportsPage from './pages/ReportsPage'
import SchemesPage from './pages/SchemesPage'
import TransactionFormPage from './pages/TransactionFormPage'
import TransactionsPage from './pages/TransactionsPage'

function App() {
  return (
    <BrowserRouter>
      <AppLockGate>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/app" element={<DashboardPage />} />
        <Route path="/app/transactions" element={<TransactionsPage />} />
        <Route
          path="/app/transactions/new"
          element={<TransactionFormPage />}
        />
        <Route
          path="/app/transactions/:id/edit"
          element={<TransactionFormPage />}
        />
        <Route path="/app/budget" element={<BudgetPage />} />
        <Route
          path="/app/regular-money"
          element={<RegularMoneyPage />}
        />
        <Route path="/app/goals" element={<GoalsPage />} />
        <Route path="/app/my-money" element={<MyMoneyPage />} />
        <Route
          path="/app/my-money/loans"
          element={<LoansPage />}
        />
        <Route
          path="/app/my-money/schemes"
          element={<SchemesPage />}
        />
        <Route path="/app/reports" element={<ReportsPage />} />
                <Route path="/app/security" element={<SecurityPage />} />
<Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLockGate>
    </BrowserRouter>
  )
}

export default App





