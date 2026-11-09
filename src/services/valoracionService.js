// ============================================================
// services/valoracionService.js
// Manejo de reseñas y calificaciones en Supabase (tabla `valoraciones`)
// ============================================================
import { supabase } from '../supabaseClient'

/**
 * Obtiene todas las valoraciones registradas de un producto específico, ordenadas por fecha reciente.
 * @param {number|string} productoId
 */
export async function getValoracionesPorProducto(productoId) {
  try {
    const { data, error } = await supabase
      .from('valoraciones')
      .select('*')
      .eq('producto_id', productoId)
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('Error al consultar valoraciones de producto:', error.message)
      return { data: [], error }
    }
    return { data: data || [], error: null }
  } catch (err) {
    console.warn('Excepción al consultar valoraciones:', err)
    return { data: [], error: err }
  }
}

/**
 * Obtiene el resumen consolidado de valoraciones (conteo y promedio)
 * para un arreglo de IDs de productos.
 * @param {Array<number|string>} productoIds
 */
export async function getResumenValoraciones(productoIds) {
  if (!productoIds || productoIds.length === 0) {
    return { data: {}, error: null }
  }

  try {
    const { data, error } = await supabase
      .from('valoraciones')
      .select('producto_id, calificacion')
      .in('producto_id', productoIds)

    if (error) {
      console.warn('Error al consultar resumen de valoraciones:', error.message)
      return { data: {}, error }
    }

    const consolidado = {}
    for (const fila of data || []) {
      const pid = fila.producto_id
      if (!consolidado[pid]) {
        consolidado[pid] = { total: 0, suma: 0 }
      }
      consolidado[pid].total += 1
      consolidado[pid].suma += Number(fila.calificacion || 0)
    }

    const resultado = {}
    for (const [pid, info] of Object.entries(consolidado)) {
      resultado[pid] = {
        total: info.total,
        promedio: Number((info.suma / info.total).toFixed(1)),
      }
    }

    return { data: resultado, error: null }
  } catch (err) {
    console.warn('Excepción al obtener resumen de valoraciones:', err)
    return { data: {}, error: err }
  }
}

/**
 * Inserta una nueva valoración para un producto en la tabla `valoraciones`.
 * @param {object} param0
 * @param {number|string} param0.producto_id
 * @param {string} [param0.nombre_cliente]
 * @param {number} param0.calificacion (1 al 5)
 * @param {string} [param0.comentario]
 */
export async function crearValoracion({ producto_id, nombre_cliente, calificacion, comentario }) {
  try {
    const payload = {
      producto_id,
      nombre_cliente: nombre_cliente?.trim() || 'Anónimo',
      calificacion: Math.min(5, Math.max(1, Number(calificacion) || 5)),
      comentario: comentario?.trim() || null,
    }

    const { data, error } = await supabase
      .from('valoraciones')
      .insert([payload])
      .select()
      .single()

    if (error) {
      return { data: null, error }
    }
    return { data, error: null }
  } catch (err) {
    return { data: null, error: err }
  }
}


/**
 * Obtiene todas las valoraciones de los productos pertenecientes a una tienda,
 * haciendo JOIN con la tabla productos.
 * @param {string|number} tiendaId - ID de la tienda
 */
export async function getValoracionesPorTienda(tiendaId) {
  try {
    const { data: prods, error: prodsErr } = await supabase
      .from('productos')
      .select('id, nombre, imagen_url')
      .eq('tienda_id', tiendaId)

    if (prodsErr || !prods || prods.length === 0) {
      return { data: [], error: prodsErr }
    }

    const prodMap = {}
    prods.forEach((p) => { prodMap[p.id] = p })
    const prodIds = prods.map((p) => p.id)

    // Consulta con JOIN relacional a productos
    const { data: vals, error: valsErr } = await supabase
      .from('valoraciones')
      .select('*, productos(id, nombre, imagen_url)')
      .in('producto_id', prodIds)
      .order('created_at', { ascending: false })

    if (valsErr) {
      // Fallback si la relación automática de PostgREST diera error por alias
      const { data: fallbackVals, error: fallbackErr } = await supabase
        .from('valoraciones')
        .select('*')
        .in('producto_id', prodIds)
        .order('created_at', { ascending: false })

      if (fallbackErr) {
        console.warn('Error al obtener valoraciones por tienda:', fallbackErr)
        return { data: [], error: fallbackErr }
      }

      const fallbackCompletas = (fallbackVals || []).map((v) => ({
        ...v,
        productos: prodMap[v.producto_id] || { id: v.producto_id, nombre: 'Producto', imagen_url: '' },
      }))

      return { data: fallbackCompletas, error: null }
    }

    const completas = (vals || []).map((v) => ({
      ...v,
      productos: v.productos || prodMap[v.producto_id] || { id: v.producto_id, nombre: 'Producto', imagen_url: '' },
    }))

    return { data: completas, error: null }
  } catch (err) {
    console.error('Excepción en getValoracionesPorTienda:', err)
    return { data: [], error: err }
  }
}
