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
