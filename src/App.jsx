// ============================================================
// App.jsx
// Configuración central de rutas con React Router DOM v6
// ============================================================
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import AdminPage from './pages/AdminPage'
import CatalogoPublicoPage from './pages/CatalogoPublicoPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Raíz → login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Login + Registro (tab unificado) */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<LoginPage modoInicial="registro" />} />

          {/* Panel de administración — protegido */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            }
          />

          {/* Catálogo público por slug */}
          <Route path="/tienda/:slug" element={<CatalogoPublicoPage />} />

          {/* 404 */}
          <Route
            path="*"
            element={
              <div style={{ padding: 40, textAlign: 'center', fontFamily: 'sans-serif' }}>
                <h2>404 — Página no encontrada</h2>
                <a href="/">Volver al inicio</a>
              </div>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
