import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

// ── Sonido de notificación con Web Audio API ──────────────────────────────────
export function reproducirSonido() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.connect(gain)
    gain.connect(ctx.destination)
    oscillator.frequency.value = 820
    oscillator.type = 'sine'
    gain.gain.setValueAtTime(0.35, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.5)
    // segundo tono
    const osc2 = ctx.createOscillator()
    const g2 = ctx.createGain()
    osc2.connect(g2)
    g2.connect(ctx.destination)
    osc2.frequency.value = 1040
    osc2.type = 'sine'
    g2.gain.setValueAtTime(0.3, ctx.currentTime + 0.25)
    g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.75)
    osc2.start(ctx.currentTime + 0.25)
    osc2.stop(ctx.currentTime + 0.75)
  } catch (e) {
    console.warn('AudioContext no disponible:', e)
  }
}

// ── Notificación del navegador ────────────────────────────────────────────────
export function pedirPermisoNotificaciones() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
}

function mostrarNotificacion(pedido) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('🛵 Nuevo pedido — Mijarepas', {
      body: `${pedido.cliente_nombre} · Sede ${pedido.sede} · $${pedido.total?.toLocaleString('es-CO')}`,
      icon: '/logo.png',
    })
  }
}

// ── Inicio del día ────────────────────────────────────────────────────────────
function inicioDia() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

// ── Hook principal ────────────────────────────────────────────────────────────
export default function usePedidos() {
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [flashRecibido, setFlashRecibido] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const channelRef = useRef(null)
  const muteUntilRef = useRef(0)

  // Cargar pedidos del día al montar
  const cargarPedidos = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .gte('created_at', inicioDia())
      .order('created_at', { ascending: true })

    if (!error && data) setPedidos(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    cargarPedidos()
    pedirPermisoNotificaciones()
  }, [cargarPedidos])

  // ── Crear / reconectar suscripción Realtime ──
  const setupRealtime = useCallback(() => {
    // Limpiar canal anterior si existe
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    const channel = supabase
      .channel('pedidos-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'pedidos' },
        (payload) => {
          setPedidos(prev => {
            // Evitar duplicados
            if (prev.find(p => p.id === payload.new.id)) return prev
            return [...prev, payload.new].sort(
              (a, b) => new Date(a.created_at) - new Date(b.created_at)
            )
          })
          reproducirSonido()
          mostrarNotificacion(payload.new)
          // Flash en columna recibido
          setFlashRecibido(true)
          setTimeout(() => setFlashRecibido(false), 900)
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'pedidos' },
        (payload) => {
          setPedidos(prev =>
            prev.map(p => (p.id === payload.new.id ? payload.new : p))
          )
        }
      )
      .subscribe()

    channelRef.current = channel
  }, [])

  // Suscripción Realtime — montar / desmontar
  useEffect(() => {
    setupRealtime()
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [setupRealtime])

  // MEJORA 1 — Recargar pedidos + reconectar Realtime al volver a la pestaña
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        cargarPedidos()
        setupRealtime()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [cargarPedidos, setupRealtime])

  // MEJORA 2 — Heartbeat cada 30s: verificar que Realtime sigue vivo
  useEffect(() => {
    const heartbeat = setInterval(() => {
      const ch = channelRef.current
      if (ch && (ch.state === 'closed' || ch.state === 'errored')) {
        console.warn('Realtime channel lost, reconnecting...')
        setupRealtime()
      }
    }, 30000)
    return () => clearInterval(heartbeat)
  }, [setupRealtime])

  // ── Silenciar alarma por 5 minutos ──
  const silenciar = useCallback(() => {
    muteUntilRef.current = Date.now() + 5 * 60 * 1000
    setIsMuted(true)
  }, [])

  // ── Alarma persistente: sonar cada 30s si hay pedidos recibidos sin atender ──
  useEffect(() => {
    const alarmInterval = setInterval(() => {
      // Check if mute expired
      if (muteUntilRef.current && Date.now() > muteUntilRef.current) {
        muteUntilRef.current = 0
        setIsMuted(false)
      }

      // If muted, skip
      if (muteUntilRef.current && Date.now() < muteUntilRef.current) return

      // Check for recibido pedidos older than 30 seconds
      const ahora = Date.now()
      const recibidosViejos = pedidos.filter(p => {
        if (p.estado !== 'recibido') return false
        const creado = new Date(p.created_at).getTime()
        return (ahora - creado) > 30000
      })

      if (recibidosViejos.length > 0) {
        reproducirSonido()
      }
    }, 30000)

    return () => clearInterval(alarmInterval)
  }, [pedidos])

  // Avanzar estado
  const avanzarEstado = useCallback(async (id, estadoActual) => {
    const ESTADOS = ['recibido', 'en_preparacion', 'listo', 'entregado']
    const idx = ESTADOS.indexOf(estadoActual)
    if (idx === -1 || idx === ESTADOS.length - 1) return
    const nuevoEstado = ESTADOS[idx + 1]
    await supabase.from('pedidos').update({ estado: nuevoEstado }).eq('id', id)
    // Actualización optimista
    setPedidos(prev =>
      prev.map(p => (p.id === id ? { ...p, estado: nuevoEstado } : p))
    )
  }, [])

  // Pedidos "entregado" que llevan más de 5 minutos se ocultan del kanban
  const ESTADOS_KANBAN = ['recibido', 'en_preparacion', 'listo', 'entregado']

  const pedidosKanban = pedidos.filter(p => {
    if (p.estado !== 'entregado') return true
    const hace5min = Date.now() - 5 * 60 * 1000
    return new Date(p.updated_at || p.created_at).getTime() > hace5min
  })

  // Contador de pedidos recibidos sin atender
  const countRecibidos = pedidos.filter(p => p.estado === 'recibido').length

  return {
    pedidos,           // todos (para historial)
    pedidosKanban,     // filtrados para kanban
    loading,
    flashRecibido,
    avanzarEstado,
    countRecibidos,
    recargar: cargarPedidos,
    isMuted,
    silenciar,
  }
}
