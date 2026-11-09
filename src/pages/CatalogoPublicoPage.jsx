// ============================================================
// pages/CatalogoPublicoPage.jsx
// Vista pública del catálogo — solo lectura con badges de Stock y Agotado
// ============================================================
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getTiendaPorSlug } from '../services/tiendaService'
import { getCategorias } from '../services/categoriaService'
import { getProductosDisponibles } from '../services/productoService'

export default function CatalogoPublicoPage() {
  const { slug } = useParams()

  const [tienda, setTienda] = useState(null)
  const [categorias, setCategorias] = useState([])
  const [productos, setProductos] = useState([])
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const cargar = async () => {
      setCargando(true)
      setError(null)

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

      setCategorias(catsResult.data || [])
      setProductos(prodsResult.data || [])
      setCargando(false)
    }

    cargar()
  }, [slug])

  // Filtrado por categoría
  const productosFiltrados = categoriaSeleccionada
    ? productos.filter((p) => p.categoria_id === categoriaSeleccionada)
    : productos

  // Link de WhatsApp para productos en stock
  const generarLinkWhatsapp = (producto) => {
    if (!tienda?.telefono_whatsapp) return '#'
    const telefono = tienda.telefono_whatsapp.replace(/\D/g, '')
    const texto = `Hola, deseo ordenar: ${producto.nombre} - $${Number(producto.precio).toFixed(2)}`
    return `https://wa.me/${telefono}?text=${encodeURIComponent(texto)}`
  }

  // ---- Estados de carga y error ----
  if (cargando) {
    return (
      <div style={s.centrado}>
        <p style={{ color: '#888', fontSize: 16 }}>Cargando catálogo...</p>
      </div>
    )
  }

  if (error === 'no_encontrada') {
    return (
      <div style={s.centrado}>
        <h2 style={{ marginBottom: 8 }}>🔍 Catálogo no encontrado</h2>
        <p style={{ color: '#888' }}>
          El enlace <code style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: 3 }}>
            /tienda/{slug}
          </code> no existe o está inactivo.
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={s.centrado}>
        <h2>Error</h2>
        <p style={{ color: '#d32f2f' }}>{error}</p>
      </div>
    )
  }

  // ---- Vista principal ----
  return (
    <div style={s.page}>

      {/* Cabecera de la tienda */}
      <div style={s.hero}>
        <h1 style={s.heroTitulo}>{tienda.nombre_tienda}</h1>
        <p style={s.heroSub}>Explora nuestros productos y haz tu pedido por WhatsApp</p>
      </div>

      {/* Filtros por categoría con scroll táctil en móvil */}
      {categorias.length > 0 && (
        <div className="chips-scroll-container" style={s.filtros}>
          <button
            onClick={() => setCategoriaSeleccionada(null)}
            style={categoriaSeleccionada === null ? s.filtroActivo : s.filtro}
          >
            Todos
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

      {/* Sin productos en esta categoría */}
      {productosFiltrados.length === 0 && (
        <p style={{ textAlign: 'center', color: '#888', marginTop: 40, padding: '0 16px' }}>
          No hay productos disponibles en esta categoría.
        </p>
      )}

      {/* Grid adaptable de productos (mobile-first) */}
      <div className="public-catalog-grid">
        {productosFiltrados.map((prod) => {
          const catNombre = categorias.find((c) => c.id === prod.categoria_id)?.nombre || ''
          const stockNum = prod.stock !== undefined && prod.stock !== null ? Number(prod.stock) : 1
          const estaAgotado = stockNum <= 0 || prod.disponible === false

          return (
            <div
              key={prod.id}
              style={{
                ...s.card,
                opacity: estaAgotado ? 0.88 : 1,
              }}
            >
              {/* Imagen con badge superior */}
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

                {/* Badge de Agotado sobre la imagen */}
                {estaAgotado && (
                  <div style={s.badgeAgotadoOverlay}>
                    AGOTADO
                  </div>
                )}
              </div>

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

                <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                  <p style={s.cardPrecio}>${Number(prod.precio).toFixed(2)}</p>

                  {/* Botón de WhatsApp o Aviso de Agotado */}
                  {estaAgotado ? (
                    <button
                      type="button"
                      disabled
                      style={s.btnWhatsappDeshabilitado}
                      title="Este producto no tiene unidades disponibles en este momento"
                    >
                      🚫 Agotado (Sin stock)
                    </button>
                  ) : (
                    <a
                      href={generarLinkWhatsapp(prod)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={s.btnWhatsapp}
                    >
                      💬 Pedir por WhatsApp
                    </a>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <footer style={s.footer}>
        <p>Catálogo generado con <strong>Catálogo Estudiantil</strong></p>
      </footer>
    </div>
  )
}

// ---- Estilos inline ----
const s = {
  page: { maxWidth: 960, margin: '0 auto', padding: '0 0 40px', fontFamily: 'sans-serif' },
  centrado: { minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 },

  hero: { textAlign: 'center', padding: '40px 24px 24px', borderBottom: '1px solid #f0f0f0' },
  heroTitulo: { margin: '0 0 8px', fontSize: 28, fontWeight: '800' },
  heroSub: { margin: 0, color: '#888', fontSize: 15 },

  filtros: { display: 'flex', gap: 8, padding: '14px 16px', borderBottom: '1px solid #f0f0f0' },
  filtro: {
    padding: '8px 18px', border: '1px solid #ddd', borderRadius: 20,
    background: '#fff', cursor: 'pointer', fontSize: 14, color: '#333',
    whiteSpace: 'nowrap', flexShrink: 0,
  },
  filtroActivo: {
    padding: '8px 18px', border: '1px solid #1a1a1a', borderRadius: 20,
    background: '#1a1a1a', cursor: 'pointer', fontSize: 14, color: '#fff', fontWeight: '600',
    whiteSpace: 'nowrap', flexShrink: 0,
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
    gap: 20,
    padding: '24px',
  },
  card: {
    border: '1px solid #e8e8e8', borderRadius: 10,
    overflow: 'hidden', display: 'flex', flexDirection: 'column',
    background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    position: 'relative',
  },
  cardImgContainer: {
    position: 'relative',
    width: '100%',
    height: 180,
    background: '#f8f8f8',
    overflow: 'hidden',
  },
  cardImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  imgPlaceholder: {
    width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#f3f4f6', color: '#9ca3af', fontSize: 14,
  },
  badgeAgotadoOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    background: '#dc2626',
    color: '#fff',
    padding: '4px 10px',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: '0.5px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
  },
  cardBody: { padding: '14px', display: 'flex', flexDirection: 'column', flex: 1, gap: 6 },
  badge: {
    display: 'inline-block', background: '#f0f0f0', borderRadius: 12,
    padding: '2px 10px', fontSize: 11, color: '#555',
  },
  badgeAgotadoText: {
    display: 'inline-block', background: '#fee2e2', color: '#991b1b',
    borderRadius: 12, padding: '2px 10px', fontSize: 11, fontWeight: '700',
  },
  badgePocasUnidades: {
    display: 'inline-block', background: '#fef3c7', color: '#92400e',
    borderRadius: 12, padding: '2px 10px', fontSize: 11, fontWeight: '700',
  },
  cardNombre: { margin: 0, fontSize: 15, fontWeight: '700' },
  cardDesc: { margin: 0, fontSize: 13, color: '#666', lineHeight: 1.4, flex: 1 },
  cardPrecio: { margin: '0 0 8px', fontSize: 18, fontWeight: '800', color: '#1a1a1a' },

  btnWhatsapp: {
    display: 'block', textAlign: 'center',
    padding: '10px 0', background: '#25D366', color: '#fff',
    textDecoration: 'none', borderRadius: 7, fontWeight: '700', fontSize: 14,
  },
  btnWhatsappDeshabilitado: {
    display: 'block', textAlign: 'center', width: '100%',
    padding: '10px 0', background: '#e5e7eb', color: '#9ca3af',
    border: '1px solid #d1d5db', borderRadius: 7, fontWeight: '600', fontSize: 13,
    cursor: 'not-allowed',
  },

  footer: { textAlign: 'center', color: '#bbb', fontSize: 13, marginTop: 32 },
}
