// ============================================================
// context/AuthContext.jsx
// Estado global de sesión de tienda (via localStorage)
// ============================================================
import { createContext, useContext, useState, useEffect } from 'react'

const STORAGE_KEY = 'tienda_sesion'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [tienda, setTienda] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  // Sincroniza cambios al localStorage
  useEffect(() => {
    if (tienda) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tienda))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [tienda])

  const iniciarSesion = (datosTienda) => setTienda(datosTienda)

  const actualizarDatosTienda = (nuevosDatos) => {
    setTienda((prev) => (prev ? { ...prev, ...nuevosDatos } : nuevosDatos))
  }

  const cerrarSesion = () => setTienda(null)

  return (
    <AuthContext.Provider value={{ tienda, iniciarSesion, actualizarDatosTienda, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook para consumir el contexto de autenticación.
 * @returns {{ tienda: object|null, iniciarSesion: Function, cerrarSesion: Function }}
 */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
