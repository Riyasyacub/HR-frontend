import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import DashboardPage from './pages/DashboardPage'
import EmployeeProfilePage from './pages/EmployeeProfilePage'
import EmployeesPage from './pages/EmployeesPage'
import NewEmployeePage from './pages/NewEmployeePage'
import SettingsPage from './pages/SettingsPage'
import SignInPage from './pages/SignInPage'

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

export default function App() {
  return (
    <Routes>
      <Route path="/sign-in" element={<SignInPage />} />
      <Route element={<RequireAuth />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/employees/:id" element={<EmployeeProfilePage />} />
        <Route element={<RequireHr />}>
          <Route path="/employees" element={<EmployeesPage />} />
          <Route path="/employees/new" element={<NewEmployeePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}
