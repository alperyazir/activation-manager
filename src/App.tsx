import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import ProtectedRoute from '@/components/layout/ProtectedRoute'
import AdminLayout from '@/components/layout/AdminLayout'

import CodeEntry from '@/pages/student/CodeEntry'
import RegisterForm from '@/pages/student/RegisterForm'
import Success from '@/pages/student/Success'

import AdminLogin from '@/pages/admin/Login'
import Registrations from '@/pages/admin/Registrations'
import Codes from '@/pages/admin/Codes'
import Settings from '@/pages/admin/Settings'
import Logs from '@/pages/admin/Logs'
import Admins from '@/pages/admin/Admins'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Öğrenci akışı */}
          <Route path="/" element={<CodeEntry />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/success" element={<Success />} />

          {/* Admin */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Registrations />} />
            <Route path="codes" element={<Codes />} />
            <Route path="admins" element={<Admins />} />
            <Route path="settings" element={<Settings />} />
            <Route path="logs" element={<Logs />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
