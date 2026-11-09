// ============================================================
// services/productoService.js
// CRUD sobre la tabla `productos` y Supabase Storage
// ============================================================
import { supabase } from '../supabaseClient'

/**
 * Sube una imagen a Supabase Storage en el bucket 'productos'.
 * @param {File} file
 * @param {number|string} tiendaId
 * @returns {Promise<{ publicUrl: string|null, error: object|null }>}
 */
export async function subirImagenProducto(file, tiendaId) {
  try {
    const extension = file.name.split('.').pop()
    const nombreLimpio = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9-_]/g, '_')
    const filePath = `${tiendaId}/${Date.now()}-${nombreLimpio}.${extension}`

    const { error: uploadError } = await supabase.storage
      .from('productos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      return { publicUrl: null, error: uploadError }
    }

    const { data: urlData } = supabase.storage
      .from('productos')
      .getPublicUrl(filePath)

    return { publicUrl: urlData.publicUrl, error: null }
  } catch (err) {
    return { publicUrl: null, error: err }
  }
}

/**
 * Obtiene todos los productos de una tienda.
 * @param {number} tiendaId
 */
export async function getProductos(tiendaId) {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('tienda_id', tiendaId)
    .order('id', { ascending: true })

  return { data, error }
}

/**
 * Obtiene productos disponibles de una tienda (vista pública).
 * @param {number} tiendaId
 */
export async function getProductosDisponibles(tiendaId) {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('tienda_id', tiendaId)
    .eq('disponible', true)
    .order('id', { ascending: true })

  return { data, error }
}

/**
 * Crea un nuevo producto.
 * @param {object} producto - { tienda_id, categoria_id, nombre, descripcion, precio, imagen_url, disponible, stock }
 */
export async function crearProducto(producto) {
  const { data, error } = await supabase
    .from('productos')
    .insert([producto])
    .select()
    .single()

  return { data, error }
}

/**
 * Actualiza los datos de un producto.
 * @param {number} productoId
 * @param {object} campos
 */
export async function actualizarProducto(productoId, campos) {
  const { data, error } = await supabase
    .from('productos')
    .update(campos)
    .eq('id', productoId)
    .select()
    .single()

  return { data, error }
}

/**
 * Actualiza únicamente el stock de un producto.
 * @param {number} productoId
 * @param {number} nuevoStock
 */
export async function actualizarStock(productoId, nuevoStock) {
  const { data, error } = await supabase
    .from('productos')
    .update({ stock: nuevoStock })
    .eq('id', productoId)
    .select()
    .single()

  return { data, error }
}

/**
 * Alterna el campo `disponible` de un producto.
 * @param {number} productoId
 * @param {boolean} disponibleActual
 */
export async function toggleDisponible(productoId, disponibleActual) {
  const { data, error } = await supabase
    .from('productos')
    .update({ disponible: !disponibleActual })
    .eq('id', productoId)
    .select()
    .single()

  return { data, error }
}

/**
 * Elimina un producto por su id.
 * @param {number} productoId
 */
export async function eliminarProducto(productoId) {
  const { error } = await supabase
    .from('productos')
    .delete()
    .eq('id', productoId)

  return { error }
}

