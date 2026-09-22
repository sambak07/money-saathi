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
import MyMoneyPage from './pages/MyMoneyPage'
import OnboardingPage from './pages/OnboardingPage'
import RegularMoneyPage from './pages/RegularMoneyPage'
import TransactionFormPage from './pages/TransactionFormPage'
import TransactionsPage from './pages/TransactionsPage'

function App() {
  return (
    <BrowserRouter>
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

