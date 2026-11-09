// ============================================================
// services/pedidoService.js
// Manejo de pedidos de clientes en Supabase (tablas `pedidos` y `pedido_items`)
// ============================================================
import { supabase } from '../supabaseClient'

/**
 * Registra un pedido completo en Supabase:
 * 1. Inserta la cabecera en `pedidos`
 * 2. Inserta los productos en `pedido_items` (disparando el trigger SQL que descuenta stock)
 * 
 * @param {object} param0
 * @param {string} param0.tienda_id - UUID de la tienda
 * @param {string} param0.nombre_cliente - Nombre obligatorio del cliente
 * @param {string} [param0.telefono_cliente] - Teléfono o notas
 * @param {number} param0.total - Monto total del pedido
 * @param {Array<{ id: number, cantidad: number, precio: number }>} param0.items - Productos en el carrito
 */
export async function crearPedidoConItems({ tienda_id, nombre_cliente, telefono_cliente = null, total, items }) {
  try {
    if (!nombre_cliente || !nombre_cliente.trim()) {
      return { data: null, error: new Error('El nombre del cliente es obligatorio') }
    }
    if (!items || items.length === 0) {
      return { data: null, error: new Error('El pedido no tiene productos') }
    }

    // 1. Insertar cabecera del pedido
    const pedidoPayload = {
      tienda_id,
      nombre_cliente: nombre_cliente.trim(),
      telefono_cliente: telefono_cliente?.trim() || null,
      total: Number(Number(total).toFixed(2)),
      estado: 'pendiente',
    }

    const { data: pedidoData, error: pedidoError } = await supabase
      .from('pedidos')
      .insert([pedidoPayload])
      .select('id, tienda_id, nombre_cliente, total, estado, created_at')
      .single()

    if (pedidoError || !pedidoData) {
      console.error('Error insertando en pedidos:', pedidoError)
      return { data: null, error: pedidoError }
    }

    const pedidoId = pedidoData.id

    // 2. Bulk insert de items en pedido_items (dispara trigger para descontar stock)
    const itemsPayload = items.map((it) => ({
      pedido_id: pedidoId,
      producto_id: it.id,
      cantidad: Number(it.cantidad),
      precio_unitario: Number(Number(it.precio).toFixed(2)),
    }))

    const { error: itemsError } = await supabase
      .from('pedido_items')
      .insert(itemsPayload)

    if (itemsError) {
      console.error('Error insertando en pedido_items:', itemsError)
      return { data: pedidoData, error: itemsError }
    }

    return { data: pedidoData, error: null }
  } catch (err) {
    console.error('Excepción en crearPedidoConItems:', err)
    return { data: null, error: err }
  }
}

/**
 * Obtiene todos los pedidos de una tienda junto con sus items y datos del producto.
 * @param {string} tiendaId - UUID de la tienda
 */
export async function getPedidosPorTienda(tiendaId) {
  try {
    const { data, error } = await supabase
      .from('pedidos')
      .select(`
        *,
        pedido_items (
          id,
          pedido_id,
          producto_id,
          cantidad,
          precio_unitario,
          productos (
            id,
            nombre,
            imagen_url
          )
        )
      `)
      .eq('tienda_id', tiendaId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error al obtener pedidos:', error)
      return { data: [], error }
    }
    return { data: data || [], error: null }
  } catch (err) {
    console.error('Excepción en getPedidosPorTienda:', err)
    return { data: [], error: err }
  }
}

/**
 * Actualiza el estado de un pedido ('pendiente' | 'pagado' | 'cancelado').
 * Si pasa a 'cancelado', el trigger de base de datos restaura el stock automáticamente.
 * 
 * @param {string} pedidoId - UUID del pedido
 * @param {'pendiente'|'pagado'|'cancelado'} nuevoEstado
 */
export async function actualizarEstadoPedido(pedidoId, nuevoEstado) {
  try {
    const { data, error } = await supabase
      .from('pedidos')
      .update({ estado: nuevoEstado })
      .eq('id', pedidoId)
      .select()
      .single()

    if (error) {
      console.error('Error actualizando estado de pedido:', error)
      return { data: null, error }
    }
    return { data, error: null }
  } catch (err) {
    console.error('Excepción en actualizarEstadoPedido:', err)
    return { data: null, error: err }
  }
}
