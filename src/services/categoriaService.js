// ============================================================
// services/categoriaService.js
// CRUD sobre la tabla `categorias`
// ============================================================
import { supabase } from '../supabaseClient'

/**
 * Obtiene todas las categorías de una tienda.
 * @param {number} tiendaId
 */
export async function getCategorias(tiendaId) {
  const { data, error } = await supabase
    .from('categorias')
    .select('*')
    .eq('tienda_id', tiendaId)
    .order('id', { ascending: true })

  return { data, error }
}

/**
 * Crea una nueva categoría.
 * @param {number} tiendaId
 * @param {string} nombre
 */
export async function crearCategoria(tiendaId, nombre) {
  const { data, error } = await supabase
    .from('categorias')
    .insert([{ tienda_id: tiendaId, nombre: nombre.trim() }])
    .select()
    .single()

  return { data, error }
}

/**
 * Actualiza el nombre de una categoría por su id.
 * @param {number} categoriaId
 * @param {string} nuevoNombre
 */
export async function actualizarCategoria(categoriaId, nuevoNombre) {
  const { data, error } = await supabase
    .from('categorias')
    .update({ nombre: nuevoNombre.trim() })
    .eq('id', categoriaId)
    .select()
    .single()

  return { data, error }
}

/**
 * Elimina una categoría por su id.
 * @param {number} categoriaId
 */
export async function eliminarCategoria(categoriaId) {
  const { error } = await supabase
    .from('categorias')
    .delete()
    .eq('id', categoriaId)

  return { error }
}
