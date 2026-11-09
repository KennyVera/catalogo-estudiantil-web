// ============================================================
// pages/LoginPage.jsx
// Pantalla combinada: Iniciar Sesión + Registrar Tienda
// ============================================================
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  loginConCredenciales,
  registrarTienda,
  usuarioDisponible,
  generarSlugUnico,
} from '../services/tiendaService'

// ---- Formulario de Inicio de Sesión ----
function FormLogin({ onSuccess }) {
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!usuario.trim() || !password.trim()) {
      setError('Por favor ingresa tu usuario y contraseña.')
      return
    }

    setCargando(true)
    setError(null)

    const { data, error: err } = await loginConCredenciales(usuario, password)
    setCargando(false)

    if (err || !data) {
      setError('Usuario o contraseña incorrectos, o la tienda está inactiva.')
      return
    }

    onSuccess(data)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={styles.field}>
        <label htmlFor="login-usuario">Nombre de usuario</label>
        <input
          id="login-usuario"
          type="text"
          value={usuario}
          onChange={(e) => {
            setUsuario(e.target.value)
            setError(null)
          }}
          placeholder="Ej: vale_postres"
          style={styles.input}
          autoFocus
        />
      </div>

      <div style={styles.field}>
        <label htmlFor="login-password">Contraseña</label>
        <div style={styles.passwordWrapper}>
          <input
            id="login-password"
            type={mostrarPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setError(null)
            }}
            placeholder="Tu contraseña"
            style={styles.passwordInput}
          />
          <button
            type="button"
            onClick={() => setMostrarPassword((v) => !v)}
            style={styles.btnTogglePass}
            title={mostrarPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
          >
            {mostrarPassword ? '🙈' : '👁️'}
          </button>
        </div>
      </div>

      {error && <p style={styles.error}>{error}</p>}

      <button type="submit" disabled={cargando} style={styles.btnPrimary}>
        {cargando ? 'Verificando...' : 'Iniciar Sesión →'}
      </button>
    </form>
  )
}

// ---- Formulario de Registro ----
function FormRegistro({ onSuccess }) {
  const [form, setForm] = useState({
    nombre_tienda: '',
    usuario: '',
    telefono_whatsapp: '',
    codigo_acceso: '',
  })
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [errores, setErrores] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrores((prev) => ({ ...prev, [name]: null, general: null }))
  }

  const validar = () => {
    const errs = {}
    if (!form.nombre_tienda.trim()) {
      errs.nombre_tienda = 'El nombre de la tienda es obligatorio.'
    }
    const userLimpio = form.usuario.trim()
    if (!userLimpio) {
      errs.usuario = 'El nombre de usuario es obligatorio.'
    } else if (userLimpio.length < 3) {
      errs.usuario = 'El usuario debe tener al menos 3 caracteres.'
    } else if (!/^[a-zA-Z0-9._-]+$/.test(userLimpio)) {
      errs.usuario = 'Solo se permiten letras, números, puntos y guiones.'
    }

    if (!form.telefono_whatsapp.trim()) {
      errs.telefono_whatsapp = 'El número de WhatsApp es obligatorio.'
    }

    if (!form.codigo_acceso.trim()) {
      errs.codigo_acceso = 'Define una contraseña.'
    } else if (form.codigo_acceso.trim().length < 4) {
      errs.codigo_acceso = 'La contraseña debe tener al menos 4 caracteres.'
    }

    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validar()
    if (Object.keys(errs).length > 0) {
      setErrores(errs)
      return
    }

    setCargando(true)
    setErrores({})

    try {
      // 1. Validar que el nombre de usuario esté libre
      const userLibre = await usuarioDisponible(form.usuario.trim())
      if (!userLibre) {
        setErrores({ usuario: 'Este nombre de usuario ya está registrado. Elige otro.' })
        setCargando(false)
        return
      }

      // 2. Generar slug único en background a partir del nombre de la tienda
      const slugGenerado = await generarSlugUnico(form.nombre_tienda.trim())

      // 3. Crear registro en la tabla tiendas
      const payload = {
        nombre_tienda: form.nombre_tienda.trim(),
        usuario: form.usuario.trim().toLowerCase(),
        slug: slugGenerado,
        telefono_whatsapp: form.telefono_whatsapp.trim().replace(/\s+/g, ''),
        codigo_acceso: form.codigo_acceso.trim(),
      }

      const { data, error } = await registrarTienda(payload)
      setCargando(false)

      if (error) {
        setErrores({ general: 'Error al registrar tienda: ' + error.message })
        return
      }

      onSuccess(data)
    } catch (err) {
      setCargando(false)
      setErrores({ general: 'Ocurrió un error inesperado: ' + err.message })
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* 1. Nombre de la tienda */}
      <div style={styles.field}>
        <label htmlFor="reg-nombre">1. Nombre de la tienda *</label>
        <input
          id="reg-nombre"
          type="text"
          name="nombre_tienda"
          value={form.nombre_tienda}
          onChange={handleChange}
          placeholder="Ej: Postres Dulce Tentación"
          style={styles.input}
          autoFocus
        />
        {errores.nombre_tienda && <span style={styles.fieldError}>{errores.nombre_tienda}</span>}
      </div>

      {/* 2. Nombre de usuario */}
      <div style={styles.field}>
        <label htmlFor="reg-usuario">2. Nombre de usuario * <small style={{ color: '#888' }}>(para iniciar sesión)</small></label>
        <input
          id="reg-usuario"
          type="text"
          name="usuario"
          value={form.usuario}
          onChange={handleChange}
          placeholder="Ej: vale_postres"
          style={styles.input}
        />
        {errores.usuario && <span style={styles.fieldError}>{errores.usuario}</span>}
      </div>

      {/* 3. WhatsApp para pedidos */}
      <div style={styles.field}>
        <label htmlFor="reg-whatsapp">3. WhatsApp para pedidos * <small style={{ color: '#888' }}>(con código de país)</small></label>
        <input
          id="reg-whatsapp"
          type="text"
          name="telefono_whatsapp"
          value={form.telefono_whatsapp}
          onChange={handleChange}
          placeholder="Ej: 593983187219"
          style={styles.input}
        />
        {errores.telefono_whatsapp && <span style={styles.fieldError}>{errores.telefono_whatsapp}</span>}
      </div>

      {/* 4. Contraseña */}
      <div style={styles.field}>
        <label htmlFor="reg-password">4. Contraseña * <small style={{ color: '#888' }}>(mín. 4 caracteres)</small></label>
        <div style={styles.passwordWrapper}>
          <input
            id="reg-password"
            type={mostrarPassword ? 'text' : 'password'}
            name="codigo_acceso"
            value={form.codigo_acceso}
            onChange={handleChange}
            placeholder="Define tu contraseña"
            style={styles.passwordInput}
          />
          <button
            type="button"
            onClick={() => setMostrarPassword((v) => !v)}
            style={styles.btnTogglePass}
            title={mostrarPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
          >
            {mostrarPassword ? '🙈' : '👁️'}
          </button>
        </div>
        {errores.codigo_acceso && <span style={styles.fieldError}>{errores.codigo_acceso}</span>}
      </div>

      {errores.general && <p style={styles.error}>{errores.general}</p>}

      <button type="submit" disabled={cargando} style={styles.btnPrimary}>
        {cargando ? 'Registrando...' : 'Registrar mi tienda →'}
      </button>
    </form>
  )
}

// ---- Página principal ----
export default function LoginPage({ modoInicial = 'login' }) {
  const [modo, setModo] = useState(modoInicial) // 'login' | 'registro'
  const { iniciarSesion } = useAuth()
  const navigate = useNavigate()

  const handleSuccess = (tienda) => {
    iniciarSesion(tienda)
    navigate('/admin')
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.card} className="login-card-responsive">
        {/* Título */}
        <h1 style={styles.titulo}>🛍️ Catálogo Estudiantil</h1>
        <p style={styles.subtitulo}>Crea y gestiona tu catálogo en minutos</p>

        {/* Toggle Login / Registro */}
        <div style={styles.tabRow}>
          <button
            type="button"
            onClick={() => setModo('login')}
            style={modo === 'login' ? styles.tabActivo : styles.tab}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            onClick={() => setModo('registro')}
            style={modo === 'registro' ? styles.tabActivo : styles.tab}
          >
            Registrar mi tienda
          </button>
        </div>

        {/* Contenido según modo */}
        {modo === 'login' ? (
          <>
            <p style={styles.hint}>Ingresa tu usuario y contraseña para administrar tu tienda.</p>
            <FormLogin onSuccess={handleSuccess} />
          </>
        ) : (
          <>
            <p style={styles.hint}>Completa estos 4 datos para crear tu tienda y catálogo público.</p>
            <FormRegistro onSuccess={handleSuccess} />
          </>
        )}
      </div>
    </div>
  )
}

// ---- Estilos inline ----
const styles = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f5f5f5',
    padding: 16,
    fontFamily: 'sans-serif',
  },
  card: {
    background: '#fff',
    borderRadius: 8,
    padding: '32px 28px',
    maxWidth: 440,
    width: '100%',
    boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
  },
  titulo: { margin: '0 0 4px', fontSize: 24, textAlign: 'center' },
  subtitulo: { margin: '0 0 20px', color: '#666', textAlign: 'center', fontSize: 14 },
  tabRow: {
    display: 'flex',
    borderRadius: 6,
    overflow: 'hidden',
    border: '1px solid #ddd',
    marginBottom: 20,
  },
  tab: {
    flex: 1, padding: '10px 0', border: 'none', background: '#f5f5f5',
    cursor: 'pointer', fontSize: 14,
  },
  tabActivo: {
    flex: 1, padding: '10px 0', border: 'none', background: '#1a1a1a',
    color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 'bold',
  },
  hint: { fontSize: 13, color: '#888', margin: '0 0 16px' },
  field: { marginBottom: 14 },
  input: {
    display: 'block', width: '100%', padding: '9px 10px',
    border: '1px solid #ccc', borderRadius: 5, fontSize: 14,
    boxSizing: 'border-box', marginTop: 4,
  },
  passwordWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    marginTop: 4,
  },
  passwordInput: {
    width: '100%',
    padding: '9px 40px 9px 10px',
    border: '1px solid #ccc',
    borderRadius: 5,
    fontSize: 14,
    boxSizing: 'border-box',
  },
  btnTogglePass: {
    position: 'absolute',
    right: 8,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 16,
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldError: { color: '#d32f2f', fontSize: 12, marginTop: 3, display: 'block' },
  error: { color: '#d32f2f', margin: '8px 0', fontSize: 14 },
  btnPrimary: {
    width: '100%', padding: '11px 0', background: '#1a1a1a',
    color: '#fff', border: 'none', borderRadius: 5,
    fontSize: 15, fontWeight: 'bold', cursor: 'pointer', marginTop: 8,
  },
}
