// ============================================================
// components/ProtectedRoute.jsx
// Guard: redirige a /login si no hay sesión activa
// ============================================================
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { tienda } = useAuth()

  if (!tienda) {
    return <Navigate to="/login" replace />
  }

  return children
}
