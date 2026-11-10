// ============================================================
// pages/AdminPage.jsx
// Panel de gestión: Rediseño visual esmeralda con foto de perfil,
// dropdown de Administrador, gestión de stock y modales.
// ============================================================
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  getCategorias,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
} from '../services/categoriaService'
import {
  getProductos,
  crearProducto,
  actualizarProducto,
  actualizarStock,
  toggleDisponible,
  eliminarProducto,
  subirImagenProducto,
} from '../services/productoService'
import {
  actualizarFotoPerfil,
  actualizarPassword,
  subirLogoTienda,
  actualizarConfiguracionTienda,
} from '../services/tiendaService'
import {
  getPedidosPorTienda,
  actualizarEstadoPedido,
} from '../services/pedidoService'
import {
  getValoracionesPorTienda,
} from '../services/valoracionService'
import { supabase } from '../supabaseClient'

import {
  Store,
  Bell,
  BellOff,
  LayoutGrid,
  Package,
  Box,
  Share2,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Plus,
  Minus,
  User,
  Lock,
  LogOut,
  ChevronDown,
  CheckCircle2,
  Link2,
  X,
  Camera,
  ClipboardList,
  TrendingUp,
  DollarSign,
  Calendar,
  Star,
  RefreshCw,
  ShoppingBag,
  Clock,
  Phone,
  AlertCircle,
  ArrowRight,
  Settings,
} from 'lucide-react'

const PRODUCTO_INICIAL = {
  nombre: '',
  descripcion: '',
  precio: '',
  stock: 1,
  categoria_id: '',
  disponible: true,
  imagen_url: '',
}

function formatearFechaHora(isoDate) {
  if (!isoDate) return '—'
  try {
    const d = new Date(isoDate)
    return d.toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return isoDate
  }
}

function getEstadoStyle(estado) {
  if (estado === 'pagado') {
    return { background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0' }
  }
  if (estado === 'cancelado') {
    return { background: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA' }
  }
  return { background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }
}

export default function AdminPage() {
  const { tienda, actualizarDatosTienda, cerrarSesion } = useAuth()
  const navigate = useNavigate()

  const fileInputRef = useRef(null)
  const avatarInputRef = useRef(null)
  const logoFileInputRef = useRef(null)
  const profileMenuRef = useRef(null)
  const notifMenuRef = useRef(null)

  // --- Estados generales ---
  const [menuPerfilAbierto, setMenuPerfilAbierto] = useState(false)
  const [menuNotificacionesAbierto, setMenuNotificacionesAbierto] = useState(false)
  const [subiendoAvatar, setSubiendoAvatar] = useState(false)

  // --- Modal Configuración de Tienda ---
  const [modalConfiguracionAbierto, setModalConfiguracionAbierto] = useState(false)
  const [formConfiguracion, setFormConfiguracion] = useState({
    nombre_tienda: '',
    telefono_whatsapp: '',
    logo_url: '',
  })
  const [archivoLogo, setArchivoLogo] = useState(null)
  const [previewLogo, setPreviewLogo] = useState('')
  const [guardandoConfiguracion, setGuardandoConfiguracion] = useState(false)
  const [msgConfiguracion, setMsgConfiguracion] = useState(null)

  // --- Modal cambiar contraseña ---
  const [modalPasswordAbierto, setModalPasswordAbierto] = useState(false)
  const [formPassword, setFormPassword] = useState({
    actual: '',
    nueva: '',
    confirmar: '',
  })
  const [mostrarPasswordModal, setMostrarPasswordModal] = useState(false)
  const [guardandoPassword, setGuardandoPassword] = useState(false)
  const [msgPassword, setMsgPassword] = useState(null)

  // --- Categorías ---
  const [categorias, setCategorias] = useState([])
  const [nuevaCategoria, setNuevaCategoria] = useState('')
  const [cargandoCats, setCargandoCats] = useState(false)
  const [errorCats, setErrorCats] = useState(null)
  const [guardandoCat, setGuardandoCat] = useState(false)
  const [categoriaEnEdicionId, setCategoriaEnEdicionId] = useState(null)
  const [nombreEditadoCategoria, setNombreEditadoCategoria] = useState('')
  const [guardandoEdicionCat, setGuardandoEdicionCat] = useState(false)

  // --- Productos ---
  const [productos, setProductos] = useState([])
  const [cargandoProds, setCargandoProds] = useState(false)
  const [errorProds, setErrorProds] = useState(null)

  // --- Formulario de producto (crear o editar) ---
  const [formProducto, setFormProducto] = useState(PRODUCTO_INICIAL)
  const [productoEnEdicion, setProductoEnEdicion] = useState(null)
  const [archivoImagen, setArchivoImagen] = useState(null)
  const [previewImagen, setPreviewImagen] = useState(null)
  const [guardandoProd, setGuardandoProd] = useState(false)
  const [formAbierto, setFormAbierto] = useState(false)

  // --- Pestaña activa del Panel ---
  const [tabActiva, setTabActiva] = useState('inventario') // 'inventario' | 'pedidos' | 'finanzas' | 'valoraciones'

  // --- Pedidos ---
  const [pedidos, setPedidos] = useState([])
  const [cargandoPedidos, setCargandoPedidos] = useState(false)
  const [errorPedidos, setErrorPedidos] = useState(null)
  const [filtroEstadoPedido, setFiltroEstadoPedido] = useState('todos')
  const [busquedaPedido, setBusquedaPedido] = useState('')
  const [pedidoDetalleModal, setPedidoDetalleModal] = useState(null)
  const [actualizandoEstadoId, setActualizandoEstadoId] = useState(null)

  // --- Valoraciones ---
  const [valoraciones, setValoraciones] = useState([])
  const [cargandoValoraciones, setCargandoValoraciones] = useState(false)
  const [errorValoraciones, setErrorValoraciones] = useState(null)
  const [productosValoracionesExpandidos, setProductosValoracionesExpandidos] = useState({})

  // --- Modal compartir ---
  const [modalCompartir, setModalCompartir] = useState(false)
  const [copiado, setCopiado] = useState(false)

  const linkPublico = `${window.location.origin}/tienda/${tienda?.slug || ''}`
  const linkWhatsappShare = `https://api.whatsapp.com/send?text=${encodeURIComponent(`¡Mira mi catálogo aquí! ${linkPublico}`)}`
  const linkFacebookShare = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(linkPublico)}`

  // =====================================================
  // Cierre de menús flotantes al hacer clic fuera
  // =====================================================
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setMenuPerfilAbierto(false)
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target)) {
        setMenuNotificacionesAbierto(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // =====================================================
  // Cargar datos
  // =====================================================
  const cargarCategorias = useCallback(async () => {
    if (!tienda?.id) return
    setCargandoCats(true)
    setErrorCats(null)
    const { data, error } = await getCategorias(tienda.id)
    setCargandoCats(false)
    if (error) { setErrorCats(error.message); return }
    setCategorias(data || [])
  }, [tienda?.id])

  const cargarProductos = useCallback(async () => {
    if (!tienda?.id) return
    setCargandoProds(true)
    setErrorProds(null)
    const { data, error } = await getProductos(tienda.id)
    setCargandoProds(false)
    if (error) { setErrorProds(error.message); return }
    setProductos(data || [])
  }, [tienda?.id])

  const cargarPedidos = useCallback(async () => {
    if (!tienda?.id) return
    setCargandoPedidos(true)
    setErrorPedidos(null)
    const { data, error } = await getPedidosPorTienda(tienda.id)
    setCargandoPedidos(false)
    if (error) { setErrorPedidos(error.message); return }
    setPedidos(data || [])
  }, [tienda?.id])

  const cargarValoraciones = useCallback(async () => {
    if (!tienda?.id) return
    setCargandoValoraciones(true)
    setErrorValoraciones(null)
    const { data, error } = await getValoracionesPorTienda(tienda.id)
    setCargandoValoraciones(false)
    if (error) { setErrorValoraciones(error.message); return }
    setValoraciones(data || [])
  }, [tienda?.id])

  useEffect(() => {
    cargarCategorias()
    cargarProductos()
    cargarPedidos()
    cargarValoraciones()
  }, [cargarCategorias, cargarProductos, cargarPedidos, cargarValoraciones])

  // Suscripción en tiempo real a la tabla `pedidos` para notificaciones instantáneas
  useEffect(() => {
    if (!tienda?.id) return
    const channel = supabase
      .channel(`pedidos-admin-live-${tienda.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pedidos', filter: `tienda_id=eq.${tienda.id}` },
        () => {
          cargarPedidos()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tienda?.id, cargarPedidos])

  // Cambio de estado de un pedido (trigger restaura stock si es 'cancelado')
  const handleCambiarEstadoPedido = async (pedidoId, nuevoEstado) => {
    setActualizandoEstadoId(pedidoId)
    const { error } = await actualizarEstadoPedido(pedidoId, nuevoEstado)
    setActualizandoEstadoId(null)

    if (error) {
      alert('Error al actualizar estado del pedido: ' + error.message)
      return
    }

    setPedidos((prev) =>
      prev.map((p) => (p.id === pedidoId ? { ...p, estado: nuevoEstado } : p))
    )

    if (pedidoDetalleModal?.id === pedidoId) {
      setPedidoDetalleModal((prev) => ({ ...prev, estado: nuevoEstado }))
    }

    // Si se cancela, el trigger en BD devuelve el stock a productos, así que recargamos productos
    if (nuevoEstado === 'cancelado') {
      cargarProductos()
    }
  }

  // --- Reportes Financieros (estrictamente pedidos con estado = 'pagado') ---
  const pedidosPagados = useMemo(() => {
    return pedidos.filter((p) => p.estado === 'pagado')
  }, [pedidos])

  const ingresosReportes = useMemo(() => {
    const ahora = new Date()
    const hace7Dias = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000)

    const semana = pedidosPagados
      .filter((p) => new Date(p.created_at) >= hace7Dias)
      .reduce((sum, p) => sum + Number(p.total || 0), 0)

    const mes = pedidosPagados
      .filter((p) => {
        const d = new Date(p.created_at)
        return d.getMonth() === ahora.getMonth() && d.getFullYear() === ahora.getFullYear()
      })
      .reduce((sum, p) => sum + Number(p.total || 0), 0)

    const anio = pedidosPagados
      .filter((p) => new Date(p.created_at).getFullYear() === ahora.getFullYear())
      .reduce((sum, p) => sum + Number(p.total || 0), 0)

    const historico = pedidosPagados.reduce((sum, p) => sum + Number(p.total || 0), 0)
    const ticketPromedio = pedidosPagados.length > 0 ? historico / pedidosPagados.length : 0

    return { semana, mes, anio, historico, ticketPromedio }
  }, [pedidosPagados])

  // Pedidos pendientes para notificaciones
  const pedidosPendientes = useMemo(() => {
    return pedidos.filter((p) => p.estado === 'pendiente')
  }, [pedidos])

  const pedidosPendientesCount = pedidosPendientes.length

  // Promedio general de valoraciones
  const promedioValoraciones = useMemo(() => {
    if (valoraciones.length === 0) return 0
    const suma = valoraciones.reduce((sum, v) => sum + Number(v.calificacion || 0), 0)
    return Number((suma / valoraciones.length).toFixed(1))
  }, [valoraciones])

  // Agrupar valoraciones por producto y calcular promedio real individual
  const productosConValoraciones = useMemo(() => {
    const mapa = {}

    for (const v of valoraciones) {
      const prodInfo = v.productos || v.producto || {}
      const prodId = v.producto_id || prodInfo.id
      if (!prodId) continue

      if (!mapa[prodId]) {
        mapa[prodId] = {
          id: prodId,
          nombre: prodInfo.nombre || 'Producto sin nombre',
          imagen_url: prodInfo.imagen_url || '',
          valoraciones: [],
          sumaCalificaciones: 0,
        }
      }

      mapa[prodId].valoraciones.push(v)
      mapa[prodId].sumaCalificaciones += Number(v.calificacion || 0)
    }

    return Object.values(mapa)
      .map((item) => {
        const cantidad = item.valoraciones.length
        const promedio = cantidad > 0 ? Number((item.sumaCalificaciones / cantidad).toFixed(1)) : 0
        return {
          ...item,
          cantidad,
          promedio,
        }
      })
      .sort((a, b) => b.cantidad - a.cantidad)
  }, [valoraciones])

  const toggleExpandirProducto = (prodId) => {
    setProductosValoracionesExpandidos((prev) => ({
      ...prev,
      [prodId]: !prev[prodId],
    }))
  }

  // Pedidos filtrados por estado y búsqueda
  const pedidosFiltradosFinal = useMemo(() => {
    return pedidos.filter((p) => {
      const coincideEstado = filtroEstadoPedido === 'todos' || p.estado === filtroEstadoPedido
      const coincideBusqueda = !busquedaPedido.trim() ||
        p.nombre_cliente?.toLowerCase().includes(busquedaPedido.trim().toLowerCase())
      return coincideEstado && coincideBusqueda
    })
  }, [pedidos, filtroEstadoPedido, busquedaPedido])

  // =====================================================
  // Copiar enlace al portapapeles
  // =====================================================
  const handleCopiarLink = async () => {
    try {
      await navigator.clipboard.writeText(linkPublico)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch {
      window.prompt('Copia este enlace:', linkPublico)
    }
  }

  // =====================================================
  // Cambiar foto de perfil (Avatar)
  // =====================================================
  const handleSeleccionarAvatar = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 4 * 1024 * 1024) {
      alert('La foto de perfil no debe superar 4MB.')
      return
    }

    setSubiendoAvatar(true)
    const { data, error } = await actualizarFotoPerfil(tienda.id, file)
    setSubiendoAvatar(false)
    setMenuPerfilAbierto(false)

    if (error) {
      alert('Error al subir avatar: ' + (error.message || 'Verifica que el bucket "avatars" exista en Supabase Storage con acceso público.'))
      return
    }

    if (data?.avatar_url) {
      actualizarDatosTienda({ avatar_url: data.avatar_url })
      alert('✓ Foto de perfil actualizada correctamente.')
    }
  }

  // =====================================================
  // Cambiar contraseña (Actual, Nueva y Confirmar)
  // =====================================================
  const handleGuardarNuevaPassword = async (e) => {
    e.preventDefault()
    setMsgPassword(null)

    const actual = formPassword.actual.trim()
    const nueva = formPassword.nueva.trim()
    const confirmar = formPassword.confirmar.trim()

    if (!actual) {
      setMsgPassword({ tipo: 'error', texto: 'Por favor ingresa tu contraseña actual.' })
      return
    }

    if (actual !== tienda.codigo_acceso) {
      setMsgPassword({ tipo: 'error', texto: 'La contraseña actual no es correcta.' })
      return
    }

    if (!nueva || nueva.length < 4) {
      setMsgPassword({ tipo: 'error', texto: 'La nueva contraseña debe tener al menos 4 caracteres.' })
      return
    }

    if (nueva === actual) {
      setMsgPassword({ tipo: 'error', texto: 'La nueva contraseña debe ser diferente a la actual.' })
      return
    }

    if (nueva !== confirmar) {
      setMsgPassword({ tipo: 'error', texto: 'La nueva contraseña y su confirmación no coinciden.' })
      return
    }

    setGuardandoPassword(true)

    const { error } = await actualizarPassword(tienda.id, nueva)
    setGuardandoPassword(false)

    if (error) {
      setMsgPassword({ tipo: 'error', texto: 'Error al cambiar contraseña: ' + error.message })
      return
    }

    actualizarDatosTienda({ codigo_acceso: nueva })
    setMsgPassword({ tipo: 'exito', texto: '✓ Contraseña actualizada correctamente.' })
    setTimeout(() => {
      setModalPasswordAbierto(false)
      setFormPassword({ actual: '', nueva: '', confirmar: '' })
      setMsgPassword(null)
    }, 1800)
  }

  // --- Handlers de Configuración de la Tienda ---
  const abrirModalConfiguracion = () => {
    let tel = (tienda?.telefono_whatsapp || '').trim()
    if (tel.startsWith('593')) {
      tel = tel.slice(3)
    }
    setFormConfiguracion({
      nombre_tienda: tienda?.nombre_tienda || '',
      telefono_whatsapp: tel,
      logo_url: tienda?.logo_url || '',
    })
    setPreviewLogo(tienda?.logo_url || '')
    setArchivoLogo(null)
    setMsgConfiguracion(null)
    setModalConfiguracionAbierto(true)
  }

  const handleSeleccionarLogo = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido.')
      return
    }
    setArchivoLogo(file)
    setPreviewLogo(URL.createObjectURL(file))
    setMsgConfiguracion(null)
  }

  const handleQuitarLogo = () => {
    setArchivoLogo(null)
    setPreviewLogo('')
    setFormConfiguracion((prev) => ({ ...prev, logo_url: '' }))
    if (logoFileInputRef.current) logoFileInputRef.current.value = ''
  }

  const handleGuardarConfiguracion = async (e) => {
    e.preventDefault()
    const nombreLimpio = formConfiguracion.nombre_tienda.trim()
    if (!nombreLimpio) {
      setMsgConfiguracion({ tipo: 'error', texto: 'El nombre del negocio es obligatorio.' })
      return
    }

    setGuardandoConfiguracion(true)
    setMsgConfiguracion(null)

    try {
      let finalLogoUrl = formConfiguracion.logo_url?.trim() || null

      if (archivoLogo) {
        const { publicUrl, error: uploadErr } = await subirLogoTienda(tienda.id, archivoLogo)
        if (uploadErr) {
          throw new Error('Error al subir el logo: ' + (uploadErr.message || 'Intenta con otra imagen.'))
        }
        if (publicUrl) {
          finalLogoUrl = publicUrl
        }
      }

      // Normalizar número telefónico
      let celular = formConfiguracion.telefono_whatsapp.replace(/\D/g, '')
      if (celular.startsWith('593')) celular = celular.slice(3)
      if (celular.startsWith('0')) celular = celular.slice(1)
      const telFinal = celular ? `593${celular}` : (tienda?.telefono_whatsapp || null)

      const payload = {
        nombre_tienda: nombreLimpio,
        telefono_whatsapp: telFinal,
        logo_url: finalLogoUrl,
      }

      const { data, error } = await actualizarConfiguracionTienda(tienda.id, payload)
      if (error) {
        throw error
      }

      actualizarDatosTienda(data || payload)

      setMsgConfiguracion({ tipo: 'exito', texto: '✓ ¡Configuración guardada correctamente!' })
      setTimeout(() => {
        setModalConfiguracionAbierto(false)
        setMsgConfiguracion(null)
      }, 1000)
    } catch (err) {
      setMsgConfiguracion({ tipo: 'error', texto: err.message || 'Error al guardar la configuración.' })
    } finally {
      setGuardandoConfiguracion(false)
    }
  }

  // =====================================================
  // Handlers de Categorías
  // =====================================================
  const handleCrearCategoria = async (e) => {
    e.preventDefault()
    if (!nuevaCategoria.trim()) return
    setGuardandoCat(true)
    const { data, error } = await crearCategoria(tienda.id, nuevaCategoria)
    setGuardandoCat(false)
    if (error) { alert('Error al crear categoría: ' + error.message); return }
    setCategorias((prev) => [...prev, data])
    setNuevaCategoria('')
  }

  const handleIniciarEdicionCategoria = (cat) => {
    setCategoriaEnEdicionId(cat.id)
    setNombreEditadoCategoria(cat.nombre)
  }

  const handleCancelarEdicionCategoria = () => {
    setCategoriaEnEdicionId(null)
    setNombreEditadoCategoria('')
  }

  const handleGuardarEdicionCategoria = async (catId) => {
    if (!nombreEditadoCategoria.trim()) return
    setGuardandoEdicionCat(true)
    const { data, error } = await actualizarCategoria(catId, nombreEditadoCategoria)
    setGuardandoEdicionCat(false)
    if (error) {
      alert('Error al actualizar categoría: ' + error.message)
      return
    }
    setCategorias((prev) => prev.map((c) => (c.id === catId ? data : c)))
    setCategoriaEnEdicionId(null)
  }

  const handleEliminarCategoria = async (id) => {
    if (!window.confirm('¿Eliminar esta categoría? Los productos vinculados quedarán sin categoría.')) return
    const { error } = await eliminarCategoria(id)
    if (error) { alert('Error al eliminar: ' + error.message); return }
    setCategorias((prev) => prev.filter((c) => c.id !== id))
    setFormProducto((prev) => (prev.categoria_id === id ? { ...prev, categoria_id: '' } : prev))
  }

  // =====================================================
  // Handlers de Productos
  // =====================================================
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormProducto((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleArchivoChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen no debe superar los 5MB.')
        return
      }
      setArchivoImagen(file)
      setPreviewImagen(URL.createObjectURL(file))
    }
  }

  const handleQuitarImagen = () => {
    setArchivoImagen(null)
    setPreviewImagen(null)
    setFormProducto((prev) => ({ ...prev, imagen_url: '' }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const resetFormulario = () => {
    setFormProducto(PRODUCTO_INICIAL)
    setProductoEnEdicion(null)
    setArchivoImagen(null)
    setPreviewImagen(null)
    setFormAbierto(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleEditarProducto = (prod) => {
    setProductoEnEdicion(prod)
    setFormProducto({
      nombre: prod.nombre || '',
      descripcion: prod.descripcion || '',
      precio: prod.precio ?? '',
      stock: prod.stock ?? 1,
      categoria_id: prod.categoria_id || '',
      disponible: prod.disponible ?? true,
      imagen_url: prod.imagen_url || '',
    })
    setArchivoImagen(null)
    setPreviewImagen(prod.imagen_url || null)
    setFormAbierto(true)
    window.scrollTo({ top: 400, behavior: 'smooth' })
  }

  const handleGuardarProducto = async (e) => {
    e.preventDefault()
    const { nombre, precio, categoria_id, stock } = formProducto

    if (!nombre.trim() || !precio || !categoria_id) {
      alert('Nombre, precio y categoría son obligatorios.')
      return
    }

    setGuardandoProd(true)
    let urlImagenFinal = formProducto.imagen_url || null

    if (archivoImagen) {
      const { publicUrl, error: uploadErr } = await subirImagenProducto(archivoImagen, tienda.id)
      if (uploadErr) {
        setGuardandoProd(false)
        alert('Error al subir la imagen al almacenamiento: ' + (uploadErr.message || 'Verifica el bucket "productos" en Supabase Storage.'))
        return
      }
      urlImagenFinal = publicUrl
    }

    const payload = {
      tienda_id: tienda.id,
      categoria_id: Number(categoria_id),
      nombre: formProducto.nombre.trim(),
      descripcion: formProducto.descripcion.trim(),
      precio: parseFloat(formProducto.precio),
      stock: Math.max(0, parseInt(stock, 10) || 0),
      imagen_url: urlImagenFinal,
      disponible: formProducto.disponible,
    }

    if (productoEnEdicion) {
      const { data, error } = await actualizarProducto(productoEnEdicion.id, payload)
      setGuardandoProd(false)
      if (error) { alert('Error al actualizar: ' + error.message); return }
      setProductos((prev) => prev.map((p) => (p.id === data.id ? data : p)))
      alert('✓ Producto actualizado correctamente.')
    } else {
      const { data, error } = await crearProducto(payload)
      setGuardandoProd(false)
      if (error) { alert('Error al crear producto: ' + error.message); return }
      setProductos((prev) => [...prev, data])
    }

    resetFormulario()
  }

  // Cambio rápido de stock (+ / -)
  const handleCambiarStockRapido = async (prod, delta) => {
    const stockActual = prod.stock ?? 0
    const nuevoStock = Math.max(0, stockActual + delta)
    if (nuevoStock === stockActual) return

    setProductos((prev) =>
      prev.map((p) => (p.id === prod.id ? { ...p, stock: nuevoStock } : p))
    )

    const { error } = await actualizarStock(prod.id, nuevoStock)
    if (error) {
      alert('Error al actualizar stock: ' + error.message)
      cargarProductos()
    }
  }

  const handleToggleDisponible = async (producto) => {
    const { data, error } = await toggleDisponible(producto.id, producto.disponible)
    if (error) { alert('Error al actualizar disponibilidad: ' + error.message); return }
    setProductos((prev) => prev.map((p) => (p.id === data.id ? data : p)))
  }

  const handleEliminarProducto = async (id) => {
    if (!window.confirm('¿Eliminar este producto permanentemente?')) return
    const { error } = await eliminarProducto(id)
    if (error) { alert('Error al eliminar: ' + error.message); return }
    setProductos((prev) => prev.filter((p) => p.id !== id))
    if (productoEnEdicion?.id === id) resetFormulario()
  }

  const handleCerrarSesion = () => {
    cerrarSesion()
    navigate('/login')
  }

  const productosFiltrados = productos

  // Nombre a mostrar
  const nombreAdmin = tienda.usuario || tienda.nombre_tienda || 'Administrador'
  const inicialAvatar = (nombreAdmin[0] || 'A').toUpperCase()

  return (
    <div style={styles.fondoApp}>
      {/* Input invisible para cambiar foto de perfil */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleSeleccionarAvatar}
      />

      {/* Input invisible para subir logo de la tienda */}
      <input
        ref={logoFileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleSeleccionarLogo}
      />

      {/* ================================================================
          1. BARRA SUPERIOR (NAVBAR)
      ================================================================ */}
      <header style={styles.navbar}>
        <div style={styles.navContainer} className="nav-container-responsive">
          {/* Nombre y Logo de la Tienda */}
          <div style={styles.storeBranding}>
            <div style={styles.storeIconBox} title={tienda?.nombre_tienda || 'Logo de la tienda'}>
              {tienda?.logo_url ? (
                <img
                  src={tienda.logo_url}
                  alt={tienda?.nombre_tienda || 'Logo'}
                  style={styles.storeLogoImg}
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
              ) : (
                <Store size={26} color="#0F766E" strokeWidth={2.2} />
              )}
            </div>
            <span style={styles.storeNameText} className="nav-store-name">
              {tienda?.nombre_tienda || 'Mi Tienda'}
            </span>
          </div>

          {/* Acciones Derecha (Notificaciones + Perfil) */}
          <div style={styles.navRight}>
            {/* Campana de Notificaciones con Menú Desplegable */}
            <div ref={notifMenuRef} style={{ position: 'relative' }}>
              <button
                type="button"
                style={styles.bellButton}
                onClick={() => setMenuNotificacionesAbierto((v) => !v)}
                title={pedidosPendientes.length > 0 ? `${pedidosPendientes.length} pedidos pendientes` : 'Sin notificaciones pendientes'}
                aria-label="Notificaciones"
              >
                <Bell size={19} color={pedidosPendientes.length > 0 ? '#0F766E' : '#64748B'} />
                {pedidosPendientes.length > 0 && (
                  <span style={styles.bellDot} />
                )}
              </button>

              {/* Popover / Menú flotante de Notificaciones */}
              {menuNotificacionesAbierto && (
                <div style={styles.notifDropdown}>
                  {/* Encabezado */}
                  <div style={styles.notifHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Bell size={16} color="#0F766E" />
                      <span style={{ fontWeight: '700', fontSize: 14, color: '#0F172A' }}>Notificaciones</span>
                    </div>
                    {pedidosPendientes.length > 0 ? (
                      <span style={styles.notifBadge}>
                        {pedidosPendientes.length} {pedidosPendientes.length === 1 ? 'nueva' : 'nuevas'}
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, color: '#94A3B8' }}>Al día</span>
                    )}
                  </div>

                  {/* Lista de Notificaciones de Pedidos */}
                  <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                    {pedidosPendientes.length === 0 ? (
                      <div style={styles.notifVacio}>
                        <div style={styles.notifVacioIcon}>
                          <BellOff size={22} color="#94A3B8" />
                        </div>
                        <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: '600', color: '#334155' }}>
                          No tienes notificaciones nuevas
                        </p>
                        <span style={{ fontSize: 11, color: '#94A3B8' }}>
                          Todos los pedidos están atendidos
                        </span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {pedidosPendientes.map((ped) => (
                          <button
                            key={ped.id}
                            type="button"
                            onClick={() => {
                              setTabActiva('pedidos')
                              setPedidoDetalleModal(ped)
                              setMenuNotificacionesAbierto(false)
                            }}
                            style={styles.notifItem}
                          >
                            <div style={styles.notifItemIcon}>
                              <ShoppingBag size={15} color="#D97706" />
                            </div>
                            <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                              <p style={{ margin: 0, fontSize: 13, color: '#0F172A', lineHeight: 1.3 }}>
                                Nuevo pedido de <strong>{ped.nombre_cliente}</strong>
                              </p>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                                <span style={{ fontSize: 13, fontWeight: '800', color: '#0F766E' }}>
                                  ${Number(ped.total || 0).toFixed(2)}
                                </span>
                                <span style={{ fontSize: 11, color: '#94A3B8' }}>•</span>
                                <span style={{ fontSize: 11, color: '#64748B' }}>
                                  {formatearFechaHora(ped.created_at)}
                                </span>
                              </div>
                            </div>
                            <ArrowRight size={14} color="#94A3B8" style={{ flexShrink: 0, marginLeft: 4 }} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Pie del Menú */}
                  <div style={styles.notifFooter}>
                    <button
                      type="button"
                      onClick={() => {
                        setTabActiva('pedidos')
                        setMenuNotificacionesAbierto(false)
                      }}
                      style={styles.notifVerTodosBtn}
                    >
                      Ver todos los pedidos en el historial →
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div style={styles.navDivider} />

            {/* Menú de Perfil del Administrador (Dropdown) */}
            <div ref={profileMenuRef} style={{ position: 'relative' }}>
              <div
                style={styles.profileBtn}
                onClick={() => setMenuPerfilAbierto((v) => !v)}
              >
                {/* Avatar circular */}
                {tienda?.avatar_url ? (
                  <img
                    src={tienda.avatar_url}
                    alt={nombreAdmin}
                    style={styles.navAvatarImg}
                  />
                ) : (
                  <div style={styles.navAvatarPlaceholder}>
                    {inicialAvatar}
                  </div>
                )}

                <div className="nav-user-text" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.2 }}>
                  <span style={styles.navUserName}>{nombreAdmin}</span>
                  <span style={styles.navUserRole}>Administrador</span>
                </div>

                <ChevronDown size={16} color="#64748B" style={{ marginLeft: 4 }} />
              </div>

              {/* Menú flotante desplegable */}
              {menuPerfilAbierto && (
                <div style={styles.dropdownCard}>
                  <div style={styles.dropdownHeader}>
                    <p style={{ margin: 0, fontWeight: '700', fontSize: 14, color: '#0F172A' }}>{nombreAdmin}</p>
                    <span style={{ fontSize: 12, color: '#64748B' }}>Panel de Control</span>
                  </div>

                  <button
                    type="button"
                    style={styles.dropdownItem}
                    onClick={() => {
                      setMenuPerfilAbierto(false)
                      abrirModalConfiguracion()
                    }}
                  >
                    <Settings size={16} color="#0F766E" />
                    <span>Configuraciones</span>
                  </button>

                  <button
                    type="button"
                    style={styles.dropdownItem}
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={subiendoAvatar}
                  >
                    <Camera size={16} color="#0F766E" />
                    <span>{subiendoAvatar ? 'Subiendo foto...' : 'Cambiar foto de perfil'}</span>
                  </button>

                  <button
                    type="button"
                    style={styles.dropdownItem}
                    onClick={() => {
                      setMenuPerfilAbierto(false)
                      setModalPasswordAbierto(true)
                    }}
                  >
                    <Lock size={16} color="#0F766E" />
                    <span>Cambiar contraseña</span>
                  </button>

                  <div style={{ height: 1, background: '#F1F5F9', margin: '4px 0' }} />

                  <button
                    type="button"
                    style={{ ...styles.dropdownItem, color: '#E11D48' }}
                    onClick={handleCerrarSesion}
                  >
                    <LogOut size={16} color="#E11D48" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ================================================================
          CONTENEDOR PRINCIPAL
      ================================================================ */}
      <main style={styles.mainContainer}>

        {/* ================================================================
            2. ENCABEZADO Y TARJETA DEL ADMINISTRADOR
        ================================================================ */}
        <div style={{ marginBottom: 20 }}>
          {/* Título de la vista */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={styles.gridIconBox}>
              <LayoutGrid size={22} color="#059669" />
            </div>
            <div>
              <h1 style={styles.pageTitle}>Panel de Administración</h1>
              <p style={styles.pageSubtitle}>Gestiona tu inventario y mantén el control del sistema</p>
            </div>
          </div>

          {/* Tarjeta de Información del Administrador */}
          <div style={styles.adminCard} className="admin-card-responsive">
            <div style={styles.adminCardLeft} className="admin-card-left-responsive">
              {/* Foto de perfil grande */}
              <div style={styles.largeAvatarContainer}>
                {tienda?.avatar_url ? (
                  <img
                    src={tienda.avatar_url}
                    alt={nombreAdmin}
                    style={styles.largeAvatarImg}
                  />
                ) : (
                  <div style={styles.largeAvatarPlaceholder}>
                    {inicialAvatar}
                  </div>
                )}
                {/* Punto verde de status online */}
                <span style={styles.onlineDot} title="En línea" />
              </div>

              {/* Datos de la tienda */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <h2 style={styles.adminName}>{nombreAdmin}</h2>
                  <span style={styles.badgeAdmin}>
                    <CheckCircle2 size={13} color="#047857" />
                    Administrador
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                  <Link2 size={14} color="#64748B" style={{ flexShrink: 0 }} />
                  <a
                    href={linkPublico}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.adminLink}
                    className="admin-link-responsive"
                    title="Haz clic para abrir tu catálogo público"
                  >
                    {linkPublico}
                  </a>
                </div>
              </div>
            </div>

            {/* Botones de acción del catálogo */}
            <div style={styles.adminCardRight} className="admin-btn-group-responsive">
              <button
                type="button"
                onClick={() => setModalCompartir(true)}
                style={styles.btnCompartir}
              >
                <Share2 size={16} color="#FFFFFF" />
                <span>Compartir Catálogo</span>
              </button>

              <a
                href={linkPublico}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.btnVerCatalogo}
              >
                <Eye size={16} color="#0F172A" />
                <span>Ver Catálogo</span>
              </a>
            </div>
          </div>
        </div>

        {/* ================================================================
            BARRA DE PESTAÑAS (TABS DEL PANEL ADMINISTRATIVO)
        ================================================================ */}
        <div className="admin-tabs-scroll" style={styles.tabsContainer}>
          <button
            type="button"
            onClick={() => setTabActiva('inventario')}
            style={tabActiva === 'inventario' ? styles.tabNavBtnActivo : styles.tabNavBtn}
          >
            <Package size={17} />
            <span>Inventario y Categorías</span>
          </button>

          <button
            type="button"
            onClick={() => setTabActiva('pedidos')}
            style={tabActiva === 'pedidos' ? styles.tabNavBtnActivo : styles.tabNavBtn}
          >
            <ClipboardList size={17} />
            <span>Historial de Pedidos</span>
            {pedidosPendientesCount > 0 && (
              <span style={styles.badgeTabPendiente}>
                {pedidosPendientesCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setTabActiva('finanzas')}
            style={tabActiva === 'finanzas' ? styles.tabNavBtnActivo : styles.tabNavBtn}
          >
            <TrendingUp size={17} />
            <span>Reportes Financieros</span>
          </button>

          <button
            type="button"
            onClick={() => setTabActiva('valoraciones')}
            style={tabActiva === 'valoraciones' ? styles.tabNavBtnActivo : styles.tabNavBtn}
          >
            <Star size={17} />
            <span>Valoraciones</span>
            {valoraciones.length > 0 && (
              <span style={styles.badgeTabNeutral}>
                {valoraciones.length}
              </span>
            )}
          </button>
        </div>

        {/* ================================================================
            PESTAÑA 1: INVENTARIO Y CATEGORÍAS
        ================================================================ */}
        {tabActiva === 'inventario' && (
          <>
        {/* ================================================================
            3. SECCIÓN CATEGORÍAS
        ================================================================ */}
        <section style={styles.cardSection} className="section-card-responsive">
          <div style={styles.sectionHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Box size={20} color="#059669" />
              <h2 style={styles.sectionTitle}>Categorías</h2>
            </div>
          </div>

          {/* Formulario Crear Categoría */}
          <form onSubmit={handleCrearCategoria} style={styles.categoriaForm} className="categoria-form-responsive">
            <input
              type="text"
              value={nuevaCategoria}
              onChange={(e) => setNuevaCategoria(e.target.value)}
              placeholder="Nombre de la categoría"
              style={styles.inputCategoria}
            />
            <button
              type="submit"
              disabled={guardandoCat}
              style={styles.btnAgregarCat}
            >
              <Plus size={16} color="#FFFFFF" />
              <span>{guardandoCat ? 'Agregando...' : 'Agregar'}</span>
            </button>
          </form>

          {cargandoCats && <p style={styles.hintTxt}>Cargando categorías...</p>}
          {errorCats && <p style={styles.errorTxt}>Error: {errorCats}</p>}
          {!cargandoCats && categorias.length === 0 && (
            <p style={styles.hintTxt}>No tienes categorías creadas aún. Escribe un nombre arriba y pulsa "+ Agregar".</p>
          )}

          {/* Listado de categorías */}
          {categorias.length > 0 && (
            <div
              className="max-h-64 overflow-y-auto pr-2"
              style={{
                ...styles.listaCategorias,
                maxHeight: '16rem',
                overflowY: 'auto',
                paddingRight: '8px',
              }}
            >
              {categorias.map((cat) => {
                const enEdicion = categoriaEnEdicionId === cat.id

                return (
                  <div key={cat.id} style={styles.itemCategoria}>
                    {enEdicion ? (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', width: '100%' }}>
                        <input
                          type="text"
                          value={nombreEditadoCategoria}
                          onChange={(e) => setNombreEditadoCategoria(e.target.value)}
                          style={styles.inputCategoriaEdicion}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleGuardarEdicionCategoria(cat.id)
                            if (e.key === 'Escape') handleCancelarEdicionCategoria()
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleGuardarEdicionCategoria(cat.id)}
                          disabled={guardandoEdicionCat}
                          style={styles.btnGuardarPill}
                        >
                          {guardandoEdicionCat ? 'Guardando...' : 'Guardar'}
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelarEdicionCategoria}
                          style={styles.btnCancelarPill}
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <>
                        <span style={styles.nombreCategoria}>{cat.nombre}</span>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleIniciarEdicionCategoria(cat)}
                            style={styles.btnEditarPill}
                            title="Editar nombre de categoría"
                          >
                            <Edit size={14} color="#0F172A" />
                            <span>Editar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEliminarCategoria(cat.id)}
                            style={styles.btnEliminarPill}
                            title="Eliminar categoría"
                          >
                            <Trash2 size={14} color="#E11D48" />
                            <span>Eliminar</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* ================================================================
            4. SECCIÓN INVENTARIO DE PRODUCTOS
        ================================================================ */}
        <section style={styles.cardSection} className="section-card-responsive">
          <div style={styles.sectionHeaderBetween}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Package size={20} color="#059669" />
              <h2 style={styles.sectionTitle}>Inventario de Productos</h2>
            </div>

            <button
              type="button"
              onClick={() => {
                if (formAbierto) resetFormulario()
                else {
                  resetFormulario()
                  setFormAbierto(true)
                }
              }}
              style={styles.btnNuevoProducto}
              className="btn-nuevo-producto-responsive"
            >
              <Plus size={16} color="#FFFFFF" />
              <span>{formAbierto ? 'Cerrar formulario' : 'Nuevo producto'}</span>
            </button>
          </div>

          {/* Formulario Desplegable para Crear / Editar Producto */}
          {formAbierto && (
            <form onSubmit={handleGuardarProducto} style={styles.formProductoBox}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: '700', color: '#0F172A' }}>
                  {productoEnEdicion ? `Editar producto: ${productoEnEdicion.nombre}` : 'Agregar nuevo producto'}
                </h3>
                {productoEnEdicion && (
                  <button type="button" onClick={resetFormulario} style={styles.btnSecundarioSm}>
                    Cancelar edición
                  </button>
                )}
              </div>

              <div style={styles.formGrid}>
                <div style={styles.fieldCol}>
                  <label style={styles.formLabel}>Nombre del producto *</label>
                  <input
                    name="nombre"
                    value={formProducto.nombre}
                    onChange={handleFormChange}
                    placeholder="Ej: Camisa Elegante"
                    style={styles.formInput}
                    required
                  />
                </div>

                <div style={styles.fieldCol}>
                  <label style={styles.formLabel}>Categoría *</label>
                  <select
                    name="categoria_id"
                    value={formProducto.categoria_id}
                    onChange={handleFormChange}
                    style={styles.formInput}
                    required
                  >
                    <option value="">-- Selecciona --</option>
                    {categorias.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))}
                  </select>
                </div>

                <div style={styles.fieldCol}>
                  <label style={styles.formLabel}>Precio ($) *</label>
                  <input
                    name="precio"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formProducto.precio}
                    onChange={handleFormChange}
                    placeholder="0.00"
                    style={styles.formInput}
                    required
                  />
                </div>

                <div style={styles.fieldCol}>
                  <label style={styles.formLabel}>Stock (Unidades disponibles) *</label>
                  <input
                    name="stock"
                    type="number"
                    min="0"
                    step="1"
                    value={formProducto.stock}
                    onChange={handleFormChange}
                    placeholder="Ej: 5"
                    style={styles.formInput}
                    required
                  />
                </div>

                {/* Subida de Imagen con Selector de Archivo y Preview */}
                <div style={{ ...styles.fieldCol, gridColumn: '1 / -1' }}>
                  <label style={styles.formLabel}>Foto del producto (sube un archivo de imagen)</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleArchivoChange}
                    style={{ ...styles.formInput, padding: '7px 10px' }}
                  />

                  {previewImagen && (
                    <div style={styles.previewContainer}>
                      <img
                        src={previewImagen}
                        alt="Vista previa"
                        style={styles.previewImg}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontSize: 13, color: '#334155', fontWeight: '500' }}>
                          {archivoImagen ? archivoImagen.name : 'Imagen actual guardada'}
                        </span>
                        <button
                          type="button"
                          onClick={handleQuitarImagen}
                          style={styles.btnQuitarFoto}
                        >
                          Quitar foto
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ ...styles.fieldCol, gridColumn: '1 / -1' }}>
                  <label style={styles.formLabel}>Descripción</label>
                  <textarea
                    name="descripcion"
                    value={formProducto.descripcion}
                    onChange={handleFormChange}
                    placeholder="Breve descripción para tus clientes..."
                    rows={2}
                    style={{ ...styles.formInput, resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    id="disponible"
                    name="disponible"
                    checked={formProducto.disponible}
                    onChange={handleFormChange}
                    style={{ width: 16, height: 16, cursor: 'pointer' }}
                  />
                  <label htmlFor="disponible" style={{ fontSize: 14, color: '#334155', cursor: 'pointer' }}>
                    Disponible en el catálogo
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button
                  type="submit"
                  disabled={guardandoProd}
                  style={styles.btnGuardarProducto}
                >
                  {guardandoProd ? 'Guardando en Supabase...' : (productoEnEdicion ? '✓ Guardar cambios' : '✓ Guardar producto')}
                </button>
                <button
                  type="button"
                  onClick={resetFormulario}
                  style={styles.btnSecundario}
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {cargandoProds && <p style={styles.hintTxt}>Cargando productos...</p>}
          {errorProds && <p style={styles.errorTxt}>Error: {errorProds}</p>}
          {!cargandoProds && productosFiltrados.length === 0 && (
            <p style={styles.hintTxt}>
              Aún no tienes productos registrados. Haz clic en "+ Nuevo producto" para crear el primero.
            </p>
          )}

          {/* TABLA DE PRODUCTOS (DESKTOP / TABLETS) */}
          {productosFiltrados.length > 0 && (
            <div
              className="hidden md:block max-h-[500px] overflow-y-auto pr-2"
              style={{
                overflowX: 'auto',
                overflowY: 'auto',
                maxHeight: '500px',
                paddingRight: '8px',
                marginTop: 12,
              }}
            >
              <table style={styles.table}>
                <thead
                  className="sticky top-0 bg-white z-10"
                  style={{
                    position: 'sticky',
                    top: 0,
                    backgroundColor: '#FFFFFF',
                    zIndex: 10,
                  }}
                >
                  <tr>
                    <th style={styles.th}>Imagen</th>
                    <th style={styles.th}>Producto</th>
                    <th style={styles.th}>Categoría</th>
                    <th style={styles.th}>Precio</th>
                    <th style={styles.th}>Stock / Inventario</th>
                    <th style={styles.th}>Estado</th>
                    <th style={styles.th}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productosFiltrados.map((prod) => {
                    const catNombre = categorias.find((c) => c.id === prod.categoria_id)?.nombre || '—'
                    const stockActual = prod.stock ?? 0
                    const estaAgotado = stockActual <= 0

                    return (
                      <tr key={prod.id} style={styles.tr}>
                        {/* Imagen miniatura */}
                        <td style={styles.td}>
                          {prod.imagen_url ? (
                            <img
                              src={prod.imagen_url}
                              alt={prod.nombre}
                              style={styles.productThumb}
                              onError={(e) => { e.currentTarget.style.display = 'none' }}
                            />
                          ) : (
                            <div style={styles.productThumbPlaceholder}>
                              📷
                            </div>
                          )}
                        </td>

                        {/* Nombre y descripción */}
                        <td style={styles.td}>
                          <div style={styles.productName}>{prod.nombre}</div>
                          {prod.descripcion && (
                            <div style={styles.productDesc}>
                              {prod.descripcion.length > 55 ? `${prod.descripcion.slice(0, 55)}…` : prod.descripcion}
                            </div>
                          )}
                        </td>

                        {/* Categoría */}
                        <td style={styles.td}>
                          <span style={styles.categoryBadge}>{catNombre}</span>
                        </td>

                        {/* Precio */}
                        <td style={styles.td}>
                          <strong style={styles.productPrice}>${Number(prod.precio).toFixed(2)}</strong>
                        </td>

                        {/* Stock Interactivo ( - [X u.] + ) */}
                        <td style={styles.td}>
                          <div style={styles.stockControlWrapper}>
                            <button
                              type="button"
                              onClick={() => handleCambiarStockRapido(prod, -1)}
                              disabled={stockActual <= 0}
                              style={styles.stockBtnMinus}
                              title="Restar 1 unidad"
                            >
                              <Minus size={13} color={stockActual <= 0 ? '#94A3B8' : '#334155'} />
                            </button>

                            <span style={estaAgotado ? styles.stockPillAgotado : styles.stockPillOk}>
                              {estaAgotado ? '0 u.' : `${stockActual} u.`}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleCambiarStockRapido(prod, 1)}
                              style={styles.stockBtnPlus}
                              title="Sumar 1 unidad"
                            >
                              <Plus size={13} color="#334155" />
                            </button>
                          </div>
                        </td>

                        {/* Estado */}
                        <td style={styles.td}>
                          <span style={prod.disponible ? styles.estadoActivo : styles.estadoOculto}>
                            {prod.disponible ? '● Activo' : '○ Oculto'}
                          </span>
                        </td>

                        {/* Acciones */}
                        <td style={styles.td}>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleEditarProducto(prod)}
                              style={styles.actionBtnWhite}
                              title="Editar producto"
                            >
                              <Edit size={14} color="#0F172A" />
                              <span>Editar</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleDisponible(prod)}
                              style={styles.actionBtnWhite}
                              title={prod.disponible ? 'Ocultar producto del catálogo' : 'Mostrar producto'}
                            >
                              <Eye size={14} color="#0F172A" />
                              <span>{prod.disponible ? 'Ocultar' : 'Activar'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleEliminarProducto(prod.id)}
                              style={styles.actionBtnDanger}
                              title="Eliminar producto"
                            >
                              <Trash2 size={14} color="#E11D48" />
                              <span>Eliminar</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* VISTA MÓVIL: TARJETAS INDIVIDUALES DE PRODUCTOS (TELÉFONOS) */}
          {productosFiltrados.length > 0 && (
            <div
              className="flex flex-col gap-4 md:hidden max-h-[500px] overflow-y-auto pr-2"
              style={{
                maxHeight: '500px',
                overflowY: 'auto',
                paddingRight: '8px',
                marginTop: 12,
              }}
            >
              {productosFiltrados.map((prod) => {
                const catNombre = categorias.find((c) => c.id === prod.categoria_id)?.nombre || '—'
                const stockActual = prod.stock ?? 0
                const estaAgotado = stockActual <= 0

                return (
                  <div key={prod.id} className="mobile-product-card">
                    {/* Encabezado: Foto + Nombre + Categoría + Estado */}
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      {prod.imagen_url ? (
                        <img
                          src={prod.imagen_url}
                          alt={prod.nombre}
                          className="mobile-product-thumb"
                          onError={(e) => { e.currentTarget.style.display = 'none' }}
                        />
                      ) : (
                        <div className="mobile-product-thumb-placeholder">📷</div>
                      )}

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                          <h4 className="mobile-product-name">{prod.nombre}</h4>
                          <span style={prod.disponible ? styles.estadoActivo : styles.estadoOculto}>
                            {prod.disponible ? '● Activo' : '○ Oculto'}
                          </span>
                        </div>
                        <span style={styles.categoryBadge}>{catNombre}</span>
                        {prod.descripcion && (
                          <p className="mobile-product-desc">{prod.descripcion}</p>
                        )}
                      </div>
                    </div>

                    {/* Fila de Precio y Control de Stock táctil */}
                    <div className="mobile-stock-row">
                      <div>
                        <span style={{ fontSize: 11, color: '#64748B', display: 'block', fontWeight: '600' }}>PRECIO:</span>
                        <strong className="mobile-product-price">${Number(prod.precio).toFixed(2)}</strong>
                      </div>

                      <div className="mobile-stock-control-wrapper">
                        <button
                          type="button"
                          onClick={() => handleCambiarStockRapido(prod, -1)}
                          disabled={stockActual <= 0}
                          className="mobile-stock-btn"
                          title="Restar 1 unidad"
                        >
                          <Minus size={15} color={stockActual <= 0 ? '#94A3B8' : '#0F172A'} />
                        </button>

                        <span className={estaAgotado ? 'mobile-stock-pill-agotado' : 'mobile-stock-pill-ok'}>
                          {estaAgotado ? '0 u. Agotado' : `${stockActual} u.`}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleCambiarStockRapido(prod, 1)}
                          className="mobile-stock-btn"
                          title="Sumar 1 unidad"
                        >
                          <Plus size={15} color="#0F172A" />
                        </button>
                      </div>
                    </div>

                    {/* Fila de Acciones táctiles */}
                    <div className="mobile-actions-row">
                      <button
                        type="button"
                        onClick={() => handleEditarProducto(prod)}
                        className="mobile-action-btn-white"
                      >
                        <Edit size={14} color="#0F172A" />
                        <span>Editar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleDisponible(prod)}
                        className="mobile-action-btn-white"
                      >
                        <Eye size={14} color="#0F172A" />
                        <span>{prod.disponible ? 'Ocultar' : 'Activar'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleEliminarProducto(prod.id)}
                        className="mobile-action-btn-danger"
                      >
                        <Trash2 size={14} color="#E11D48" />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
        </>
        )}

        {/* ================================================================
            PESTAÑA 2: HISTORIAL DE PEDIDOS
        ================================================================ */}
        {tabActiva === 'pedidos' && (
          <section style={styles.cardSection} className="section-card-responsive">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={styles.gridIconBox}>
                  <ClipboardList size={20} color="#059669" />
                </div>
                <div>
                  <h2 style={styles.sectionTitle}>Historial de Pedidos</h2>
                  <p style={{ margin: 0, fontSize: 13, color: '#64748B' }}>
                    Gestiona los pedidos de tus clientes y actualiza su estado
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={cargarPedidos}
                style={styles.btnSecundario}
                title="Actualizar listado de pedidos"
              >
                <RefreshCw size={15} />
                <span>Actualizar</span>
              </button>
            </div>

            {/* Filtros de estado y buscador */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[
                  { key: 'todos', label: 'Todos', count: pedidos.length },
                  { key: 'pendiente', label: 'Pendientes', count: pedidos.filter(p => p.estado === 'pendiente').length },
                  { key: 'pagado', label: 'Pagados', count: pedidos.filter(p => p.estado === 'pagado').length },
                  { key: 'cancelado', label: 'Cancelados', count: pedidos.filter(p => p.estado === 'cancelado').length },
                ].map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setFiltroEstadoPedido(f.key)}
                    style={filtroEstadoPedido === f.key ? styles.filtroChipActivo : styles.filtroChip}
                  >
                    <span>{f.label}</span>
                    <span style={{ fontSize: 11, opacity: 0.85 }}>({f.count})</span>
                  </button>
                ))}
              </div>

              <div style={{ position: 'relative', minWidth: 220 }}>
                <input
                  type="text"
                  placeholder="Buscar por cliente..."
                  value={busquedaPedido}
                  onChange={(e) => setBusquedaPedido(e.target.value)}
                  style={styles.inputBusquedaSimple}
                />
              </div>
            </div>

            {cargandoPedidos && <p style={styles.hintTxt}>Cargando pedidos de la tienda...</p>}
            {errorPedidos && <p style={styles.errorTxt}>Error al cargar pedidos: {errorPedidos}</p>}

            {!cargandoPedidos && pedidosFiltradosFinal.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 16px', background: '#F8FAFC', borderRadius: 16, border: '1px dashed #CBD5E1' }}>
                <ClipboardList size={36} color="#94A3B8" style={{ margin: '0 auto 10px' }} />
                <h4 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: '#0F172A' }}>
                  No se encontraron pedidos
                </h4>
                <p style={{ margin: 0, fontSize: 13, color: '#64748B' }}>
                  {filtroEstadoPedido !== 'todos' || busquedaPedido
                    ? 'No hay pedidos que coincidan con el filtro actual.'
                    : 'Cuando tus clientes hagan pedidos por el catálogo, aparecerán aquí.'}
                </p>
              </div>
            )}

            {/* TABLA DESKTOP */}
            {pedidosFiltradosFinal.length > 0 && (
              <div className="desktop-only" style={{ overflowX: 'auto' }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Cliente</th>
                      <th style={styles.th}>Fecha</th>
                      <th style={styles.th}>Total</th>
                      <th style={styles.th}>Estado</th>
                      <th style={{ ...styles.th, textAlign: 'center' }}>Detalles</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedidosFiltradosFinal.map((ped) => (
                      <tr key={ped.id} style={styles.tr}>
                        <td style={styles.td}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <strong style={{ color: '#0F172A', fontSize: 14 }}>{ped.nombre_cliente}</strong>
                            {ped.telefono_cliente && (
                              <span style={{ fontSize: 12, color: '#64748B' }}>
                                {ped.telefono_cliente}
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={styles.td}>
                          <span style={{ fontSize: 13, color: '#475569' }}>
                            {formatearFechaHora(ped.created_at)}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <strong style={{ fontSize: 16, color: '#0F766E' }}>
                            ${Number(ped.total || 0).toFixed(2)}
                          </strong>
                        </td>
                        <td style={styles.td}>
                          <select
                            value={ped.estado}
                            disabled={actualizandoEstadoId === ped.id}
                            onChange={(e) => handleCambiarEstadoPedido(ped.id, e.target.value)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: 20,
                              fontWeight: '700',
                              fontSize: 12,
                              cursor: 'pointer',
                              outline: 'none',
                              ...getEstadoStyle(ped.estado),
                            }}
                          >
                            <option value="pendiente">⏳ Pendiente</option>
                            <option value="pagado">✓ Pagado</option>
                            <option value="cancelado">✕ Cancelado</option>
                          </select>
                        </td>
                        <td style={{ ...styles.td, textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => setPedidoDetalleModal(ped)}
                            className="btn-ver-items"
                            title="Ver detalles e ítems del pedido"
                          >
                            <Eye size={15} strokeWidth={2.2} />
                            <span>Ver ítems</span>
                            <span className="btn-ver-items-count">
                              {ped.pedido_items?.length || 0}
                            </span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TARJETAS MOBILE */}
            {pedidosFiltradosFinal.length > 0 && (
              <div className="mobile-only mobile-cards-container">
                {pedidosFiltradosFinal.map((ped) => (
                  <div key={ped.id} className="mobile-product-card" style={{ gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h4 className="mobile-product-name">{ped.nombre_cliente}</h4>
                        <span style={{ fontSize: 12, color: '#64748B' }}>{formatearFechaHora(ped.created_at)}</span>
                        {ped.telefono_cliente && (
                          <p style={{ margin: '3px 0 0', fontSize: 12, color: '#475569' }}>
                            {ped.telefono_cliente}
                          </p>
                        )}
                      </div>
                      <strong style={{ fontSize: 18, color: '#0F766E' }}>
                        ${Number(ped.total || 0).toFixed(2)}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid #F1F5F9' }}>
                      <select
                        value={ped.estado}
                        disabled={actualizandoEstadoId === ped.id}
                        onChange={(e) => handleCambiarEstadoPedido(ped.id, e.target.value)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 20,
                          fontWeight: '700',
                          fontSize: 12,
                          cursor: 'pointer',
                          outline: 'none',
                          ...getEstadoStyle(ped.estado),
                        }}
                      >
                        <option value="pendiente">⏳ Pendiente</option>
                        <option value="pagado">✓ Pagado</option>
                        <option value="cancelado">✕ Cancelado</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => setPedidoDetalleModal(ped)}
                        className="btn-ver-items"
                        title="Ver detalles e ítems del pedido"
                      >
                        <Eye size={15} strokeWidth={2.2} />
                        <span>Ver ítems</span>
                        <span className="btn-ver-items-count">
                          {ped.pedido_items?.length || 0}
                        </span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ================================================================
            PESTAÑA 3: REPORTES FINANCIEROS
        ================================================================ */}
        {tabActiva === 'finanzas' && (
          <section style={styles.cardSection} className="section-card-responsive">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={styles.gridIconBox}>
                <TrendingUp size={20} color="#059669" />
              </div>
              <div>
                <h2 style={styles.sectionTitle}>Reportes Financieros</h2>
                <p style={{ margin: 0, fontSize: 13, color: '#64748B' }}>
                  Ingresos acumulados exclusivamente por pedidos marcados como <strong>Pagados</strong>
                </p>
              </div>
            </div>

            {/* 3 TARJETAS KPI PRINCIPALES */}
            <div style={styles.finanzasGrid}>
              {/* Semana */}
              <div style={styles.kpiCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={styles.kpiLabel}>Ingresos de la Semana</span>
                  <div style={{ width: 38, height: 38, borderRadius: 12, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                    <Calendar size={18} />
                  </div>
                </div>
                <h3 style={styles.kpiMonto}>
                  ${ingresosReportes.semana.toFixed(2)}
                </h3>
                <span style={styles.kpiSub}>Últimos 7 días corridos</span>
              </div>

              {/* Mes */}
              <div style={styles.kpiCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={styles.kpiLabel}>Ingresos del Mes</span>
                  <div style={{ width: 38, height: 38, borderRadius: 12, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
                    <DollarSign size={18} />
                  </div>
                </div>
                <h3 style={styles.kpiMonto}>
                  ${ingresosReportes.mes.toFixed(2)}
                </h3>
                <span style={styles.kpiSub}>Mes calendario en curso</span>
              </div>

              {/* Año */}
              <div style={styles.kpiCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={styles.kpiLabel}>Ingresos del Año</span>
                  <div style={{ width: 38, height: 38, borderRadius: 12, background: '#FDF2F8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DB2777' }}>
                    <TrendingUp size={18} />
                  </div>
                </div>
                <h3 style={styles.kpiMonto}>
                  ${ingresosReportes.anio.toFixed(2)}
                </h3>
                <span style={styles.kpiSub}>Año en curso</span>
              </div>
            </div>

            {/* METRICAS SECUNDARIAS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginTop: 18 }}>
              <div style={styles.kpiMiniCard}>
                <span style={styles.kpiMiniLabel}>Ventas Totales Pagadas</span>
                <strong style={styles.kpiMiniVal}>{pedidosPagados.length} pedidos</strong>
              </div>
              <div style={styles.kpiMiniCard}>
                <span style={styles.kpiMiniLabel}>Ticket Promedio</span>
                <strong style={styles.kpiMiniVal}>${ingresosReportes.ticketPromedio.toFixed(2)}</strong>
              </div>
              <div style={styles.kpiMiniCard}>
                <span style={styles.kpiMiniLabel}>Total Histórico Cobrado</span>
                <strong style={{ ...styles.kpiMiniVal, color: '#0F766E' }}>${ingresosReportes.historico.toFixed(2)}</strong>
              </div>
              <div style={styles.kpiMiniCard}>
                <span style={styles.kpiMiniLabel}>Pendiente por Cobrar</span>
                <strong style={{ ...styles.kpiMiniVal, color: '#D97706' }}>
                  ${pedidos.filter(p => p.estado === 'pendiente').reduce((s, p) => s + Number(p.total || 0), 0).toFixed(2)}
                </strong>
              </div>
            </div>
          </section>
        )}

        {/* ================================================================
            PESTAÑA 4: VALORACIONES (AGRUPADAS POR PRODUCTO CON ACORDEÓN)
        ================================================================ */}
        {tabActiva === 'valoraciones' && (
          <section style={styles.cardSection} className="section-card-responsive">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={styles.gridIconBox}>
                  <Star size={20} color="#D97706" />
                </div>
                <div>
                  <h2 style={styles.sectionTitle}>Valoraciones y Reseñas</h2>
                  <p style={{ margin: 0, fontSize: 13, color: '#64748B' }}>
                    Opiniones y calificaciones recibidas agrupadas por producto
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={cargarValoraciones}
                style={styles.btnSecundario}
                title="Actualizar valoraciones"
              >
                <RefreshCw size={15} />
                <span>Actualizar</span>
              </button>
            </div>

            {/* Tarjeta de promedio general */}
            <div style={{ background: '#FFFBEB', border: '1px solid #FEF3C7', borderRadius: 16, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 32, fontWeight: 800, color: '#B45309' }}>
                  {promedioValoraciones}
                </span>
                <span style={{ fontSize: 15, color: '#92400E', fontWeight: 600 }}>/ 5</span>
              </div>

              <div>
                <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={17}
                      fill={s <= Math.round(promedioValoraciones) ? '#F59E0B' : 'transparent'}
                      color={s <= Math.round(promedioValoraciones) ? '#F59E0B' : '#CBD5E1'}
                    />
                  ))}
                </div>
                <span style={{ fontSize: 13, color: '#78350F', fontWeight: 500 }}>
                  Promedio general basado en {valoraciones.length} {valoraciones.length === 1 ? 'reseña' : 'reseñas'} de {productosConValoraciones.length} {productosConValoraciones.length === 1 ? 'producto calificado' : 'productos calificados'}
                </span>
              </div>
            </div>

            {cargandoValoraciones && <p style={styles.hintTxt}>Cargando valoraciones...</p>}
            {errorValoraciones && <p style={styles.errorTxt}>Error al cargar valoraciones: {errorValoraciones}</p>}

            {!cargandoValoraciones && productosConValoraciones.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 16px', background: '#F8FAFC', borderRadius: 16, border: '1px dashed #CBD5E1' }}>
                <Star size={36} color="#CBD5E1" style={{ margin: '0 auto 10px' }} />
                <h4 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: '#0F172A' }}>
                  Aún no hay valoraciones
                </h4>
                <p style={{ margin: 0, fontSize: 13, color: '#64748B' }}>
                  Tus clientes podrán calificar tus productos directamente desde el catálogo público.
                </p>
              </div>
            )}

            {/* Listado de Productos Agrupados (Accordion) */}
            {productosConValoraciones.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {productosConValoraciones.map((prod) => {
                  const estaExpandido = Boolean(productosValoracionesExpandidos[prod.id])

                  return (
                    <div
                      key={prod.id}
                      style={{
                        background: '#FFFFFF',
                        border: estaExpandido ? '1px solid #0F766E' : '1px solid #E2E8F0',
                        borderRadius: 16,
                        overflow: 'hidden',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                      }}
                    >
                      {/* Vista Resumen (Cerrada / Cabecera clickeable) */}
                      <button
                        type="button"
                        onClick={() => toggleExpandirProducto(prod.id)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '16px 20px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontFamily: 'inherit',
                          gap: 12,
                        }}
                      >
                        {/* Nombre del Producto */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                          <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: '#ECFDF5',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#0F766E',
                            flexShrink: 0,
                          }}>
                            <ShoppingBag size={16} />
                          </div>
                          <span style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {prod.nombre}
                          </span>
                        </div>

                        {/* Promedio de estrellas + Total de reseñas + Chevron */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                          {/* Estrellitas según el promedio individual */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <div style={{ display: 'flex', gap: 2 }}>
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  size={15}
                                  fill={s <= Math.round(prod.promedio) ? '#F59E0B' : 'transparent'}
                                  color={s <= Math.round(prod.promedio) ? '#F59E0B' : '#E2E8F0'}
                                />
                              ))}
                            </div>
                            <strong style={{ fontSize: 14, color: '#B45309', marginLeft: 2 }}>
                              {prod.promedio}
                            </strong>
                          </div>

                          <span style={{ fontSize: 13, color: '#64748B', fontWeight: 500 }}>
                            ({prod.cantidad} {prod.cantidad === 1 ? 'reseña' : 'reseñas'})
                          </span>

                          <div style={{
                            transform: estaExpandido ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease',
                            color: '#64748B',
                            display: 'flex',
                            alignItems: 'center',
                          }}>
                            <ChevronDown size={18} />
                          </div>
                        </div>
                      </button>

                      {/* Vista Expandida (Al hacer clic) */}
                      {estaExpandido && (
                        <div
                          className="admin-accordion-content"
                          style={{
                            borderTop: '1px solid #F1F5F9',
                            background: '#F8FAFC',
                            padding: '18px 20px',
                            display: 'flex',
                            flexDirection: 'row',
                            gap: 20,
                            alignItems: 'flex-start',
                          }}
                        >
                          {/* Imagen del Producto a la izquierda */}
                          <div style={{ flexShrink: 0 }}>
                            {prod.imagen_url ? (
                              <img
                                src={prod.imagen_url}
                                alt={prod.nombre}
                                style={{
                                  width: 96,
                                  height: 96,
                                  borderRadius: 14,
                                  objectFit: 'cover',
                                  border: '1px solid #E2E8F0',
                                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                                }}
                                onError={(e) => { e.currentTarget.style.display = 'none' }}
                              />
                            ) : (
                              <div style={{
                                width: 96,
                                height: 96,
                                borderRadius: 14,
                                background: '#E2E8F0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#94A3B8',
                                fontSize: 12,
                                fontWeight: 600,
                              }}>
                                📷 Sin foto
                              </div>
                            )}
                          </div>

                          {/* Lista de reseñas individuales */}
                          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Reseñas de clientes ({prod.valoraciones.length})
                              </h4>
                              <span style={{ fontSize: 12, color: '#0F766E', fontWeight: 600 }}>
                                Promedio: {prod.promedio} / 5
                              </span>
                            </div>

                            <div
                              className="max-h-96 overflow-y-auto pr-2"
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 8,
                                maxHeight: 380,
                                overflowY: 'auto',
                                paddingRight: 8,
                              }}
                            >
                              {prod.valoraciones.map((v) => (
                                <div
                                  key={v.id}
                                  style={{
                                    background: '#FFFFFF',
                                    border: '1px solid #E2E8F0',
                                    borderRadius: 12,
                                    padding: '12px 14px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 6,
                                  }}
                                >
                                  {/* Cabecera de la reseña: Nombre + Fecha */}
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <div style={{
                                        width: 26,
                                        height: 26,
                                        borderRadius: '50%',
                                        background: '#E2E8F0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 11,
                                        fontWeight: 700,
                                        color: '#475569',
                                      }}>
                                        {(v.nombre_cliente || 'C').charAt(0).toUpperCase()}
                                      </div>
                                      <strong style={{ fontSize: 13, color: '#0F172A' }}>
                                        {v.nombre_cliente || 'Cliente anónimo'}
                                      </strong>
                                    </div>

                                    <span style={{ fontSize: 11, color: '#94A3B8' }}>
                                      {formatearFechaHora(v.created_at)}
                                    </span>
                                  </div>

                                  {/* Estrellas individuales */}
                                  <div style={{ display: 'flex', gap: 2 }}>
                                    {[1, 2, 3, 4, 5].map((s) => (
                                      <Star
                                        key={s}
                                        size={13}
                                        fill={s <= v.calificacion ? '#F59E0B' : 'transparent'}
                                        color={s <= v.calificacion ? '#F59E0B' : '#E2E8F0'}
                                      />
                                    ))}
                                    <span style={{ fontSize: 11, fontWeight: 700, color: '#D97706', marginLeft: 4 }}>
                                      {v.calificacion}/5
                                    </span>
                                  </div>

                                  {/* Comentario */}
                                  {v.comentario && (
                                    <p style={{ margin: 0, fontSize: 13, color: '#334155', lineHeight: 1.45, fontStyle: 'italic' }}>
                                      "{v.comentario}"
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        )}
      </main>

      {/* ================================================================
          MODAL: COMPARTIR CATÁLOGO
      ================================================================ */}
      {modalCompartir && (
        <div style={styles.modalBackdrop} onClick={() => setModalCompartir(false)}>
          <div style={styles.modalCard} className="modal-card-responsive" onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHead}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: '700', color: '#0F172A' }}>
                📤 Compartir Catálogo
              </h3>
              <button
                type="button"
                onClick={() => setModalCompartir(false)}
                style={styles.modalCloseIcon}
              >
                <X size={18} color="#64748B" />
              </button>
            </div>

            <p style={{ fontSize: 14, color: '#64748B', margin: '4px 0 16px' }}>
              Elige cómo deseas difundir el catálogo de <strong>{nombreAdmin}</strong>:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a
                href={linkWhatsappShare}
                target="_blank"
                rel="noopener noreferrer"
                style={{ ...styles.shareOption, background: '#25D366', color: '#FFFFFF' }}
              >
                <span style={{ fontSize: 18 }}>💬</span>
                <span>Compartir por WhatsApp</span>
              </a>

              <a
                href={linkFacebookShare}
                target="_blank"
                rel="noopener noreferrer"
                style={{ ...styles.shareOption, background: '#1877F2', color: '#FFFFFF' }}
              >
                <span style={{ fontSize: 18 }}>📘</span>
                <span>Compartir en Facebook</span>
              </a>

              <button
                type="button"
                onClick={handleCopiarLink}
                style={{ ...styles.shareOption, background: '#F8FAFC', color: '#0F172A', border: '1px solid #E2E8F0' }}
              >
                <span style={{ fontSize: 18 }}>📋</span>
                <span>{copiado ? '✓ ¡Enlace copiado al portapapeles!' : 'Copiar enlace al portapapeles'}</span>
              </button>

              <a
                href={linkPublico}
                target="_blank"
                rel="noopener noreferrer"
                style={{ ...styles.shareOption, background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0' }}
              >
                <span style={{ fontSize: 18 }}>👁️</span>
                <span>Abrir catálogo como cliente</span>
              </a>
            </div>

            {copiado && (
              <p style={{ margin: '14px 0 0', textAlign: 'center', color: '#059669', fontSize: 13, fontWeight: '700' }}>
                ✓ Enlace copiado. ¡Ya puedes compartirlo con tus clientes!
              </p>
            )}
          </div>
        </div>
      )}

      {/* ================================================================
          MODAL: CAMBIAR CONTRASEÑA
      ================================================================ */}
      {modalPasswordAbierto && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalCard} className="modal-card-responsive">
            <div style={styles.modalHead}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: '700', color: '#0F172A' }}>
                🔒 Cambiar Contraseña
              </h3>
            </div>

            <p style={{ fontSize: 14, color: '#64748B', margin: '4px 0 16px' }}>
              Para proteger tu cuenta, ingresa tu clave actual antes de definir una nueva.
            </p>

            <form onSubmit={handleGuardarNuevaPassword}>
              {/* 1. Contraseña actual */}
              <div style={{ marginBottom: 12 }}>
                <label style={styles.formLabel}>Contraseña actual *</label>
                <div style={styles.passInputWrapper}>
                  <input
                    type={mostrarPasswordModal ? 'text' : 'password'}
                    value={formPassword.actual}
                    onChange={(e) => {
                      setFormPassword((prev) => ({ ...prev, actual: e.target.value }))
                      setMsgPassword(null)
                    }}
                    placeholder="Escribe tu clave actual"
                    style={styles.passInputField}
                    autoFocus
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPasswordModal((v) => !v)}
                    style={styles.passToggleBtn}
                    title={mostrarPasswordModal ? 'Ocultar' : 'Mostrar'}
                  >
                    {mostrarPasswordModal ? <EyeOff size={16} color="#64748B" /> : <Eye size={16} color="#64748B" />}
                  </button>
                </div>
              </div>

              {/* 2. Nueva contraseña */}
              <div style={{ marginBottom: 12 }}>
                <label style={styles.formLabel}>Nueva contraseña * (mínimo 4 caracteres)</label>
                <div style={styles.passInputWrapper}>
                  <input
                    type={mostrarPasswordModal ? 'text' : 'password'}
                    value={formPassword.nueva}
                    onChange={(e) => {
                      setFormPassword((prev) => ({ ...prev, nueva: e.target.value }))
                      setMsgPassword(null)
                    }}
                    placeholder="Nueva contraseña"
                    style={styles.passInputField}
                    required
                  />
                </div>
              </div>

              {/* 3. Confirmar contraseña */}
              <div style={{ marginBottom: 14 }}>
                <label style={styles.formLabel}>Confirmar nueva contraseña *</label>
                <div style={styles.passInputWrapper}>
                  <input
                    type={mostrarPasswordModal ? 'text' : 'password'}
                    value={formPassword.confirmar}
                    onChange={(e) => {
                      setFormPassword((prev) => ({ ...prev, confirmar: e.target.value }))
                      setMsgPassword(null)
                    }}
                    placeholder="Repite la nueva contraseña"
                    style={styles.passInputField}
                    required
                  />
                </div>
              </div>

              {msgPassword && (
                <p style={{
                  fontSize: 13,
                  fontWeight: '600',
                  margin: '8px 0',
                  color: msgPassword.tipo === 'exito' ? '#059669' : '#DC2626',
                }}>
                  {msgPassword.texto}
                </p>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button
                  type="submit"
                  disabled={guardandoPassword}
                  style={styles.btnGuardarProducto}
                >
                  {guardandoPassword ? 'Guardando...' : 'Actualizar contraseña'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModalPasswordAbierto(false)
                    setFormPassword({ actual: '', nueva: '', confirmar: '' })
                    setMsgPassword(null)
                  }}
                  style={styles.btnSecundario}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================
          MODAL: DETALLES DEL PEDIDO E ÍTEMS COMPRADOS
      ================================================================ */}
      {pedidoDetalleModal && (
        <div style={styles.modalBackdrop} onClick={() => setPedidoDetalleModal(null)}>
          <div style={{ ...styles.modalCard, maxWidth: 540 }} className="modal-card-responsive" onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHead}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F766E' }}>
                  <ShoppingBag size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#0F172A' }}>
                    Detalle del Pedido
                  </h3>
                  <span style={{ fontSize: 11, color: '#64748B' }}>
                    ID: {pedidoDetalleModal.id}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPedidoDetalleModal(null)}
                style={styles.modalCloseIcon}
              >
                <X size={18} color="#64748B" />
              </button>
            </div>

            {/* Info del Cliente */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 14, padding: '12px 16px', margin: '14px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block', textTransform: 'uppercase' }}>Cliente</span>
                <strong style={{ fontSize: 15, color: '#0F172A' }}>{pedidoDetalleModal.nombre_cliente}</strong>
                {pedidoDetalleModal.telefono_cliente && (
                  <span style={{ display: 'block', fontSize: 12, color: '#475569', marginTop: 2 }}>
                    Notas/Tel: {pedidoDetalleModal.telefono_cliente}
                  </span>
                )}
                <span style={{ display: 'block', fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                  {formatearFechaHora(pedidoDetalleModal.created_at)}
                </span>
              </div>

              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block', textTransform: 'uppercase', marginBottom: 4 }}>Estado</span>
                <select
                  value={pedidoDetalleModal.estado}
                  disabled={actualizandoEstadoId === pedidoDetalleModal.id}
                  onChange={(e) => handleCambiarEstadoPedido(pedidoDetalleModal.id, e.target.value)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 20,
                    fontWeight: '700',
                    fontSize: 12,
                    cursor: 'pointer',
                    outline: 'none',
                    ...getEstadoStyle(pedidoDetalleModal.estado),
                  }}
                >
                  <option value="pendiente">⏳ Pendiente</option>
                  <option value="pagado">✓ Pagado</option>
                  <option value="cancelado">✕ Cancelado</option>
                </select>
              </div>
            </div>

            {/* Lista de Items */}
            <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
              Productos incluidos ({pedidoDetalleModal.pedido_items?.length || 0}):
            </h4>

            <div style={{ maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {(!pedidoDetalleModal.pedido_items || pedidoDetalleModal.pedido_items.length === 0) ? (
                <p style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center', padding: 16 }}>Sin productos registrados.</p>
              ) : (
                pedidoDetalleModal.pedido_items.map((it) => (
                  <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12 }}>
                    {it.productos?.imagen_url ? (
                      <img
                        src={it.productos.imagen_url}
                        alt={it.productos.nombre}
                        style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ width: 40, height: 40, borderRadius: 8, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                        📷
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ fontSize: 13, color: '#0F172A', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {it.productos?.nombre || `Producto #${it.producto_id}`}
                      </strong>
                      <span style={{ fontSize: 12, color: '#64748B' }}>
                        {it.cantidad} {it.cantidad === 1 ? 'unidad' : 'unidades'} × ${Number(it.precio_unitario).toFixed(2)}
                      </span>
                    </div>
                    <strong style={{ fontSize: 14, color: '#0F766E' }}>
                      ${(Number(it.cantidad) * Number(it.precio_unitario)).toFixed(2)}
                    </strong>
                  </div>
                ))
              )}
            </div>

            {/* Total */}
            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: '#64748B' }}>Total del Pedido:</span>
              <span style={{ fontSize: 24, fontWeight: 800, color: '#0F766E' }}>
                ${Number(pedidoDetalleModal.total || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          MODAL: CONFIGURACIÓN DE LA TIENDA (Nombre, WhatsApp, Logo)
      ================================================================ */}
      {modalConfiguracionAbierto && (
        <div style={styles.modalBackdrop} onClick={() => setModalConfiguracionAbierto(false)}>
          <div
            style={{ ...styles.modalCard, maxWidth: 480 }}
            className="modal-card-responsive"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del modal */}
            <div style={styles.modalHead}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: '#ECFDF5', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F766E' }}>
                  <Settings size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: '800', color: '#0F172A' }}>
                    Configuración de la Tienda
                  </h3>
                  <span style={{ fontSize: 12, color: '#64748B' }}>
                    Personaliza la identidad y contacto de tu negocio
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalConfiguracionAbierto(false)}
                style={styles.modalCloseIcon}
                title="Cerrar"
              >
                <X size={18} color="#64748B" />
              </button>
            </div>

            <form onSubmit={handleGuardarConfiguracion} style={{ marginTop: 16 }}>
              {/* 1. Logo de la tienda */}
              <div style={{ marginBottom: 18 }}>
                <label style={styles.formLabel}>Logo del negocio</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 6 }}>
                  {/* Vista previa del logo */}
                  <div style={{
                    width: 68,
                    height: 68,
                    borderRadius: 16,
                    background: '#F8FAFC',
                    border: '1.5px dashed #CBD5E1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    flexShrink: 0,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}>
                    {previewLogo ? (
                      <img
                        src={previewLogo}
                        alt="Logo previa"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={() => setPreviewLogo('')}
                      />
                    ) : (
                      <Store size={30} color="#94A3B8" />
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => logoFileInputRef.current?.click()}
                        style={styles.btnSecundarioSm}
                      >
                        <Camera size={14} color="#0F766E" />
                        <span>{archivoLogo ? 'Cambiar archivo' : 'Subir imagen'}</span>
                      </button>

                      {(previewLogo || archivoLogo) && (
                        <button
                          type="button"
                          onClick={handleQuitarLogo}
                          style={{ ...styles.btnSecundarioSm, color: '#E11D48', borderColor: '#FECACA' }}
                        >
                          <Trash2 size={13} color="#E11D48" />
                          <span>Quitar</span>
                        </button>
                      )}
                    </div>

                    <span style={{ fontSize: 11, color: '#64748B' }}>
                      {archivoLogo ? archivoLogo.name : 'PNG, JPG o WEBP recomendados (cuadrado).'}
                    </span>
                  </div>
                </div>

                {/* Input alternativo para URL directa */}
                <input
                  type="url"
                  placeholder="O ingresa la URL de tu logo (https://...)"
                  value={formConfiguracion.logo_url}
                  onChange={(e) => {
                    const val = e.target.value
                    setFormConfiguracion((prev) => ({ ...prev, logo_url: val }))
                    if (!archivoLogo) setPreviewLogo(val)
                  }}
                  style={{ ...styles.formInput, marginTop: 10, fontSize: 12 }}
                />
              </div>

              {/* 2. Nombre del negocio */}
              <div style={{ marginBottom: 14 }}>
                <label style={styles.formLabel}>Nombre del negocio *</label>
                <input
                  type="text"
                  value={formConfiguracion.nombre_tienda}
                  onChange={(e) => setFormConfiguracion((prev) => ({ ...prev, nombre_tienda: e.target.value }))}
                  placeholder="Ej: Prueba001 o Mi Tienda"
                  style={styles.formInput}
                  required
                />
              </div>

              {/* 3. Número de WhatsApp para pedidos */}
              <div style={{ marginBottom: 16 }}>
                <label style={styles.formLabel}>WhatsApp para pedidos *</label>
                <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <span style={{
                    padding: '10px 12px',
                    background: '#F1F5F9',
                    border: '1px solid #CBD5E1',
                    borderRight: 'none',
                    borderTopLeftRadius: 10,
                    borderBottomLeftRadius: 10,
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#475569',
                    whiteSpace: 'nowrap',
                  }}>
                    🇪🇨 +593
                  </span>
                  <input
                    type="tel"
                    value={formConfiguracion.telefono_whatsapp}
                    onChange={(e) => setFormConfiguracion((prev) => ({ ...prev, telefono_whatsapp: e.target.value }))}
                    placeholder="0991234567"
                    style={{
                      ...styles.formInput,
                      borderTopLeftRadius: 0,
                      borderBottomLeftRadius: 0,
                      flex: 1,
                    }}
                    required
                  />
                </div>
                <span style={{ fontSize: 11, color: '#64748B', marginTop: 4, display: 'block' }}>
                  A este número se enviarán los pedidos completados desde el carrito.
                </span>
              </div>

              {/* Mensajes de feedback */}
              {msgConfiguracion && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: msgConfiguracion.tipo === 'exito' ? '#ECFDF5' : '#FEF2F2',
                  color: msgConfiguracion.tipo === 'exito' ? '#065F46' : '#991B1B',
                  border: `1px solid ${msgConfiguracion.tipo === 'exito' ? '#A7F3D0' : '#FECACA'}`,
                }}>
                  {msgConfiguracion.tipo === 'exito' ? (
                    <CheckCircle2 size={16} color="#059669" />
                  ) : (
                    <AlertCircle size={16} color="#DC2626" />
                  )}
                  <span>{msgConfiguracion.texto}</span>
                </div>
              )}

              {/* Botones de acción */}
              <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                <button
                  type="submit"
                  disabled={guardandoConfiguracion}
                  style={styles.btnGuardarProducto}
                >
                  {guardandoConfiguracion ? 'Guardando cambios...' : '✓ Guardar Cambios'}
                </button>
                <button
                  type="button"
                  onClick={() => setModalConfiguracionAbierto(false)}
                  style={styles.btnSecundario}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ================================================================
// ESTILOS VISUALES PULIDOS (PALETA ESMERALDA Y BLANCO HUMO)
// ================================================================
const styles = {
  fondoApp: {
    minHeight: '100vh',
    background: '#F8FAFC',
    backgroundImage: 'radial-gradient(circle at 100% 0%, rgba(209, 250, 229, 0.4) 0%, rgba(248, 250, 252, 1) 45%)',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    color: '#0F172A',
    paddingBottom: 40,
  },

  // 1. NAVBAR
  navbar: {
    background: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid #E2E8F0',
    position: 'sticky',
    top: 0,
    zIndex: 40,
  },
  navContainer: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '12px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  storeBranding: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    minWidth: 0,
  },
  storeIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
    border: '1.5px solid #A7F3D0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 2px 6px rgba(15, 118, 110, 0.1)',
    overflow: 'hidden',
  },
  storeLogoImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: 12,
  },
  storeNameText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: '-0.5px',
    lineHeight: 1.15,
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    flexShrink: 0,
  },
  bellButton: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: 10,
    cursor: 'pointer',
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
  },
  bellDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: '#F43F5E',
  },
  navDivider: {
    width: 1,
    height: 24,
    background: '#E2E8F0',
  },
  profileBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: 12,
    transition: 'background 0.2s',
  },
  navAvatarImg: {
    width: 38,
    height: 38,
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid #E2E8F0',
  },
  navAvatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #0F766E 0%, #059669 100%)',
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navUserName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  navUserRole: {
    fontSize: 12,
    color: '#64748B',
  },
  dropdownCard: {
    position: 'absolute',
    top: '115%',
    right: 0,
    background: '#FFFFFF',
    borderRadius: 14,
    padding: 6,
    width: 210,
    boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    border: '1px solid #E2E8F0',
    zIndex: 50,
  },
  dropdownHeader: {
    padding: '8px 12px',
    borderBottom: '1px solid #F1F5F9',
    marginBottom: 4,
  },
  dropdownItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    padding: '9px 12px',
    background: 'transparent',
    border: 'none',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: '500',
    color: '#334155',
    cursor: 'pointer',
    textAlign: 'left',
  },

  // 2. MAIN CONTAINER
  mainContainer: {
    maxWidth: 1100,
    margin: '20px auto 0',
    padding: '0 20px',
  },
  gridIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: '#ECFDF5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #A7F3D0',
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    margin: 0,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#64748B',
    margin: '2px 0 0',
  },

  // 3. TARJETA DEL ADMINISTRADOR
  adminCard: {
    background: '#FFFFFF',
    borderRadius: 24,
    border: '1px solid #E2E8F0',
    padding: '24px 28px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 20,
    boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.03)',
  },
  adminCardLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 20,
  },
  largeAvatarContainer: {
    position: 'relative',
    width: 76,
    height: 76,
    flexShrink: 0,
  },
  largeAvatarImg: {
    width: 76,
    height: 76,
    borderRadius: '50%',
    objectFit: 'cover',
    border: '3px solid #FFFFFF',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
  },
  largeAvatarPlaceholder: {
    width: 76,
    height: 76,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #0F766E 0%, #059669 100%)',
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '3px solid #FFFFFF',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: '50%',
    background: '#10B981',
    border: '2.5px solid #FFFFFF',
  },
  adminName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    margin: 0,
  },
  badgeAdmin: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '3px 10px',
    background: '#ECFDF5',
    color: '#047857',
    border: '1px solid #A7F3D0',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: '700',
  },
  adminLink: {
    fontSize: 13,
    color: '#64748B',
    textDecoration: 'none',
    wordBreak: 'break-all',
  },
  adminCardRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  btnCompartir: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '11px 20px',
    background: '#0F766E', // verde esmeralda
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 14,
    fontSize: 14,
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(15, 118, 110, 0.25)',
  },
  btnVerCatalogo: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 18px',
    background: '#FFFFFF',
    color: '#0F172A',
    border: '1.5px solid #CBD5E1',
    borderRadius: 14,
    fontSize: 14,
    fontWeight: '700',
    textDecoration: 'none',
  },

  // 4. TARJETAS DE SECCIÓN (Categorías y Productos)
  cardSection: {
    background: '#FFFFFF',
    borderRadius: 24,
    border: '1px solid #E2E8F0',
    padding: '24px 28px',
    marginBottom: 20,
    boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.03)',
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionHeaderBetween: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    margin: 0,
  },

  // Categorías
  categoriaForm: {
    display: 'flex',
    gap: 10,
    marginBottom: 14,
  },
  inputCategoria: {
    flex: 1,
    padding: '11px 16px',
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: 12,
    fontSize: 14,
    outline: 'none',
    color: '#0F172A',
  },
  btnAgregarCat: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '11px 22px',
    background: '#0F766E',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 12,
    fontSize: 14,
    fontWeight: '700',
    cursor: 'pointer',
  },
  listaCategorias: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  itemCategoria: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 14px',
    background: '#F8FAFC',
    border: '1px solid #F1F5F9',
    borderRadius: 12,
  },
  nombreCategoria: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  btnEditarPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '5px 12px',
    background: '#FFFFFF',
    color: '#0F172A',
    border: '1px solid #CBD5E1',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: '600',
    cursor: 'pointer',
  },
  btnGuardarPill: {
    padding: '5px 14px',
    background: '#0F766E',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: '700',
    cursor: 'pointer',
  },
  btnCancelarPill: {
    padding: '5px 12px',
    background: '#FFFFFF',
    color: '#64748B',
    border: '1px solid #CBD5E1',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: '600',
    cursor: 'pointer',
  },
  inputCategoriaEdicion: {
    flex: 1,
    padding: '7px 12px',
    background: '#FFFFFF',
    border: '1.5px solid #0F766E',
    borderRadius: 8,
    fontSize: 14,
    color: '#0F172A',
    outline: 'none',
  },
  btnEliminarPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '5px 12px',
    background: '#FFF1F2',
    color: '#E11D48',
    border: '1px solid #FFE4E6',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: '700',
    cursor: 'pointer',
  },

  // Productos
  btnNuevoProducto: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '10px 18px',
    background: '#0F766E',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 12,
    fontSize: 14,
    fontWeight: '700',
    cursor: 'pointer',
  },
  formProductoBox: {
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 14,
  },
  fieldCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  formInput: {
    padding: '9px 12px',
    background: '#FFFFFF',
    border: '1px solid #CBD5E1',
    borderRadius: 10,
    fontSize: 14,
    color: '#0F172A',
    outline: 'none',
  },
  previewContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    padding: 8,
    background: '#FFFFFF',
    border: '1px dashed #CBD5E1',
    borderRadius: 10,
  },
  previewImg: {
    width: 65,
    height: 65,
    borderRadius: 8,
    objectFit: 'cover',
  },
  btnQuitarFoto: {
    padding: '4px 10px',
    background: '#FFF1F2',
    color: '#E11D48',
    border: '1px solid #FFE4E6',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: '600',
    cursor: 'pointer',
    alignSelf: 'flex-start',
  },
  btnGuardarProducto: {
    padding: '10px 20px',
    background: '#0F766E',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: '700',
    cursor: 'pointer',
  },
  btnSecundario: {
    padding: '10px 18px',
    background: '#FFFFFF',
    color: '#334155',
    border: '1px solid #CBD5E1',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: '600',
    cursor: 'pointer',
  },
  btnSecundarioSm: {
    padding: '5px 12px',
    background: '#FFFFFF',
    color: '#64748B',
    border: '1px solid #CBD5E1',
    borderRadius: 8,
    fontSize: 12,
    cursor: 'pointer',
  },

  // TABLA DE PRODUCTOS
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  th: {
    padding: '12px 14px',
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    borderBottom: '1px solid #E2E8F0',
    whiteSpace: 'nowrap',
    position: 'sticky',
    top: 0,
    background: '#FFFFFF',
    zIndex: 10,
    boxShadow: '0 1px 0 #E2E8F0',
  },
  tr: {
    borderBottom: '1px solid #F1F5F9',
  },
  td: {
    padding: '12px 14px',
    verticalAlign: 'middle',
  },
  productThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    objectFit: 'cover',
    display: 'block',
  },
  productThumbPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 10,
    background: '#F1F5F9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    color: '#94A3B8',
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  productDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  categoryBadge: {
    fontSize: 13,
    color: '#475569',
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },

  // Stock Interactivo
  stockControlWrapper: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
  },
  stockBtnMinus: {
    width: 26,
    height: 26,
    borderRadius: 8,
    border: '1px solid #CBD5E1',
    background: '#FFFFFF',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  stockBtnPlus: {
    width: 26,
    height: 26,
    borderRadius: 8,
    border: '1px solid #CBD5E1',
    background: '#FFFFFF',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  stockPillOk: {
    padding: '4px 10px',
    background: '#ECFDF5',
    color: '#047857',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: '700',
    minWidth: 42,
    textAlign: 'center',
  },
  stockPillAgotado: {
    padding: '4px 10px',
    background: '#FEF2F2',
    color: '#DC2626',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: '700',
    minWidth: 42,
    textAlign: 'center',
  },

  // Estados
  estadoActivo: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
  estadoOculto: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },

  // Botones de Acción
  actionBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    padding: '6px 14px',
    background: '#F0FDFA',
    color: '#0F766E',
    border: '1px solid #CCFBF1',
    borderRadius: 12,
    fontSize: 13,
    fontWeight: '600',
    cursor: 'pointer',
  },
  actionBtnWhite: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '6px 12px',
    background: '#FFFFFF',
    color: '#0F172A',
    border: '1px solid #CBD5E1',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: '600',
    cursor: 'pointer',
  },
  actionBtnDanger: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '6px 12px',
    background: '#FFF1F2',
    color: '#E11D48',
    border: '1px solid #FFE4E6',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: '700',
    cursor: 'pointer',
  },

  hintTxt: {
    fontSize: 13,
    color: '#64748B',
    margin: '8px 0',
  },
  errorTxt: {
    fontSize: 13,
    color: '#DC2626',
    margin: '8px 0',
  },

  // MODAL
  modalBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(15, 23, 42, 0.55)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    padding: 16,
    boxSizing: 'border-box',
  },
  modalCard: {
    background: '#FFFFFF',
    borderRadius: 20,
    padding: '24px 24px',
    maxWidth: 440,
    width: '100%',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  modalHead: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalCloseIcon: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 4,
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
  },
  passInputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  },
  passInputField: {
    width: '100%',
    padding: '9px 38px 9px 12px',
    background: '#FFFFFF',
    border: '1px solid #CBD5E1',
    borderRadius: 10,
    fontSize: 14,
    color: '#0F172A',
    outline: 'none',
    boxSizing: 'border-box',
  },
  passToggleBtn: {
    position: 'absolute',
    right: 10,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareOption: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 16px',
    borderRadius: 12,
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: '700',
    cursor: 'pointer',
    width: '100%',
    boxSizing: 'border-box',
    border: 'none',
  },

  // --- Tabs de Navegación Admin ---
  tabsContainer: {
    display: 'flex',
    gap: 8,
    marginBottom: 20,
    background: '#FFFFFF',
    padding: '8px',
    borderRadius: 16,
    border: '1px solid #E2E8F0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
  },
  tabNavBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 18px',
    background: 'transparent',
    color: '#64748B',
    border: 'none',
    borderRadius: 12,
    fontSize: 13,
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap',
    fontFamily: 'inherit',
  },
  tabNavBtnActivo: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 18px',
    background: '#0F766E',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 12,
    fontSize: 13,
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(15, 118, 110, 0.25)',
    whiteSpace: 'nowrap',
    fontFamily: 'inherit',
  },
  badgeTabPendiente: {
    background: '#EF4444',
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    padding: '2px 7px',
    borderRadius: 999,
  },
  badgeTabNeutral: {
    background: '#E2E8F0',
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '700',
    padding: '2px 7px',
    borderRadius: 999,
  },

  // --- Filtros de Pedidos ---
  filtroChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 14px',
    background: '#FFFFFF',
    color: '#475569',
    border: '1px solid #CBD5E1',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  filtroChipActivo: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 14px',
    background: '#0F766E',
    color: '#FFFFFF',
    border: '1px solid #0F766E',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(15,118,110,0.2)',
    fontFamily: 'inherit',
  },
  inputBusquedaSimple: {
    width: '100%',
    padding: '8px 12px',
    background: '#FFFFFF',
    border: '1px solid #CBD5E1',
    borderRadius: 10,
    fontSize: 13,
    color: '#0F172A',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },

  // --- Dashboard Finanzas ---
  finanzasGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 16,
  },
  kpiCard: {
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: 18,
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
  },
  kpiLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  kpiMonto: {
    margin: '4px 0 6px',
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: '-0.5px',
  },
  kpiSub: {
    fontSize: 12,
    color: '#94A3B8',
  },
  kpiMiniCard: {
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: 14,
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  kpiMiniLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  kpiMiniVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },

  // --- Dropdown Notificaciones ---
  notifDropdown: {
    position: 'absolute',
    top: 'calc(100% + 10px)',
    right: 0,
    width: 320,
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: 18,
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.06)',
    zIndex: 60,
    overflow: 'hidden',
  },
  notifHeader: {
    padding: '14px 16px',
    background: '#F8FAFC',
    borderBottom: '1px solid #F1F5F9',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notifBadge: {
    background: '#FEF3C7',
    color: '#92400E',
    border: '1px solid #FDE68A',
    fontSize: 11,
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: 999,
  },
  notifVacio: {
    padding: '28px 20px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifVacioIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    background: '#F1F5F9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  notifItem: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 16px',
    background: 'none',
    border: 'none',
    borderBottom: '1px solid #F1F5F9',
    cursor: 'pointer',
    transition: 'background 0.15s ease',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    textDecoration: 'none',
  },
  notifItemIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    background: '#FEF3C7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  notifFooter: {
    padding: '10px 16px',
    background: '#F8FAFC',
    borderTop: '1px solid #F1F5F9',
    textAlign: 'center',
  },
  notifVerTodosBtn: {
    background: 'none',
    border: 'none',
    color: '#0F766E',
    fontSize: 12,
    fontWeight: '700',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: 6,
    fontFamily: 'inherit',
  },
}
