import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'

import DashboardPage from './pages/DashboardPage'
import LandingPage from './pages/LandingPage'
import OnboardingPage from './pages/OnboardingPage'
import TransactionFormPage from './pages/TransactionFormPage'
import TransactionsPage from './pages/TransactionsPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route
          path="/onboarding"
          element={<OnboardingPage />}
        />

        <Route
          path="/app"
          element={<DashboardPage />}
        />

        <Route
          path="/app/transactions"
          element={<TransactionsPage />}
        />

        <Route
          path="/app/transactions/new"
          element={<TransactionFormPage />}
        />

        <Route
          path="/app/transactions/:id/edit"
          element={<TransactionFormPage />}
        />

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
