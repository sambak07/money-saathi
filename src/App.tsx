import { lazy, Suspense } from 'react'
import './styles/route-loading.css'
import AdaptiveHomeRoute from './components/AdaptiveHomeRoute'
import PwaUpdatePrompt from './components/PwaUpdatePrompt'









import AppLockGate from './security/AppLockGate'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'











const IrregularIncomePage = lazy(() => import('./pages/IrregularIncomePage'))
const FinancialSafetyPage = lazy(() => import('./pages/FinancialSafetyPage'))
const GettingStartedPage = lazy(() => import('./pages/GettingStartedPage'))
const BhutanAboutPage = lazy(() => import('./pages/BhutanAboutPage'))
const MoneyHealthPage = lazy(() => import('./pages/MoneyHealthPage'))
const MoneyTimelinePage = lazy(() => import('./pages/MoneyTimelinePage'))
const BusinessPage = lazy(() => import('./pages/BusinessPage'))
const SafetyBufferPage = lazy(() => import('./pages/SafetyBufferPage'))
const AdaptiveSetupPage = lazy(() => import('./pages/AdaptiveSetupPage'))
const InstallPage = lazy(() => import('./pages/InstallPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const BackupPage = lazy(() => import('./pages/BackupPage'))
const SecurityPage = lazy(() => import('./pages/SecurityPage'))
const BudgetPage = lazy(() => import('./pages/BudgetPage'))
const GoalsPage = lazy(() => import('./pages/GoalsPage'))
const LandingPage = lazy(() => import('./pages/LandingPage'))
const LoansPage = lazy(() => import('./pages/LoansPage'))
const MyMoneyPage = lazy(() => import('./pages/MyMoneyPage'))
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'))
const RegularMoneyPage = lazy(() => import('./pages/RegularMoneyPage'))
const ReportsPage = lazy(() => import('./pages/ReportsPage'))
const SchemesPage = lazy(() => import('./pages/SchemesPage'))
const TransactionFormPage = lazy(() => import('./pages/TransactionFormPage'))
const TransactionsPage = lazy(() => import('./pages/TransactionsPage'))

const ExplainMoneyPage = lazy(() => import('./pages/ExplainMoneyPage'))
const DataExportPage = lazy(() => import('./pages/DataExportPage'))
const MoneyCalendarPage = lazy(() => import('./pages/MoneyCalendarPage'))
const AlertCentrePage = lazy(() => import('./pages/AlertCentrePage'))
const LoanRemindersPage = lazy(() => import('./pages/LoanRemindersPage'))
const MorePage = lazy(() => import('./pages/MorePage'))

function App() {
  return (
    <BrowserRouter>
      <PwaUpdatePrompt />
      <AppLockGate>
        <Suspense
        fallback={
          <div
            className="route-loading-shell"
            role="status"
            aria-live="polite"
          >
            Loading Money Saathi…
          </div>
        }
      >
        <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/app" element={<AdaptiveHomeRoute />} />
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
        <Route path="/app/backup" element={<BackupPage />} />
        <Route path="/app/settings" element={<SettingsPage />} />
        <Route path="/app/install" element={<InstallPage />} />
        <Route path="/app/setup" element={<AdaptiveSetupPage />} />
        <Route path="/app/safety-buffer" element={<SafetyBufferPage />} />
        <Route path="/app/business" element={<BusinessPage />} />
        <Route path="/app/upcoming" element={<MoneyTimelinePage />} />
        <Route path="/app/money-health" element={<MoneyHealthPage />} />
        <Route path="/app/about" element={<BhutanAboutPage />} />
        <Route path="/app/start" element={<GettingStartedPage />} />
        <Route path="/app/financial-safety" element={<FinancialSafetyPage />} />
        <Route path="/app/irregular-income" element={<IrregularIncomePage />} />
        <Route path="/app/explain" element={<ExplainMoneyPage />} />
        <Route path="/app/data-export" element={<DataExportPage />} />
        <Route path="/app/calendar" element={<MoneyCalendarPage />} />
        <Route path="/app/alerts" element={<AlertCentrePage />} />
        <Route path="/app/loan-reminders" element={<LoanRemindersPage />} />
        <Route path="/app/more" element={<MorePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      </AppLockGate>
    </BrowserRouter>
  )
}

export default App
























