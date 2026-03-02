import PedidoCard from './PedidoCard'

const ESTADO_INFO = {
  recibido:       { label: 'Recibido',       emoji: '🔴', color: '#eb1e55', bg: 'rgba(235,30,85,0.07)' },
  en_preparacion: { label: 'En preparación', emoji: '🟡', color: '#f9ac31', bg: 'rgba(249,172,49,0.07)' },
  listo:          { label: 'Listo',          emoji: '🟢', color: '#007d3e', bg: 'rgba(0,125,62,0.07)'  },
  entregado:      { label: 'Entregado',      emoji: '✅', color: '#00afec', bg: 'rgba(0,175,236,0.07)' },
}

export default function ColumnaEstado({ estado, pedidos, onAvanzar, flash }) {
  const info = ESTADO_INFO[estado]

  return (
    <div
      style={{
        flex: '1 1 0',
        minWidth: '220px',
        maxWidth: '320px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header columna */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '10px 12px',
        borderRadius: '10px 10px 0 0',
        background: info.bg,
        borderBottom: `2px solid ${info.color}`,
        marginBottom: '2px',
      }}>
        <span style={{ fontSize: '1.1rem' }}>{info.emoji}</span>
        <span className="font-healing" style={{ fontSize: '1rem', color: '#42261a' }}>{info.label}</span>
        <span style={{
          marginLeft: 'auto', background: info.color, color: '#fff',
          borderRadius: '12px', padding: '1px 8px', fontSize: '0.78rem',
          fontFamily: 'Brinnan',
        }}>
          {pedidos.length}
        </span>
      </div>

      {/* Tarjetas scrolleables */}
      <div
        className={`kanban-col${flash && estado === 'recibido' ? ' column-flash' : ''}`}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 4px 8px 4px',
          minHeight: '120px',
          borderRadius: '0 0 10px 10px',
          background: info.bg,
        }}
      >
        {pedidos.length === 0 ? (
          <p className="font-brinnan" style={{
            textAlign: 'center', color: 'rgba(66,38,26,0.35)',
            fontSize: '0.78rem', paddingTop: '24px',
          }}>
            Sin pedidos
          </p>
        ) : (
          pedidos.map(p => (
            <PedidoCard key={p.id} pedido={p} onAvanzar={onAvanzar} />
          ))
        )}
      </div>
    </div>
  )
}
