import { useState, useMemo, useEffect, useCallback } from 'react'
import EstadisticasDia from './EstadisticasDia'
import { supabase } from '../lib/supabase'

function formatHora(iso) {
  return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true })
}
function formatCOP(n) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n)
}
function numeroPedido(id) {
  return id ? id.slice(-4).toUpperCase() : '????'
}
// Formato YYYY-MM-DD en hora local
function hoyLocal() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
// Rango inicio/fin de un día local → ISO para Supabase
function rangoDelDia(fechaStr) {
  const inicio = new Date(`${fechaStr}T00:00:00`)
  const fin    = new Date(`${fechaStr}T23:59:59.999`)
  return { inicio: inicio.toISOString(), fin: fin.toISOString() }
}
// Formato legible: "Hoy", "Ayer" o "DD de Mes AAAA"
function labelFecha(fechaStr) {
  const hoy  = hoyLocal()
  const ayerD = new Date(); ayerD.setDate(ayerD.getDate() - 1)
  const ayer = `${ayerD.getFullYear()}-${String(ayerD.getMonth() + 1).padStart(2, '0')}-${String(ayerD.getDate()).padStart(2, '0')}`
  if (fechaStr === hoy)  return 'Hoy'
  if (fechaStr === ayer) return 'Ayer'
  const [y, m, d] = fechaStr.split('-')
  const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
  return `${parseInt(d)} de ${meses[parseInt(m) - 1]} ${y}`
}

const ESTADO_COLORS = {
  recibido:       '#eb1e55',
  en_preparacion: '#f9ac31',
  listo:          '#007d3e',
  entregado:      '#00afec',
}
const ESTADO_LABELS = {
  recibido:       'Recibido',
  en_preparacion: 'En prep.',
  listo:          'Listo',
  entregado:      'Entregado',
}
const SEDES  = ['Todas', 'Aurora', 'Lagos', 'Mutis', 'Piedecuesta']
const ESTADOS = ['Todos', 'recibido', 'en_preparacion', 'listo', 'entregado']

// ── Estilos compartidos ───────────────────────────────────────────────────────
const inputBase = {
  padding: '7px 10px', borderRadius: '10px', fontSize: '0.78rem',
  border: '1.5px solid rgba(66,38,26,0.2)', background: 'rgba(255,255,255,0.9)',
  color: '#42261a', cursor: 'pointer', outline: 'none', fontFamily: 'Brinnan',
}

export default function Historial({ pedidos: pedidosHoy, sedeGlobal }) {
  const hoy = hoyLocal()

  const [fechaSeleccionada, setFechaSeleccionada] = useState(hoy)
  const [pedidosFecha, setPedidosFecha]           = useState(null)   // null = usar pedidosHoy
  const [loadingFecha, setLoadingFecha]           = useState(false)

  const [filtroSede,   setFiltroSede]   = useState(sedeGlobal || 'Todas')
  const [filtroEstado, setFiltroEstado] = useState('Todos')
  const [busqueda,     setBusqueda]     = useState('')
  const [seccion,      setSeccion]      = useState('lista') // 'lista' | 'estadisticas'

  // Si el filtro global de sede cambia, sincronizar
  useEffect(() => { setFiltroSede(sedeGlobal || 'Todas') }, [sedeGlobal])

  // Cargar pedidos de una fecha distinta a hoy
  const cargarFecha = useCallback(async (fecha) => {
    if (fecha === hoy) {
      setPedidosFecha(null)   // vuelve a usar los del hook (realtime)
      return
    }
    setLoadingFecha(true)
    const { inicio, fin } = rangoDelDia(fecha)
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .gte('created_at', inicio)
      .lte('created_at', fin)
      .order('created_at', { ascending: true })
    if (!error && data) setPedidosFecha(data)
    setLoadingFecha(false)
  }, [hoy])

  // Cuando cambia la fecha en el picker
  const handleFechaChange = (e) => {
    const nueva = e.target.value
    setFechaSeleccionada(nueva)
    cargarFecha(nueva)
  }

  // Fuente de pedidos: si es hoy → los del hook (en tiempo real); si es otro día → los cargados
  const pedidosBase = pedidosFecha !== null ? pedidosFecha : pedidosHoy

  // Filtros
  const pedidosFiltrados = useMemo(() => {
    return pedidosBase.filter(p => {
      if (filtroSede !== 'Todas' && p.sede !== filtroSede) return false
      if (filtroEstado !== 'Todos' && p.estado !== filtroEstado) return false
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase()
        if (!p.cliente_nombre?.toLowerCase().includes(q) && !numeroPedido(p.id).toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [pedidosBase, filtroSede, filtroEstado, busqueda])

  const pedidosParaStats = useMemo(() => {
    return pedidosBase.filter(p => filtroSede === 'Todas' || p.sede === filtroSede)
  }, [pedidosBase, filtroSede])

  const esHoy = fechaSeleccionada === hoy

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* ── Selector de fecha ──────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
        background: '#fff', borderRadius: '12px', padding: '10px 14px',
        boxShadow: '0 1px 8px rgba(66,38,26,0.08)',
      }}>
        <span style={{ fontSize: '1.1rem' }}>📅</span>
        <span className="font-healing" style={{ fontSize: '0.95rem', color: '#42261a' }}>
          {labelFecha(fechaSeleccionada)}
        </span>

        {/* Input date con estética de marca */}
        <div style={{ position: 'relative', marginLeft: 'auto' }}>
          <input
            type="date"
            value={fechaSeleccionada}
            max={hoy}
            onChange={handleFechaChange}
            className="font-brinnan"
            style={{
              ...inputBase,
              paddingRight: '10px',
              background: esHoy ? '#42261a' : 'rgba(255,255,255,0.9)',
              color: esHoy ? '#fff1d2' : '#42261a',
              border: esHoy ? '1.5px solid #42261a' : '1.5px solid rgba(66,38,26,0.3)',
              borderRadius: '10px',
              fontSize: '0.8rem',
              // Ovewrite el color del placeholder del input date en webkit
              colorScheme: esHoy ? 'dark' : 'light',
            }}
          />
        </div>

        {/* Botón "Hoy" si no está en hoy */}
        {!esHoy && (
          <button
            onClick={() => { setFechaSeleccionada(hoy); setPedidosFecha(null) }}
            className="font-brinnan"
            style={{
              padding: '5px 12px', borderRadius: '20px', fontSize: '0.75rem',
              border: '1.5px solid #eb1e55', background: 'transparent',
              color: '#eb1e55', cursor: 'pointer',
            }}
          >
            ← Hoy
          </button>
        )}

        {/* Loading spinner para fechas anteriores */}
        {loadingFecha && (
          <span className="font-brinnan" style={{ fontSize: '0.75rem', color: 'rgba(66,38,26,0.45)' }}>
            ⏳ Cargando...
          </span>
        )}
      </div>

      {/* ── Sub-tabs: Lista / Estadísticas ───────────────────────────────── */}
      <div style={{ display: 'flex', gap: '6px', paddingBottom: '4px', borderBottom: '1px solid rgba(66,38,26,0.12)' }}>
        {['lista', 'estadisticas'].map(s => (
          <button
            key={s}
            onClick={() => setSeccion(s)}
            className="font-brinnan"
            style={{
              padding: '6px 14px', borderRadius: '20px',
              border: seccion === s ? '2px solid #42261a' : '2px solid rgba(66,38,26,0.2)',
              background: seccion === s ? '#42261a' : 'rgba(255,255,255,0.6)',
              color: seccion === s ? '#fff1d2' : '#42261a',
              fontSize: '0.8rem', cursor: 'pointer',
            }}
          >
            {s === 'lista' ? '📋 Lista' : '📊 Estadísticas'}
          </button>
        ))}
      </div>

      {/* ── Contenido principal ───────────────────────────────────────────── */}
      {seccion === 'estadisticas' ? (
        <>
          {/* Filtro sede */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {SEDES.map(s => (
              <button
                key={s}
                onClick={() => setFiltroSede(s)}
                className="font-brinnan"
                style={{
                  padding: '4px 10px', borderRadius: '16px', fontSize: '0.75rem',
                  border: filtroSede === s ? '2px solid #42261a' : '2px solid rgba(66,38,26,0.2)',
                  background: filtroSede === s ? '#42261a' : 'rgba(255,255,255,0.6)',
                  color: filtroSede === s ? '#fff1d2' : '#42261a',
                  cursor: 'pointer',
                }}
              >
                {s}
              </button>
            ))}
          </div>
          <EstadisticasDia pedidos={pedidosParaStats} />
        </>
      ) : (
        <>
          {/* Filtros */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o #pedido..."
              className="font-brinnan"
              style={{
                flex: '1 1 180px', padding: '7px 12px', borderRadius: '10px',
                border: '1.5px solid rgba(66,38,26,0.2)', fontSize: '0.8rem',
                background: 'rgba(255,255,255,0.8)', color: '#42261a', outline: 'none',
              }}
            />
            <select value={filtroSede} onChange={e => setFiltroSede(e.target.value)}
              className="font-brinnan" style={inputBase}>
              {SEDES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
              className="font-brinnan" style={inputBase}>
              {ESTADOS.map(s => (
                <option key={s} value={s}>
                  {s === 'Todos' ? 'Todos los estados' : ESTADO_LABELS[s] || s}
                </option>
              ))}
            </select>
          </div>

          {/* Contador */}
          <p className="font-brinnan" style={{ fontSize: '0.78rem', color: 'rgba(66,38,26,0.5)' }}>
            {pedidosFiltrados.length} pedido{pedidosFiltrados.length !== 1 ? 's' : ''} — {labelFecha(fechaSeleccionada)}
          </p>

          {/* Lista */}
          {pedidosFiltrados.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'rgba(66,38,26,0.35)' }}>
              <p style={{ fontSize: '2rem', marginBottom: '8px' }}>📭</p>
              <p className="font-healing" style={{ fontSize: '1rem' }}>
                Sin pedidos el {labelFecha(fechaSeleccionada).toLowerCase()}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {pedidosFiltrados.map(p => (
                <div key={p.id} style={{
                  background: '#fff', borderRadius: '10px',
                  boxShadow: '0 1px 6px rgba(66,38,26,0.07)',
                  borderLeft: `4px solid ${ESTADO_COLORS[p.estado] || '#42261a'}`,
                  padding: '10px 14px',
                  display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className="font-chreed" style={{ fontSize: '0.9rem', color: '#42261a' }}>
                      #{numeroPedido(p.id)}
                    </span>
                    <span className="font-brinnan" style={{ fontSize: '0.75rem', color: 'rgba(66,38,26,0.55)' }}>
                      {formatHora(p.created_at)}
                    </span>
                    <span style={{
                      background: '#42261a', color: '#fff1d2', borderRadius: '8px',
                      padding: '1px 7px', fontSize: '0.68rem', fontFamily: 'Brinnan',
                    }}>
                      {p.sede}
                    </span>
                    <span className="font-brinnan" style={{ fontSize: '0.82rem', color: '#42261a' }}>
                      {p.cliente_nombre}
                    </span>
                    <span className="font-brinnan" style={{ fontSize: '0.75rem', color: 'rgba(66,38,26,0.5)' }}>
                      {(p.productos || []).map(pr => `${pr.cantidad}× ${pr.nombre}`).join(', ')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span className="font-chreed" style={{ fontSize: '0.95rem', color: '#42261a' }}>
                      {formatCOP(p.total)}
                    </span>
                    <span style={{
                      background: ESTADO_COLORS[p.estado] || '#42261a',
                      color: '#fff', borderRadius: '8px', padding: '2px 8px',
                      fontSize: '0.7rem', fontFamily: 'Brinnan',
                    }}>
                      {ESTADO_LABELS[p.estado] || p.estado}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
