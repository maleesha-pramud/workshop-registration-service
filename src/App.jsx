import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import ProtectedRoute from './routes/ProtectedRoute'
import HomeRedirect from './routes/HomeRedirect'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import ForbiddenPage from './pages/ForbiddenPage'
import NotFoundPage from './pages/NotFoundPage'
import UsersPage from './pages/UsersPage'
import WorkshopsPage from './pages/WorkshopsPage'
import WorkshopDetailPage from './pages/WorkshopDetailPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route index element={<HomeRedirect />} />
                <Route path="forbidden" element={<ForbiddenPage />} />

                <Route element={<ProtectedRoute permission="WORKSHOPS_READ" />}>
                  <Route path="workshops" element={<WorkshopsPage />} />
                  <Route path="workshops/:id" element={<WorkshopDetailPage />} />
                </Route>

                <Route element={<ProtectedRoute permission="USERS_MANAGE" />}>
                  <Route path="users" element={<UsersPage />} />
                </Route>
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Route>
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
