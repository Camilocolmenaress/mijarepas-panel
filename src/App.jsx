import { useState } from 'react'
import usePedidos from './hooks/usePedidos'
import KanbanBoard from './components/KanbanBoard'
import Historial from './components/Historial'
import FiltroSede from './components/FiltroSede'
import PromocionesPanel from './components/PromocionesPanel'
import './index.css'

export default function App() {
  const [tab, setTab] = useState('pedidos')       // 'pedidos' | 'historial' | 'promos'
  const [sedeActiva, setSedeActiva] = useState('Todas')

  const {
    pedidos,
    pedidosKanban,
    loading,
    flashRecibido,
    avanzarEstado,
    countRecibidos,
  } = usePedidos()

  // Filtrar por sede activa
  const pedidosFiltradosKanban = sedeActiva === 'Todas'
    ? pedidosKanban
    : pedidosKanban.filter(p => p.sede === sedeActiva)

  const pedidosFiltradosHistorial = sedeActiva === 'Todas'
    ? pedidos
    : pedidos.filter(p => p.sede === sedeActiva)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--boleblanco)' }}>

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header style={{
        background: 'var(--terrocana)',
        color: 'var(--boleblanco)',
        padding: '0 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        paddingTop: '12px',
        paddingBottom: '10px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
        flexShrink: 0,
        zIndex: 10,
      }}>
        {/* Fila principal */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Logo + Título */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'var(--fucsebollita)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: '1.2rem' }}>🫓</span>
            </div>
            <div>
              <h1 className="font-chreed" style={{ fontSize: '1.2rem', color: 'var(--boleblanco)', lineHeight: 1 }}>
                Mijarepas
              </h1>
              <p className="font-healing" style={{ fontSize: '0.72rem', color: 'rgba(255,241,210,0.65)', lineHeight: 1 }}>
                Panel de pedidos
              </p>
            </div>
          </div>

          {/* Badge pedidos recibidos */}
          {countRecibidos > 0 && (
            <div style={{
              background: 'var(--fucsebollita)', color: '#fff',
              borderRadius: '20px', padding: '4px 12px',
              display: 'flex', alignItems: 'center', gap: '6px',
              boxShadow: '0 2px 10px rgba(235,30,85,0.4)',
            }}>
              <span style={{ fontSize: '0.85rem' }}>🔴</span>
              <span className="font-brinnan" style={{ fontSize: '0.82rem' }}>
                {countRecibidos} sin atender
              </span>
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {[
              { id: 'pedidos', label: '📋 Pedidos' },
              { id: 'historial', label: '📊 Historial' },
              { id: 'promos', label: '🎉 Promos' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="font-brinnan"
                style={{
                  padding: '6px 12px', borderRadius: '8px', fontSize: '0.78rem',
                  border: 'none', cursor: 'pointer',
                  background: tab === t.id ? 'rgba(255,241,210,0.2)' : 'transparent',
                  color: tab === t.id ? 'var(--boleblanco)' : 'rgba(255,241,210,0.55)',
                  transition: 'all 0.15s',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filtro de sede */}
        <FiltroSede sedeActiva={sedeActiva} onChange={setSedeActiva} />
      </header>

      {/* ── CONTENIDO ──────────────────────────────────────────────────── */}
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '12px 12px 0' }}>
        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                border: '3px solid rgba(66,38,26,0.15)',
                borderTop: '3px solid var(--fucsebollita)',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 12px',
              }} />
              <p className="font-healing" style={{ color: 'rgba(66,38,26,0.5)' }}>Cargando pedidos...</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          </div>
        ) : tab === 'pedidos' ? (
          <KanbanBoard
            pedidos={pedidosFiltradosKanban}
            onAvanzar={avanzarEstado}
            flashRecibido={flashRecibido}
          />
        ) : tab === 'historial' ? (
          <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '16px' }} className="kanban-col">
            <Historial pedidos={pedidosFiltradosHistorial} sedeGlobal={sedeActiva} />
          </div>
        ) : (
          <PromocionesPanel />
        )}
      </main>
    </div>
  )
}
