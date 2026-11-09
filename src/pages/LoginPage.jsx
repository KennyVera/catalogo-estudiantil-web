// ============================================================
// pages/LoginPage.jsx
// Pantalla combinada: Iniciar Sesión + Registrar Tienda
// Rediseño moderno con paleta esmeralda
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
import {
  Store,
  User,
  Lock,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
} from 'lucide-react'

// ---- Input con icono izquierdo ----
function IconInput({ id, icon: Icon, type = 'text', value, onChange, placeholder, autoFocus, name, rightElement }) {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <span style={{
        position: 'absolute', left: 14, display: 'flex', alignItems: 'center',
        color: '#94A3B8', pointerEvents: 'none', zIndex: 1,
      }}>
        <Icon size={17} />
      </span>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="auth-input"
        style={{
          width: '100%',
          paddingLeft: 42,
          paddingRight: rightElement ? 44 : 14,
          paddingTop: 11,
          paddingBottom: 11,
          border: '1.5px solid #E2E8F0',
          borderRadius: 12,
          fontSize: 15,
          color: '#0F172A',
          background: '#FFFFFF',
          boxSizing: 'border-box',
          outline: 'none',
          fontFamily: 'inherit',
        }}
      />
      {rightElement && (
        <span style={{ position: 'absolute', right: 0, display: 'flex', alignItems: 'center' }}>
          {rightElement}
        </span>
      )}
    </div>
  )
}

// ---- Badge de error ----
function ErrorBadge({ message }) {
  if (!message) return null
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 8,
      background: '#FEF2F2', border: '1px solid #FEE2E2',
      borderRadius: 12, padding: '10px 14px',
      color: '#B91C1C', fontSize: 13, lineHeight: 1.45,
    }}>
      <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
      <span>{message}</span>
    </div>
  )
}

// ---- Label de campo ----
function FieldLabel({ htmlFor, children }) {
  return (
    <label htmlFor={htmlFor} style={{
      display: 'block', marginBottom: 6,
      fontSize: 11, fontWeight: 700,
      color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em',
    }}>
      {children}
    </label>
  )
}

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

    const { data, error: err } = await loginConCredenciales(usuario.trim(), password.trim())
    setCargando(false)

    if (err || !data) {
      setError('Usuario o contraseña incorrectos, o la tienda está inactiva.')
      return
    }

    onSuccess(data)
  }

  const toggleBtn = (
    <button
      type="button"
      onClick={() => setMostrarPassword(v => !v)}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        padding: '0 14px', display: 'flex', alignItems: 'center',
        color: '#94A3B8',
      }}
      title={mostrarPassword ? 'Ocultar' : 'Ver contraseña'}
    >
      {mostrarPassword ? <EyeOff size={17} /> : <Eye size={17} />}
    </button>
  )

  return (
    <form onSubmit={handleSubmit} noValidate>
      <p style={{ fontSize: 13, color: '#64748B', marginBottom: 22, lineHeight: 1.5 }}>
        Ingresa tu usuario y contraseña para administrar tu tienda.
      </p>

      {/* Usuario */}
      <div style={{ marginBottom: 16 }}>
        <FieldLabel htmlFor="login-usuario">Nombre de usuario</FieldLabel>
        <IconInput
          id="login-usuario"
          icon={User}
          type="text"
          value={usuario}
          onChange={(e) => { setUsuario(e.target.value); setError(null) }}
          placeholder="Ej: vale_postres"
          autoFocus
        />
      </div>

      {/* Contraseña */}
      <div style={{ marginBottom: 20 }}>
        <FieldLabel htmlFor="login-password">Contraseña</FieldLabel>
        <IconInput
          id="login-password"
          icon={Lock}
          type={mostrarPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(null) }}
          placeholder="Tu contraseña"
          rightElement={toggleBtn}
        />
      </div>

      {error && <div style={{ marginBottom: 16 }}><ErrorBadge message={error} /></div>}

      <button
        type="submit"
        disabled={cargando}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 8, padding: '13px 0',
          background: cargando ? '#0D9488' : '#0F766E',
          color: '#FFFFFF', border: 'none', borderRadius: 12,
          fontSize: 15, fontWeight: 600, cursor: cargando ? 'not-allowed' : 'pointer',
          boxShadow: '0 4px 14px rgba(15,118,110,0.22)',
          transition: 'background 0.15s, transform 0.08s',
          fontFamily: 'inherit',
        }}
      >
        {cargando ? (
          <>
            <span style={spinnerStyle} /> Verificando...
          </>
        ) : (
          <>Iniciar Sesión <ArrowRight size={17} /></>
        )}
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
    setForm(prev => ({ ...prev, [name]: value }))
    setErrores(prev => ({ ...prev, [name]: null, general: null }))
  }

  const validar = () => {
    const errs = {}
    if (!form.nombre_tienda.trim()) errs.nombre_tienda = 'El nombre de la tienda es obligatorio.'
    const userLimpio = form.usuario.trim()
    if (!userLimpio) {
      errs.usuario = 'El nombre de usuario es obligatorio.'
    } else if (userLimpio.length < 3) {
      errs.usuario = 'El usuario debe tener al menos 3 caracteres.'
    } else if (!/^[a-zA-Z0-9._-]+$/.test(userLimpio)) {
      errs.usuario = 'Solo letras, números, puntos y guiones.'
    }
    if (!form.telefono_whatsapp.trim()) errs.telefono_whatsapp = 'El número de WhatsApp es obligatorio.'
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
    if (Object.keys(errs).length > 0) { setErrores(errs); return }

    setCargando(true)
    setErrores({})

    try {
      const userLibre = await usuarioDisponible(form.usuario.trim())
      if (!userLibre) {
        setErrores({ usuario: 'Este nombre de usuario ya está registrado. Elige otro.' })
        setCargando(false)
        return
      }
      const slugGenerado = await generarSlugUnico(form.nombre_tienda.trim())
      const payload = {
        nombre_tienda: form.nombre_tienda.trim(),
        usuario: form.usuario.trim().toLowerCase(),
        slug: slugGenerado,
        telefono_whatsapp: form.telefono_whatsapp.trim().replace(/\s+/g, ''),
        codigo_acceso: form.codigo_acceso.trim(),
      }
      const { data, error } = await registrarTienda(payload)
      setCargando(false)
      if (error) { setErrores({ general: 'Error al registrar tienda: ' + error.message }); return }
      onSuccess(data)
    } catch (err) {
      setCargando(false)
      setErrores({ general: 'Ocurrió un error inesperado: ' + err.message })
    }
  }

  const toggleBtn = (
    <button
      type="button"
      onClick={() => setMostrarPassword(v => !v)}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        padding: '0 14px', display: 'flex', alignItems: 'center',
        color: '#94A3B8',
      }}
      title={mostrarPassword ? 'Ocultar' : 'Ver contraseña'}
    >
      {mostrarPassword ? <EyeOff size={17} /> : <Eye size={17} />}
    </button>
  )

  const fieldErr = (key) => errores[key]
    ? <span style={{ display: 'block', color: '#B91C1C', fontSize: 12, marginTop: 5 }}>{errores[key]}</span>
    : null

  return (
    <form onSubmit={handleSubmit} noValidate>
      <p style={{ fontSize: 13, color: '#64748B', marginBottom: 22, lineHeight: 1.5 }}>
        Completa estos datos para crear tu tienda y catálogo público.
      </p>

      {errores.general && <div style={{ marginBottom: 16 }}><ErrorBadge message={errores.general} /></div>}

      {/* 1. Nombre de la tienda */}
      <div style={{ marginBottom: 16 }}>
        <FieldLabel htmlFor="reg-nombre">Nombre de la tienda</FieldLabel>
        <IconInput
          id="reg-nombre" name="nombre_tienda" icon={Store}
          value={form.nombre_tienda} onChange={handleChange}
          placeholder="Ej: Postres Dulce Tentación" autoFocus
        />
        {fieldErr('nombre_tienda')}
      </div>

      {/* 2. Usuario */}
      <div style={{ marginBottom: 16 }}>
        <FieldLabel htmlFor="reg-usuario">
          Nombre de usuario &nbsp;<span style={{ textTransform: 'none', fontWeight: 400, fontSize: 11, color: '#94A3B8' }}>(para iniciar sesión)</span>
        </FieldLabel>
        <IconInput
          id="reg-usuario" name="usuario" icon={User}
          value={form.usuario} onChange={handleChange}
          placeholder="Ej: vale_postres"
        />
        {fieldErr('usuario')}
      </div>

      {/* 3. WhatsApp */}
      <div style={{ marginBottom: 16 }}>
        <FieldLabel htmlFor="reg-whatsapp">
          WhatsApp para pedidos &nbsp;<span style={{ textTransform: 'none', fontWeight: 400, fontSize: 11, color: '#94A3B8' }}>(con código de país)</span>
        </FieldLabel>
        <IconInput
          id="reg-whatsapp" name="telefono_whatsapp" icon={Phone}
          value={form.telefono_whatsapp} onChange={handleChange}
          placeholder="Ej: 593983187219"
        />
        {fieldErr('telefono_whatsapp')}
      </div>

      {/* 4. Contraseña */}
      <div style={{ marginBottom: 24 }}>
        <FieldLabel htmlFor="reg-password">
          Contraseña &nbsp;<span style={{ textTransform: 'none', fontWeight: 400, fontSize: 11, color: '#94A3B8' }}>(mín. 4 caracteres)</span>
        </FieldLabel>
        <IconInput
          id="reg-password" name="codigo_acceso" icon={Lock}
          type={mostrarPassword ? 'text' : 'password'}
          value={form.codigo_acceso} onChange={handleChange}
          placeholder="Define tu contraseña"
          rightElement={toggleBtn}
        />
        {fieldErr('codigo_acceso')}
      </div>

      <button
        type="submit"
        disabled={cargando}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 8, padding: '13px 0',
          background: cargando ? '#0D9488' : '#0F766E',
          color: '#FFFFFF', border: 'none', borderRadius: 12,
          fontSize: 15, fontWeight: 600, cursor: cargando ? 'not-allowed' : 'pointer',
          boxShadow: '0 4px 14px rgba(15,118,110,0.22)',
          transition: 'background 0.15s',
          fontFamily: 'inherit',
        }}
      >
        {cargando ? (
          <><span style={spinnerStyle} /> Registrando...</>
        ) : (
          <>Registrar mi tienda <ArrowRight size={17} /></>
        )}
      </button>
    </form>
  )
}

// ---- Spinner inline ----
const spinnerStyle = {
  display: 'inline-block',
  width: 16, height: 16,
  border: '2.5px solid rgba(255,255,255,0.35)',
  borderTopColor: '#FFFFFF',
  borderRadius: '50%',
  animation: 'auth-spin 0.7s linear infinite',
}

// ---- Página principal ----
export default function LoginPage({ modoInicial = 'login' }) {
  const [modo, setModo] = useState(modoInicial)
  const { iniciarSesion } = useAuth()
  const navigate = useNavigate()

  const handleSuccess = (tienda) => {
    iniciarSesion(tienda)
    navigate('/admin')
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(145deg, #ECFDF5 0%, #F8FAFC 45%, #F0FDF4 100%)',
      padding: '16px',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {/* Spinner keyframes */}
      <style>{`@keyframes auth-spin { to { transform: rotate(360deg); } }`}</style>

      <div
        className="login-card-responsive"
        style={{
          background: '#FFFFFF',
          borderRadius: 28,
          padding: '36px 32px',
          maxWidth: 448,
          width: '100%',
          boxShadow: '0 20px 60px -12px rgba(0,0,0,0.11), 0 8px 25px -8px rgba(0,0,0,0.05)',
          border: '1px solid #E2E8F0',
        }}
      >
        {/* Cabecera */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56,
            background: '#ECFDF5',
            border: '1px solid #A7F3D0',
            borderRadius: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px',
          }}>
            <Store size={26} color="#0F766E" />
          </div>
          <h1 style={{
            margin: 0, fontSize: 22, fontWeight: 700,
            color: '#0F172A', letterSpacing: '-0.3px',
          }}>
            Catálogo Estudiantil
          </h1>
          <p style={{ margin: '5px 0 0', fontSize: 13, color: '#64748B' }}>
            Crea y gestiona tu catálogo en minutos
          </p>
        </div>

        {/* Tabs segmentadas */}
        <div style={{
          display: 'flex',
          background: '#F1F5F9',
          borderRadius: 14,
          padding: 4,
          gap: 4,
          marginBottom: 24,
        }}>
          {[
            { key: 'login', label: 'Iniciar sesión' },
            { key: 'registro', label: 'Registrar tienda' },
          ].map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setModo(key)}
              style={{
                flex: 1,
                padding: '10px 8px',
                border: 'none',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: modo === key ? 600 : 400,
                color: modo === key ? '#0F766E' : '#64748B',
                background: modo === key ? '#FFFFFF' : 'transparent',
                boxShadow: modo === key ? '0 1px 4px rgba(0,0,0,0.09)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s',
                fontFamily: 'inherit',
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Formulario activo */}
        {modo === 'login'
          ? <FormLogin onSuccess={handleSuccess} />
          : <FormRegistro onSuccess={handleSuccess} />
        }
      </div>
    </div>
  )
}
