// ============================================================
// pages/CatalogoPublicoPage.jsx
// Vista pública del catálogo: Carrito Multiproducto + Sistema de Reseñas
// ============================================================
import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { getTiendaPorSlug } from '../services/tiendaService'
import { getCategorias } from '../services/categoriaService'
import { getProductosDisponibles } from '../services/productoService'
import {
  getValoracionesPorProducto,
  getResumenValoraciones,
  crearValoracion,
} from '../services/valoracionService'
import { crearPedidoConItems } from '../services/pedidoService'
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Star,
  X,
  MessageCircle,
  Store,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react'

// ---- Formateador de fecha ----
function formatearFecha(isoDate) {
  if (!isoDate) return ''
  try {
    const d = new Date(isoDate)
    return d.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

// ============================================================
// COMPONENTE: Modal de Reseñas y Calificaciones
// ============================================================
function ModalResenas({ producto, resumen = { total: 0, promedio: 0 }, onClose, onNuevaValoracion }) {
  const [valoraciones, setValoraciones] = useState([])
  const [cargando, setCargando] = useState(true)

  // Estado del formulario de nueva reseña
  const [puntuacion, setPuntuacion] = useState(5)
  const [hoverPuntuacion, setHoverPuntuacion] = useState(0)
  const [nombreCliente, setNombreCliente] = useState('')
  const [comentario, setComentario] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [mensajeExito, setMensajeExito] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState(null)

  useEffect(() => {
    let activo = true
    const cargar = async () => {
      setCargando(true)
      const { data } = await getValoracionesPorProducto(producto.id)
      if (activo) {
        setValoraciones(data || [])
        setCargando(false)
      }
    }
    cargar()
    return () => { activo = false }
  }, [producto.id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setEnviando(true)
    setErrorEnvio(null)

    const payload = {
      producto_id: producto.id,
      nombre_cliente: nombreCliente.trim() || 'Cliente verificado',
      calificacion: puntuacion,
      comentario: comentario.trim() || null,
    }

    const { data, error } = await crearValoracion(payload)
    setEnviando(false)

    if (error) {
      setErrorEnvio('No se pudo guardar tu reseña. Por favor intenta de nuevo.')
      return
    }

    // Actualizar lista local de valoraciones
    const nueva = data || {
      ...payload,
      id: Date.now(),
      created_at: new Date().toISOString(),
    }
    const listaActualizada = [nueva, ...valoraciones]
    setValoraciones(listaActualizada)
    setMensajeExito(true)
    setComentario('')
    setNombreCliente('')

    // Notificar al componente padre para recalcular el promedio
    if (onNuevaValoracion) {
      onNuevaValoracion(producto.id, listaActualizada)
    }

    setTimeout(() => {
      setMensajeExito(false)
    }, 4000)
  }

  const estrellasActivas = hoverPuntuacion || puntuacion

  return (
    <div className="public-modal-backdrop" onClick={onClose}>
      <div className="public-modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Header del Modal */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 24px', borderBottom: '1px solid #F1F5F9',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {producto.imagen_url ? (
              <img
                src={producto.imagen_url}
                alt={producto.nombre}
                style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover' }}
              />
            ) : (
              <div style={{
                width: 44, height: 44, borderRadius: 10, background: '#F1F5F9',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8',
              }}>
                📷
              </div>
            )}
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0F172A' }}>
                {producto.nombre}
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: '#64748B' }}>
                {resumen.total > 0
                  ? `⭐ ${resumen.promedio} de 5 (${resumen.total} valoraciones)`
                  : '⭐ Sin valoraciones previas'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#F1F5F9', border: 'none', borderRadius: '50%',
              width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#64748B',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Contenido con scroll */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Formulario para dejar reseña */}
          <div style={{
            background: '#F8FAFC', border: '1px solid #E2E8F0',
            borderRadius: 16, padding: '18px 20px',
          }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
              Dejar una opinión sobre este producto
            </h4>

            {mensajeExito && (
              <div style={{
                background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46',
                borderRadius: 12, padding: '10px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
                marginBottom: 14,
              }}>
                <CheckCircle2 size={16} />
                <span>¡Muchas gracias! Tu opinión ha sido publicada exitosamente.</span>
              </div>
            )}

            {errorEnvio && (
              <div style={{
                background: '#FEF2F2', border: '1px solid #FEE2E2', color: '#B91C1C',
                borderRadius: 12, padding: '10px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
                marginBottom: 14,
              }}>
                <AlertCircle size={16} />
                <span>{errorEnvio}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Selector interactivo de estrellas */}
              <div style={{ marginBottom: 14 }}>
                <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                  Tu calificación:
                </span>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      className="rating-star-btn"
                      onMouseEnter={() => setHoverPuntuacion(val)}
                      onMouseLeave={() => setHoverPuntuacion(0)}
                      onClick={() => setPuntuacion(val)}
                      title={`Calificar con ${val} estrellas`}
                    >
                      <Star
                        size={26}
                        fill={val <= estrellasActivas ? '#F59E0B' : 'transparent'}
                        color={val <= estrellasActivas ? '#F59E0B' : '#CBD5E1'}
                      />
                    </button>
                  ))}
                  <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 700, color: '#D97706', alignSelf: 'center' }}>
                    {estrellasActivas}/5
                  </span>
                </div>
              </div>

              {/* Nombre (opcional) */}
              <div style={{ marginBottom: 12 }}>
                <input
                  type="text"
                  placeholder="Tu nombre (opcional)"
                  value={nombreCliente}
                  onChange={(e) => setNombreCliente(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1',
                    borderRadius: 10, fontSize: 13, outline: 'none', background: '#FFFFFF',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Comentario */}
              <div style={{ marginBottom: 14 }}>
                <textarea
                  rows={3}
                  placeholder="¿Qué te pareció este producto? Calidad, tamaño, sabor..."
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  required
                  style={{
                    width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1',
                    borderRadius: 10, fontSize: 13, outline: 'none', background: '#FFFFFF',
                    resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={enviando || !comentario.trim()}
                style={{
                  background: enviando || !comentario.trim() ? '#94A3B8' : '#0F766E',
                  color: '#FFFFFF', border: 'none', borderRadius: 10,
                  padding: '10px 18px', fontSize: 13, fontWeight: 600,
                  cursor: enviando || !comentario.trim() ? 'not-allowed' : 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  transition: 'background 0.15s',
                }}
              >
                {enviando ? 'Publicando...' : 'Publicar reseña'}
              </button>
            </form>
          </div>

          {/* Lista de valoraciones */}
          <div>
            <h4 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: '#0F172A' }}>
              Opiniones de clientes ({valoraciones.length})
            </h4>

            {cargando ? (
              <p style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
                Cargando opiniones...
              </p>
            ) : valoraciones.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '24px 16px', background: '#F8FAFC',
                borderRadius: 16, border: '1px dashed #CBD5E1',
              }}>
                <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: '#475569' }}>
                  Aún no hay opiniones
                </p>
                <p style={{ margin: 0, fontSize: 12, color: '#94A3B8' }}>
                  ¡Sé el primero en calificar este producto arriba!
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {valoraciones.map((val) => (
                  <div
                    key={val.id}
                    style={{
                      border: '1px solid #F1F5F9', borderRadius: 14, padding: '14px 16px',
                      background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%', background: '#E2E8F0',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 700, color: '#475569',
                        }}>
                          {(val.nombre_cliente || 'C').charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>
                          {val.nombre_cliente || 'Anónimo'}
                        </span>
                      </div>
                      <span style={{ fontSize: 11, color: '#94A3B8' }}>
                        {formatearFecha(val.created_at)}
                      </span>
                    </div>

                    {/* Estrellas */}
                    <div style={{ display: 'flex', gap: 2, marginBottom: 6 }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={14}
                          fill={s <= val.calificacion ? '#F59E0B' : 'transparent'}
                          color={s <= val.calificacion ? '#F59E0B' : '#E2E8F0'}
                        />
                      ))}
                    </div>

                    {val.comentario && (
                      <p style={{ margin: 0, fontSize: 13, color: '#334155', lineHeight: 1.45 }}>
                        {val.comentario}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// COMPONENTE: Modal/Drawer de Checkout del Carrito
// ============================================================
function ModalCarrito({ tienda, carrito, cambiarCantidad, eliminarDelCarrito, vaciarCarrito, onClose, onPedidoExitoso }) {
  const [nombreCliente, setNombreCliente] = useState('')
  const [notasEntrega, setNotasEntrega] = useState('')
  const [errorNombre, setErrorNombre] = useState(null)
  const [guardandoPedido, setGuardandoPedido] = useState(false)

  const subtotal = useMemo(() => {
    return carrito.reduce((acc, it) => acc + it.precio * it.cantidad, 0)
  }, [carrito])

  const totalItems = useMemo(() => {
    return carrito.reduce((acc, it) => acc + it.cantidad, 0)
  }, [carrito])

  const handleEnviarWhatsapp = async () => {
    const nombreLimpio = nombreCliente.trim()
    if (!nombreLimpio) {
      setErrorNombre('El nombre es obligatorio para enviar tu pedido.')
      return
    }

    if (!tienda?.telefono_whatsapp || carrito.length === 0) return

    setErrorNombre(null)
    setGuardandoPedido(true)

    // 1. Guardar en Supabase (tabla `pedidos` y bulk en `pedido_items`, disparando trigger de stock)
    try {
      const { error: errPedido } = await crearPedidoConItems({
        tienda_id: tienda.id,
        nombre_cliente: nombreLimpio,
        telefono_cliente: notasEntrega.trim() || null,
        total: subtotal,
        items: carrito,
      })

      if (errPedido) {
        console.error('Error guardando pedido:', errPedido)
      }
    } catch (err) {
      console.warn('Excepción al registrar pedido en Supabase:', err)
    } finally {
      setGuardandoPedido(false)
    }

    // 2. Formatear mensaje para WhatsApp
    const telefonoLimpio = tienda.telefono_whatsapp.replace(/\D/g, '')

    let mensaje = `🛒 *Nuevo Pedido - ${tienda.nombre_tienda}*\n`
    mensaje += `━━━━━━━━━━━━━━━━━━━━\n`
    mensaje += `👤 *Cliente:* ${nombreLimpio}\n`
    if (notasEntrega.trim()) {
      mensaje += `📍 *Dirección / Notas:* ${notasEntrega.trim()}\n`
    }
    mensaje += `\n📋 *Detalle del Pedido:*\n`

    carrito.forEach((it) => {
      const sub = (it.precio * it.cantidad).toFixed(2)
      mensaje += `• *${it.cantidad}x* ${it.nombre} ($${it.precio.toFixed(2)} c/u) = *$${sub}*\n`
    })

    mensaje += `━━━━━━━━━━━━━━━━━━━━\n`
    mensaje += `💰 *TOTAL A PAGAR: $${subtotal.toFixed(2)}*\n\n`
    mensaje += `¿Me confirman la disponibilidad para coordinar la entrega? ¡Muchas gracias!`

    const url = `https://wa.me/${telefonoLimpio}?text=${encodeURIComponent(mensaje)}`

    // 3. Limpiar carrito, cerrar modal y refrescar stock
    vaciarCarrito()
    onClose()
    if (onPedidoExitoso) {
      onPedidoExitoso()
    }

    // 4. Abrir WhatsApp
    window.open(url, '_blank')
  }

  return (
    <div className="public-modal-backdrop" onClick={onClose}>
      <div className="public-modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 24px', borderBottom: '1px solid #F1F5F9',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12, background: '#ECFDF5',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F766E',
            }}>
              <ShoppingCart size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#0F172A' }}>
                Tu Pedido
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>
                {totalItems} {totalItems === 1 ? 'producto seleccionado' : 'productos seleccionados'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#F1F5F9', border: 'none', borderRadius: '50%',
              width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#64748B',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Cuerpo del carrito */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {carrito.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 16px' }}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%', background: '#F1F5F9',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 14px', color: '#94A3B8',
              }}>
                <ShoppingCart size={28} />
              </div>
              <h4 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: '#0F172A' }}>
                Tu carrito está vacío
              </h4>
              <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748B' }}>
                Agrega productos desde el catálogo para armar tu pedido.
              </p>
              <button
                onClick={onClose}
                style={{
                  background: '#0F766E', color: '#FFFFFF', border: 'none',
                  borderRadius: 12, padding: '10px 20px', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Explorar catálogo
              </button>
            </div>
          ) : (
            <>
              {/* Lista de productos en el carrito */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {carrito.map((item) => {
                  const stockMax = item.stock !== undefined && item.stock !== null ? Number(item.stock) : 999
                  const noPuedeMas = item.cantidad >= stockMax

                  return (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px', border: '1px solid #E2E8F0', borderRadius: 14,
                        background: '#FFFFFF',
                      }}
                    >
                      {item.imagen_url ? (
                        <img
                          src={item.imagen_url}
                          alt={item.nombre}
                          style={{ width: 50, height: 50, borderRadius: 10, objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{
                          width: 50, height: 50, borderRadius: 10, background: '#F1F5F9',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8',
                        }}>
                          📷
                        </div>
                      )}

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{
                          margin: 0, fontSize: 14, fontWeight: 700, color: '#0F172A',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {item.nombre}
                        </h4>
                        <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B' }}>
                          ${item.precio.toFixed(2)} c/u
                        </p>
                      </div>

                      {/* Control de cantidad */}
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 3,
                      }}>
                        <button
                          type="button"
                          onClick={() => cambiarCantidad(item.id, -1)}
                          style={{
                            width: 26, height: 26, borderRadius: 8, border: 'none',
                            background: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#475569', boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                          }}
                        >
                          <Minus size={14} />
                        </button>
                        <span style={{ fontSize: 13, fontWeight: 700, minWidth: 20, textAlign: 'center', color: '#0F172A' }}>
                          {item.cantidad}
                        </span>
                        <button
                          type="button"
                          disabled={noPuedeMas}
                          onClick={() => cambiarCantidad(item.id, 1)}
                          style={{
                            width: 26, height: 26, borderRadius: 8, border: 'none',
                            background: noPuedeMas ? '#F1F5F9' : '#0F766E',
                            color: noPuedeMas ? '#94A3B8' : '#FFFFFF',
                            cursor: noPuedeMas ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      {/* Subtotal del ítem */}
                      <div style={{ textAlign: 'right', minWidth: 55 }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>
                          ${(item.precio * item.cantidad).toFixed(2)}
                        </span>
                      </div>

                      {/* Eliminar */}
                      <button
                        type="button"
                        onClick={() => eliminarDelCarrito(item.id)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: '#EF4444', padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                        title="Eliminar producto"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )
                })}
              </div>

              {/* Botón vaciar carrito */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={vaciarCarrito}
                  style={{
                    background: 'none', border: 'none', color: '#94A3B8', fontSize: 12,
                    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4,
                  }}
                >
                  <Trash2 size={13} /> Vaciar carrito
                </button>
              </div>

              {/* Datos del cliente y entrega */}
              <div style={{
                background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 16, padding: '16px',
                display: 'flex', flexDirection: 'column', gap: 12,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h5 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#334155' }}>
                    Datos de entrega
                  </h5>
                  <span style={{ fontSize: 11, color: '#94A3B8' }}>* Campo obligatorio</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>
                    Tu nombre <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: María Pérez (Obligatorio)"
                    value={nombreCliente}
                    onChange={(e) => {
                      setNombreCliente(e.target.value)
                      if (errorNombre) setErrorNombre(null)
                    }}
                    style={{
                      width: '100%', padding: '10px 12px',
                      border: errorNombre ? '1.5px solid #EF4444' : '1px solid #CBD5E1',
                      borderRadius: 10, fontSize: 13, outline: 'none',
                      background: errorNombre ? '#FEF2F2' : '#FFFFFF',
                      boxSizing: 'border-box',
                    }}
                    required
                  />
                  {errorNombre && (
                    <span style={{ display: 'block', color: '#EF4444', fontSize: 12, marginTop: 4, fontWeight: 500 }}>
                      ⚠️ {errorNombre}
                    </span>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>
                    Dirección o notas de entrega <span style={{ color: '#94A3B8', fontWeight: 400 }}>(opcional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Aula 204 o entregar a las 11:00 am"
                    value={notasEntrega}
                    onChange={(e) => setNotasEntrega(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1',
                      borderRadius: 10, fontSize: 13, outline: 'none', background: '#FFFFFF',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Total y botón de envío */}
              <div style={{
                borderTop: '1px solid #E2E8F0', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 12,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#64748B' }}>Total a pagar:</span>
                  <span style={{ fontSize: 24, fontWeight: 800, color: '#0F766E' }}>
                    ${subtotal.toFixed(2)}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={guardandoPedido}
                  onClick={handleEnviarWhatsapp}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    background: guardandoPedido ? '#10B981' : '#25D366', color: '#FFFFFF', border: 'none', borderRadius: 14,
                    padding: '14px 20px', fontSize: 15, fontWeight: 700,
                    cursor: guardandoPedido ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(37, 211, 102, 0.35)',
                    transition: 'transform 0.1s, background 0.15s',
                  }}
                >
                  <MessageCircle size={20} />
                  {guardandoPedido ? 'Guardando pedido...' : 'Enviar pedido por WhatsApp'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// COMPONENTE PRINCIPAL: CatalogoPublicoPage
// ============================================================
export default function CatalogoPublicoPage() {
  const { slug } = useParams()

  const [tienda, setTienda] = useState(null)
  const [categorias, setCategorias] = useState([])
  const [productos, setProductos] = useState([])
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [logoError, setLogoError] = useState(false)

  // Resumen de valoraciones por producto: { [productoId]: { total, promedio } }
  const [resumenValoraciones, setResumenValoraciones] = useState({})
  // Modal de reseñas activo (producto actual o null)
  const [modalResenasProd, setModalResenasProd] = useState(null)

  // Carrito de compras multiproducto
  const [carrito, setCarrito] = useState(() => {
    try {
      const guardado = localStorage.getItem(`carrito_${slug}`)
      return guardado ? JSON.parse(guardado) : []
    } catch {
      return []
    }
  })
  const [modalCarritoAbierto, setModalCarritoAbierto] = useState(false)

  // Persistir carrito en localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`carrito_${slug}`, JSON.stringify(carrito))
    } catch (e) {
      console.warn('Error al persistir carrito:', e)
    }
  }, [carrito, slug])

  // Carga inicial de datos de la tienda
  useEffect(() => {
    const cargar = async () => {
      setCargando(true)
      setError(null)
      setLogoError(false)

      const { data: tiendaData, error: tiendaError } = await getTiendaPorSlug(slug)
      if (tiendaError || !tiendaData) {
        setError('no_encontrada')
        setCargando(false)
        return
      }
      setTienda(tiendaData)

      const [catsResult, prodsResult] = await Promise.all([
        getCategorias(tiendaData.id),
        getProductosDisponibles(tiendaData.id),
      ])

      if (catsResult.error || prodsResult.error) {
        setError('Error al cargar el catálogo. Inténtalo de nuevo.')
        setCargando(false)
        return
      }

      const listaProds = prodsResult.data || []
      setCategorias(catsResult.data || [])
      setProductos(listaProds)

      // Cargar resumen de reseñas para los productos disponibles
      if (listaProds.length > 0) {
        const prodIds = listaProds.map((p) => p.id)
        const { data: resumenMap } = await getResumenValoraciones(prodIds)
        if (resumenMap) {
          setResumenValoraciones(resumenMap)
        }
      }

      setCargando(false)
    }

    cargar()
  }, [slug])

  const recargarProductos = async () => {
    if (!tienda) return
    const { data: prodsData } = await getProductosDisponibles(tienda.id)
    if (prodsData) {
      setProductos(prodsData)
    }
  }

  // Filtrado por categoría
  const productosFiltrados = useMemo(() => {
    return categoriaSeleccionada
      ? productos.filter((p) => p.categoria_id === categoriaSeleccionada)
      : productos
  }, [categoriaSeleccionada, productos])

  // Métricas del carrito
  const totalItemsEnCarrito = useMemo(() => {
    return carrito.reduce((acc, it) => acc + it.cantidad, 0)
  }, [carrito])

  const totalDineroCarrito = useMemo(() => {
    return carrito.reduce((acc, it) => acc + it.precio * it.cantidad, 0)
  }, [carrito])

  // Operaciones del Carrito
  const agregarAlCarrito = (prod) => {
    const stockNum = prod.stock !== undefined && prod.stock !== null ? Number(prod.stock) : 999
    if (stockNum <= 0) return

    setCarrito((prev) => {
      const idx = prev.findIndex((it) => it.id === prod.id)
      if (idx >= 0) {
        const actual = prev[idx]
        if (actual.cantidad >= stockNum) return prev // No excede stock
        const copia = [...prev]
        copia[idx] = { ...actual, cantidad: actual.cantidad + 1 }
        return copia
      } else {
        return [
          ...prev,
          {
            id: prod.id,
            nombre: prod.nombre,
            precio: Number(prod.precio),
            cantidad: 1,
            stock: prod.stock,
            imagen_url: prod.imagen_url,
          },
        ]
      }
    })
  }

  const cambiarCantidad = (prodId, delta) => {
    setCarrito((prev) => {
      const item = prev.find((it) => it.id === prodId)
      if (!item) return prev

      const nuevaCantidad = item.cantidad + delta
      if (nuevaCantidad <= 0) {
        return prev.filter((it) => it.id !== prodId)
      }

      const stockMax = item.stock !== undefined && item.stock !== null ? Number(item.stock) : 999
      if (delta > 0 && item.cantidad >= stockMax) {
        return prev
      }

      return prev.map((it) => (it.id === prodId ? { ...it, cantidad: nuevaCantidad } : it))
    })
  }

  const eliminarDelCarrito = (prodId) => {
    setCarrito((prev) => prev.filter((it) => it.id !== prodId))
  }

  const vaciarCarrito = () => {
    setCarrito([])
  }

  // Callback cuando se publica una nueva valoración
  const handleNuevaValoracion = (productoId, listaValoraciones) => {
    if (!listaValoraciones || listaValoraciones.length === 0) return
    const suma = listaValoraciones.reduce((acc, v) => acc + Number(v.calificacion || 0), 0)
    const nuevoPromedio = Number((suma / listaValoraciones.length).toFixed(1))

    setResumenValoraciones((prev) => ({
      ...prev,
      [productoId]: {
        total: listaValoraciones.length,
        promedio: nuevoPromedio,
      },
    }))
  }

  // ---- Estados de carga y error ----
  if (cargando) {
    return (
      <div style={s.centrado}>
        <div style={{
          width: 44, height: 44, border: '3px solid #E2E8F0', borderTopColor: '#0F766E',
          borderRadius: '50%', animation: 'auth-spin 0.7s linear infinite', marginBottom: 16,
        }} />
        <style>{`@keyframes auth-spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: '#64748B', fontSize: 15, fontWeight: 500 }}>Cargando catálogo...</p>
      </div>
    )
  }

  if (error === 'no_encontrada') {
    return (
      <div style={s.centrado}>
        <div style={{
          width: 64, height: 64, borderRadius: 20, background: '#FEE2E2',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626',
          marginBottom: 16,
        }}>
          <Store size={32} />
        </div>
        <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 700, color: '#0F172A' }}>
          Catálogo no encontrado
        </h2>
        <p style={{ color: '#64748B', maxWidth: 380, textAlign: 'center', lineHeight: 1.5 }}>
          El enlace <code style={{ background: '#F1F5F9', padding: '2px 6px', borderRadius: 4, color: '#0F172A' }}>
            /tienda/{slug}
          </code> no existe o se encuentra inactivo temporalmente.
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={s.centrado}>
        <p style={{ color: '#DC2626', fontSize: 16, fontWeight: 600 }}>{error}</p>
      </div>
    )
  }

  // ---- Vista principal ----
  return (
    <div style={s.page}>
      {/* Cabecera / Hero de la tienda */}
      <div style={s.hero}>
        <div style={{
          width: 68, height: 68, borderRadius: 20,
          background: tienda?.logo_url && !logoError ? '#FFFFFF' : '#ECFDF5',
          border: tienda?.logo_url && !logoError ? '1px solid #E2E8F0' : '1.5px solid #A7F3D0',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px', overflow: 'hidden',
        }}>
          {tienda?.logo_url && !logoError ? (
            <img
              src={tienda.logo_url}
              alt={tienda.nombre_tienda || 'Logo de la tienda'}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={() => setLogoError(true)}
            />
          ) : (
            <Store size={32} color="#0F766E" strokeWidth={2.2} />
          )}
        </div>
        <h1 style={s.heroTitulo}>{tienda.nombre_tienda}</h1>
        <p style={s.heroSub}>Agrega productos a tu carrito y coordina tu pedido directo por WhatsApp</p>
      </div>

      {/* Filtros de Categorías */}
      {categorias.length > 0 && (
        <div className="chips-scroll-container" style={s.filtros}>
          <button
            onClick={() => setCategoriaSeleccionada(null)}
            style={categoriaSeleccionada === null ? s.filtroActivo : s.filtro}
          >
            Todos los productos
          </button>
          {categorias.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoriaSeleccionada(cat.id)}
              style={categoriaSeleccionada === cat.id ? s.filtroActivo : s.filtro}
            >
              {cat.nombre}
            </button>
          ))}
        </div>
      )}

      {/* Sin productos */}
      {productosFiltrados.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748B' }}>
          <p style={{ fontSize: 15, margin: 0 }}>No hay productos disponibles en esta categoría.</p>
        </div>
      )}

      {/* Grid adaptable de productos */}
      <div className="public-catalog-grid">
        {productosFiltrados.map((prod) => {
          const catNombre = categorias.find((c) => c.id === prod.categoria_id)?.nombre || ''
          const stockNum = prod.stock !== undefined && prod.stock !== null ? Number(prod.stock) : 1
          const estaAgotado = stockNum <= 0 || prod.disponible === false
          const itemCarrito = carrito.find((it) => it.id === prod.id)
          const enCarrito = Boolean(itemCarrito)
          const infoResenas = resumenValoraciones[prod.id] || { total: 0, promedio: 0 }

          return (
            <div
              key={prod.id}
              style={{
                ...s.card,
                opacity: estaAgotado ? 0.88 : 1,
              }}
            >
              {/* Imagen con badge */}
              <div style={s.cardImgContainer}>
                {prod.imagen_url ? (
                  <img
                    src={prod.imagen_url}
                    alt={prod.nombre}
                    style={s.cardImg}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                ) : (
                  <div style={s.imgPlaceholder}>
                    <span>📷 Sin foto</span>
                  </div>
                )}

                {/* Badge Agotado */}
                {estaAgotado && (
                  <div style={s.badgeAgotadoOverlay}>
                    AGOTADO
                  </div>
                )}
              </div>

              {/* Cuerpo de la tarjeta */}
              <div style={s.cardBody}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {catNombre && <span style={s.badge}>{catNombre}</span>}
                  {estaAgotado ? (
                    <span style={s.badgeAgotadoText}>Agotado</span>
                  ) : stockNum <= 3 ? (
                    <span style={s.badgePocasUnidades}>¡Solo quedan {stockNum}!</span>
                  ) : null}
                </div>

                <h3 style={s.cardNombre}>{prod.nombre}</h3>
                {prod.descripcion && <p style={s.cardDesc}>{prod.descripcion}</p>}

                {/* Píldora de Reseñas / Calificaciones */}
                <button
                  type="button"
                  onClick={() => setModalResenasProd(prod)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: '#FEF9C3', border: '1px solid #FEF08A',
                    borderRadius: 999, padding: '4px 10px', width: 'fit-content',
                    fontSize: 12, fontWeight: 600, color: '#854D0E', cursor: 'pointer',
                    transition: 'transform 0.1s',
                  }}
                  title="Ver opiniones o calificar este producto"
                >
                  <Star size={13} fill="#EAB308" color="#EAB308" />
                  {infoResenas.total > 0 ? (
                    <span><strong>{infoResenas.promedio}</strong> ({infoResenas.total}) · Reseñas</span>
                  ) : (
                    <span>Calificar producto</span>
                  )}
                </button>

                {/* Precio y Control de Carrito */}
                <div style={{ marginTop: 'auto', paddingTop: 10 }}>
                  <p style={s.cardPrecio}>${Number(prod.precio).toFixed(2)}</p>

                  {estaAgotado ? (
                    <button
                      type="button"
                      disabled
                      style={s.btnDeshabilitado}
                      title="Producto sin stock disponible"
                    >
                      🚫 Agotado
                    </button>
                  ) : enCarrito ? (
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: '#ECFDF5', border: '1.5px solid #0F766E', borderRadius: 12,
                      padding: '4px 8px',
                    }}>
                      <button
                        type="button"
                        onClick={() => cambiarCantidad(prod.id, -1)}
                        style={{
                          width: 32, height: 32, borderRadius: 8, border: 'none',
                          background: '#FFFFFF', color: '#0F766E', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                        }}
                        title="Disminuir cantidad"
                      >
                        <Minus size={16} />
                      </button>

                      <span style={{ fontSize: 14, fontWeight: 700, color: '#0F766E' }}>
                        {itemCarrito.cantidad} en carrito
                      </span>

                      <button
                        type="button"
                        disabled={itemCarrito.cantidad >= stockNum}
                        onClick={() => cambiarCantidad(prod.id, 1)}
                        style={{
                          width: 32, height: 32, borderRadius: 8, border: 'none',
                          background: itemCarrito.cantidad >= stockNum ? '#CBD5E1' : '#0F766E',
                          color: '#FFFFFF', cursor: itemCarrito.cantidad >= stockNum ? 'not-allowed' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                        title="Aumentar cantidad"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => agregarAlCarrito(prod)}
                      style={s.btnAgregar}
                    >
                      <Plus size={16} /> Agregar al carrito
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <footer style={s.footer}>
        <p>Catálogo impulsado por <strong>Catálogo Estudiantil</strong></p>
      </footer>

      {/* Botón Flotante del Carrito (visible si hay items seleccionados) */}
      {totalItemsEnCarrito > 0 && (
        <button
          type="button"
          className="floating-cart-btn"
          onClick={() => setModalCarritoAbierto(true)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <ShoppingCart size={22} />
              <span style={{
                position: 'absolute', top: -8, right: -10,
                background: '#EF4444', color: '#FFFFFF',
                borderRadius: 999, fontSize: 11, fontWeight: 800,
                padding: '2px 6px', minWidth: 18, textAlign: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }}>
                {totalItemsEnCarrito}
              </span>
            </div>
            <span style={{ fontWeight: 700, fontSize: 15 }}>Ver mi pedido</span>
          </div>
          <span style={{
            background: 'rgba(255, 255, 255, 0.2)',
            padding: '4px 10px', borderRadius: 999,
            fontSize: 14, fontWeight: 800,
          }}>
            ${totalDineroCarrito.toFixed(2)}
          </span>
        </button>
      )}

      {/* Modal del Carrito / Checkout */}
      {modalCarritoAbierto && (
        <ModalCarrito
          tienda={tienda}
          carrito={carrito}
          cambiarCantidad={cambiarCantidad}
          eliminarDelCarrito={eliminarDelCarrito}
          vaciarCarrito={vaciarCarrito}
          onClose={() => setModalCarritoAbierto(false)}
          onPedidoExitoso={recargarProductos}
        />
      )}

      {/* Modal de Reseñas */}
      {modalResenasProd && (
        <ModalResenas
          producto={modalResenasProd}
          tienda={tienda}
          resumen={resumenValoraciones[modalResenasProd.id]}
          onClose={() => setModalResenasProd(null)}
          onNuevaValoracion={handleNuevaValoracion}
        />
      )}
    </div>
  )
}

// ============================================================
// ESTILOS INLINE
// ============================================================
const s = {
  page: {
    maxWidth: 1024,
    margin: '0 auto',
    padding: '0 0 80px',
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  },
  centrado: {
    minHeight: '70vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },

  hero: {
    textAlign: 'center',
    padding: '40px 20px 28px',
    background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
    borderBottom: '1px solid #E2E8F0',
  },
  heroTitulo: {
    margin: '0 0 6px',
    fontSize: 26,
    fontWeight: 800,
    color: '#0F172A',
    letterSpacing: '-0.3px',
  },
  heroSub: {
    margin: 0,
    color: '#64748B',
    fontSize: 14,
    maxWidth: 480,
    marginLeft: 'auto',
    marginRight: 'auto',
    lineHeight: 1.45,
  },

  filtros: {
    display: 'flex',
    gap: 8,
    padding: '14px 16px',
    borderBottom: '1px solid #E2E8F0',
    background: '#FFFFFF',
  },
  filtro: {
    padding: '8px 18px',
    border: '1px solid #E2E8F0',
    borderRadius: 999,
    background: '#FFFFFF',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    color: '#475569',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    transition: 'all 0.15s ease',
  },
  filtroActivo: {
    padding: '8px 18px',
    border: '1px solid #0F766E',
    borderRadius: 999,
    background: '#0F766E',
    cursor: 'pointer',
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    flexShrink: 0,
    boxShadow: '0 2px 6px rgba(15, 118, 110, 0.25)',
  },

  card: {
    border: '1px solid #E2E8F0',
    borderRadius: 18,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    background: '#FFFFFF',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
    position: 'relative',
    transition: 'transform 0.15s, box-shadow 0.15s',
  },
  cardImgContainer: {
    position: 'relative',
    width: '100%',
    height: 180,
    background: '#F8FAFC',
    overflow: 'hidden',
  },
  cardImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  imgPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#F1F5F9',
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: 500,
  },
  badgeAgotadoOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    background: '#DC2626',
    color: '#FFFFFF',
    padding: '4px 10px',
    borderRadius: 8,
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.5px',
    boxShadow: '0 2px 8px rgba(220, 38, 38, 0.35)',
  },
  cardBody: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    gap: 8,
  },
  badge: {
    display: 'inline-block',
    background: '#F1F5F9',
    borderRadius: 999,
    padding: '3px 10px',
    fontSize: 11,
    fontWeight: 600,
    color: '#475569',
  },
  badgeAgotadoText: {
    display: 'inline-block',
    background: '#FEE2E2',
    color: '#B91C1C',
    borderRadius: 999,
    padding: '3px 10px',
    fontSize: 11,
    fontWeight: 700,
  },
  badgePocasUnidades: {
    display: 'inline-block',
    background: '#FEF3C7',
    color: '#B45309',
    borderRadius: 999,
    padding: '3px 10px',
    fontSize: 11,
    fontWeight: 700,
  },
  cardNombre: {
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
    color: '#0F172A',
    lineHeight: 1.3,
  },
  cardDesc: {
    margin: 0,
    fontSize: 13,
    color: '#64748B',
    lineHeight: 1.45,
    flex: 1,
  },
  cardPrecio: {
    margin: '0 0 10px',
    fontSize: 20,
    fontWeight: 800,
    color: '#0F172A',
  },

  btnAgregar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
    padding: '11px 0',
    background: '#0F766E',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 12,
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(15, 118, 110, 0.25)',
    transition: 'background 0.15s, transform 0.08s',
  },
  btnDeshabilitado: {
    display: 'block',
    textAlign: 'center',
    width: '100%',
    padding: '11px 0',
    background: '#F1F5F9',
    color: '#94A3B8',
    border: '1px solid #E2E8F0',
    borderRadius: 12,
    fontWeight: 600,
    fontSize: 13,
    cursor: 'not-allowed',
  },

  footer: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 48,
  },
}
