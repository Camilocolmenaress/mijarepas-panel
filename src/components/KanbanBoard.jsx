import { useState } from 'react'
import ColumnaEstado from './ColumnaEstado'

const ESTADOS = ['recibido', 'en_preparacion', 'listo', 'entregado']
const ESTADO_LABELS = {
  recibido: 'Recibido 🔴',
  en_preparacion: 'Preparando 🟡',
  listo: 'Listo 🟢',
  entregado: 'Entregado ✅',
}

export default function KanbanBoard({ pedidos, onAvanzar, flashRecibido }) {
  const [tabMovil, setTabMovil] = useState('recibido')

  const porEstado = (estado) =>
    pedidos.filter(p => p.estado === estado)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))

  return (
    <>
      {/* ── Vista Desktop/Tablet: 4 columnas ── */}
      <div style={{
        display: 'none',
        gap: '12px',
        flex: 1,
        overflowX: 'auto',
        padding: '12px 0 12px',
        alignItems: 'stretch',
      }}
        className="kanban-desktop"
      >
        {ESTADOS.map(e => (
          <ColumnaEstado
            key={e}
            estado={e}
            pedidos={porEstado(e)}
            onAvanzar={onAvanzar}
            flash={flashRecibido}
          />
        ))}
      </div>

      {/* ── Vista Móvil: tabs ── */}
      <div className="kanban-mobile" style={{ flex: 1, display: 'none', flexDirection: 'column' }}>
        {/* Tabs */}
        <div style={{
          display: 'flex', gap: '4px', overflowX: 'auto',
          padding: '4px 0 8px', borderBottom: '1px solid rgba(66,38,26,0.12)',
          marginBottom: '8px',
        }}>
          {ESTADOS.map(e => (
            <button
              key={e}
              onClick={() => setTabMovil(e)}
              className="font-brinnan"
              style={{
                padding: '6px 12px',
                borderRadius: '20px',
                border: tabMovil === e ? '2px solid #42261a' : '2px solid rgba(66,38,26,0.2)',
                background: tabMovil === e ? '#42261a' : 'rgba(255,255,255,0.6)',
                color: tabMovil === e ? '#fff1d2' : '#42261a',
                fontSize: '0.75rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {ESTADO_LABELS[e]}
              {' '}
              <span style={{
                background: tabMovil === e ? 'rgba(255,255,255,0.25)' : 'rgba(66,38,26,0.12)',
                borderRadius: '10px', padding: '0 5px',
              }}>
                {porEstado(e).length}
              </span>
            </button>
          ))}
        </div>
        {/* Columna activa */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <ColumnaEstado
            estado={tabMovil}
            pedidos={porEstado(tabMovil)}
            onAvanzar={onAvanzar}
            flash={flashRecibido}
          />
        </div>
      </div>

      {/* CSS responsive inline (solo una vez) */}
      <style>{`
        @media (min-width: 768px) {
          .kanban-desktop { display: flex !important; }
          .kanban-mobile  { display: none  !important; }
        }
        @media (max-width: 767px) {
          .kanban-desktop { display: none  !important; }
          .kanban-mobile  { display: flex  !important; }
        }
      `}</style>
    </>
  )
}
