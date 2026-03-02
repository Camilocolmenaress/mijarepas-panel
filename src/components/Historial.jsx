import { useState, useMemo } from 'react'
import EstadisticasDia from './EstadisticasDia'

function formatHora(iso) {
  return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true })
}
function formatCOP(n) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n)
}
function numeroPedido(id) {
  return id ? id.slice(-4).toUpperCase() : '????'
}

const ESTADO_COLORS = {
  recibido:       '#eb1e55',
  en_preparacion: '#f9ac31',
  listo:          '#007d3e',
  entregado:      '#00afec',
}
const ESTADO_LABELS = {
  recibido: 'Recibido',
  en_preparacion: 'En prep.',
  listo: 'Listo',
  entregado: 'Entregado',
}
const SEDES = ['Todas', 'Aurora', 'Lagos', 'Mutis', 'Piedecuesta']
const ESTADOS = ['Todos', 'recibido', 'en_preparacion', 'listo', 'entregado']

export default function Historial({ pedidos, sedeGlobal }) {
  const [filtroSede, setFiltroSede] = useState(sedeGlobal || 'Todas')
  const [filtroEstado, setFiltroEstado] = useState('Todos')
  const [busqueda, setBusqueda] = useState('')
  const [seccion, setSeccion] = useState('lista') // 'lista' | 'estadisticas'

  const pedidosFiltrados = useMemo(() => {
    return pedidos.filter(p => {
      if (filtroSede !== 'Todas' && p.sede !== filtroSede) return false
      if (filtroEstado !== 'Todos' && p.estado !== filtroEstado) return false
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase()
        const matchNombre = p.cliente_nombre?.toLowerCase().includes(q)
        const matchId = numeroPedido(p.id).toLowerCase().includes(q)
        if (!matchNombre && !matchId) return false
      }
      return true
    })
  }, [pedidos, filtroSede, filtroEstado, busqueda])

  const pedidosParaStats = useMemo(() => {
    return pedidos.filter(p => filtroSede === 'Todas' || p.sede === filtroSede)
  }, [pedidos, filtroSede])

  return (
    <div style={{ padding: '0', display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* Sub-tabs: Lista / Estadísticas */}
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

      {seccion === 'estadisticas' ? (
        <>
          {/* Filtro sede para estadísticas */}
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
            {/* Buscador */}
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
            {/* Sede */}
            <select
              value={filtroSede}
              onChange={e => setFiltroSede(e.target.value)}
              className="font-brinnan"
              style={{
                padding: '7px 10px', borderRadius: '10px', fontSize: '0.78rem',
                border: '1.5px solid rgba(66,38,26,0.2)', background: 'rgba(255,255,255,0.8)',
                color: '#42261a', cursor: 'pointer',
              }}
            >
              {SEDES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {/* Estado */}
            <select
              value={filtroEstado}
              onChange={e => setFiltroEstado(e.target.value)}
              className="font-brinnan"
              style={{
                padding: '7px 10px', borderRadius: '10px', fontSize: '0.78rem',
                border: '1.5px solid rgba(66,38,26,0.2)', background: 'rgba(255,255,255,0.8)',
                color: '#42261a', cursor: 'pointer',
              }}
            >
              {ESTADOS.map(s => (
                <option key={s} value={s}>
                  {s === 'Todos' ? 'Todos los estados' : ESTADO_LABELS[s] || s}
                </option>
              ))}
            </select>
          </div>

          {/* Contador */}
          <p className="font-brinnan" style={{ fontSize: '0.78rem', color: 'rgba(66,38,26,0.5)' }}>
            {pedidosFiltrados.length} pedido{pedidosFiltrados.length !== 1 ? 's' : ''} encontrado{pedidosFiltrados.length !== 1 ? 's' : ''}
          </p>

          {/* Tabla / Lista */}
          {pedidosFiltrados.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'rgba(66,38,26,0.35)' }}>
              <p className="font-healing" style={{ fontSize: '1rem' }}>Sin resultados</p>
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
                    <span className="font-chreed" style={{ fontSize: '0.9rem', color: '#42261a' }}>#{numeroPedido(p.id)}</span>
                    <span className="font-brinnan" style={{ fontSize: '0.75rem', color: 'rgba(66,38,26,0.55)' }}>{formatHora(p.created_at)}</span>
                    <span style={{
                      background: '#42261a', color: '#fff1d2', borderRadius: '8px',
                      padding: '1px 7px', fontSize: '0.68rem', fontFamily: 'Brinnan',
                    }}>
                      {p.sede}
                    </span>
                    <span className="font-brinnan" style={{ fontSize: '0.82rem', color: '#42261a' }}>{p.cliente_nombre}</span>
                    <span className="font-brinnan" style={{ fontSize: '0.75rem', color: 'rgba(66,38,26,0.5)' }}>
                      {(p.productos || []).map(pr => `${pr.cantidad}× ${pr.nombre}`).join(', ')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span className="font-chreed" style={{ fontSize: '0.95rem', color: '#42261a' }}>{formatCOP(p.total)}</span>
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
