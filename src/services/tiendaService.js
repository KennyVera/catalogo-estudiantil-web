// ============================================================
// services/tiendaService.js
// Operaciones sobre la tabla `tiendas`
// ============================================================
import { supabase } from '../supabaseClient'

/**
 * Autentica una tienda activa por usuario y contraseña (codigo_acceso).
 * @param {string} usuario
 * @param {string} password
 */
export async function loginConCredenciales(usuario, password) {
  const { data, error } = await supabase
    .from('tiendas')
    .select('*')
    .eq('usuario', usuario.trim().toLowerCase())
    .eq('codigo_acceso', password.trim())
    .eq('activo', true)
    .single()

  return { data, error }
}

/**
 * Busca una tienda activa por su slug (vista pública).
 * @param {string} slug
 */
export async function getTiendaPorSlug(slug) {
  const { data, error } = await supabase
    .from('tiendas')
    .select('*')
    .eq('slug', slug)
    .eq('activo', true)
    .single()

  return { data, error }
}

/**
 * Verifica si un usuario ya está en uso.
 * @param {string} usuario
 */
export async function usuarioDisponible(usuario) {
  const { data } = await supabase
    .from('tiendas')
    .select('id')
    .eq('usuario', usuario.trim().toLowerCase())
    .maybeSingle()

  return !data // true = disponible
}

/**
 * Verifica si un slug ya está en uso.
 * @param {string} slug
 */
export async function slugDisponible(slug) {
  const { data } = await supabase
    .from('tiendas')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  return !data // true = disponible
}

/**
 * Genera un slug único en base al nombre_tienda.
 * Si el slug ya existe, añade un sufijo aleatorio o contador.
 * @param {string} nombre
 */
export async function generarSlugUnico(nombre) {
  const baseSlug = nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita tildes
    .replace(/[^a-z0-9\s-]/g, '')    // solo letras, números, espacios y guiones
    .trim()
    .replace(/\s+/g, '-')            // espacios → guiones
    .replace(/-+/g, '-')             // guiones duplicados
    || 'tienda'

  let slugCandidato = baseSlug
  let disponible = await slugDisponible(slugCandidato)
  let contador = 1

  while (!disponible) {
    contador++
    slugCandidato = `${baseSlug}-${contador}`
    disponible = await slugDisponible(slugCandidato)
  }

  return slugCandidato
}

/**
 * Registra una nueva tienda con activo = true.
 * @param {{ nombre_tienda, usuario, slug, telefono_whatsapp, codigo_acceso }} payload
 */
export async function registrarTienda(payload) {
  const { data, error } = await supabase
    .from('tiendas')
    .insert([
      {
        ...payload,
        usuario: payload.usuario.trim().toLowerCase(),
        activo: true,
      },
    ])
    .select()
    .single()

  return { data, error }
}

/**
 * Sube la foto de perfil al bucket 'avatars' de Supabase y actualiza avatar_url en tiendas.
 * @param {number|string} tiendaId
 * @param {File} file
 */
export async function actualizarFotoPerfil(tiendaId, file) {
  try {
    const extension = file.name.split('.').pop()
    const filePath = `avatar-${tiendaId}-${Date.now()}.${extension}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      })

    if (uploadError) {
      return { data: null, error: uploadError }
    }

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    const publicUrl = urlData.publicUrl

    const { data, error } = await supabase
      .from('tiendas')
      .update({ avatar_url: publicUrl })
      .eq('id', tiendaId)
      .select()
      .single()

    return { data, error }
  } catch (err) {
    return { data: null, error: err }
  }
}

/**
 * Actualiza la contraseña (codigo_acceso) de la tienda.
 * @param {number|string} tiendaId
 * @param {string} nuevaPassword
 */
export async function actualizarPassword(tiendaId, nuevaPassword) {
  const { data, error } = await supabase
    .from('tiendas')
    .update({ codigo_acceso: nuevaPassword.trim() })
    .eq('id', tiendaId)
    .select()
    .single()

  return { data, error }
}

