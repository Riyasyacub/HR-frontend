import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import DashboardPage from './pages/DashboardPage'
import EmployeeImportPage from './pages/EmployeeImportPage'
import EmployeeProfilePage from './pages/EmployeeProfilePage'
import EmployeesPage from './pages/EmployeesPage'
import NewEmployeePage from './pages/NewEmployeePage'
import LeaveRecordsPage from './pages/LeaveRecordsPage'
import LeaveUploadPage from './pages/LeaveUploadPage'
import PayrollRunPage from './pages/PayrollRunPage'
import PayrollRunsPage from './pages/PayrollRunsPage'
import ReportsPage from './pages/ReportsPage'
import SettingsPage from './pages/SettingsPage'
import SignInPage from './pages/SignInPage'
import TeamPage from './pages/TeamPage'

function RequireAuth() {
  const { status } = useAuth()
  if (status === 'loading') return <main className="p-6">Loading…</main>
  if (status === 'unauthenticated') return <Navigate to="/sign-in" replace />
  return <Outlet />
}

function RequireHr() {
  const { session } = useAuth()
  return session?.user.role === 'HR' ? <Outlet /> : <Navigate to="/dashboard" replace />
}

function RequireReportAccess() {
  const { session } = useAuth()
  return session?.user.role === 'HR' || session?.user.is_manager ? <Outlet /> : <Navigate to="/dashboard" replace />
}

function RequireManager() {
  const { session } = useAuth()
  return session?.user.is_manager ? <Outlet /> : <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/sign-in" element={<SignInPage />} />
      <Route element={<RequireAuth />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/employees/:id" element={<EmployeeProfilePage />} />
        <Route path="/leave-records" element={<LeaveRecordsPage />} />
        <Route element={<RequireReportAccess />}>
          <Route path="/reports" element={<ReportsPage />} />
        </Route>
        <Route element={<RequireManager />}>
          <Route path="/team" element={<TeamPage />} />
        </Route>
        <Route element={<RequireHr />}>
          <Route path="/employees" element={<EmployeesPage />} />
          <Route path="/employees/new" element={<NewEmployeePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/leave-upload" element={<LeaveUploadPage />} />
          <Route path="/employee-import" element={<EmployeeImportPage />} />
          <Route path="/payroll" element={<PayrollRunsPage />} />
          <Route path="/payroll/:id" element={<PayrollRunPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}
