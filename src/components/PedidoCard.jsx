// Helpers
function formatHora(isoString) {
  const d = new Date(isoString)
  return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function formatCOP(n) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n)
}

function numeroPedido(id) {
  return id ? id.slice(-4).toUpperCase() : '????'
}

const ESTADO_CONFIG = {
  recibido:       { color: '#eb1e55', label: 'Recibido',        btnLabel: 'Preparar →',   btnColor: '#f9ac31', emoji: '🔴' },
  en_preparacion: { color: '#f9ac31', label: 'En preparación',  btnLabel: 'Marcar Listo →', btnColor: '#007d3e', emoji: '🟡' },
  listo:          { color: '#007d3e', label: 'Listo',           btnLabel: 'Entregado ✓',  btnColor: '#00afec', emoji: '🟢' },
  entregado:      { color: '#00afec', label: 'Entregado',       btnLabel: null,            btnColor: null,     emoji: '✅' },
}

const METODO_LABELS = { nequi: 'Nequi 📱', bancolombia: 'Bancolombia 🏦', efectivo: 'Efectivo 💵' }

export default function PedidoCard({ pedido, onAvanzar }) {
  const cfg = ESTADO_CONFIG[pedido.estado] || ESTADO_CONFIG.recibido
  const isRecibido = pedido.estado === 'recibido'

  return (
    <div
      className={isRecibido ? 'pedido-recibido' : ''}
      style={{
        background: '#fff',
        borderRadius: '12px',
        borderLeft: `5px solid ${cfg.color}`,
        boxShadow: '0 2px 12px rgba(66,38,26,0.10)',
        overflow: 'hidden',
        marginBottom: '10px',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 12px 8px',
        borderBottom: '1px solid rgba(66,38,26,0.08)',
        background: 'rgba(66,38,26,0.03)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="font-brinnan" style={{ fontSize: '1.05rem', color: '#42261a' }}>
            #{numeroPedido(pedido.id)}
          </span>
          <span style={{
            background: '#42261a', color: '#fff1d2', borderRadius: '10px',
            padding: '2px 8px', fontSize: '0.7rem', fontFamily: 'Brinnan',
          }}>
            📍 {pedido.sede}
          </span>
        </div>
        <span className="font-brinnan" style={{ fontSize: '0.78rem', color: 'rgba(66,38,26,0.6)' }}>
          {formatHora(pedido.created_at)}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: '10px 12px' }}>
        {/* Cliente */}
        <div style={{ marginBottom: '8px' }}>
          <p className="font-brinnan" style={{ fontSize: '1rem', color: '#42261a', lineHeight: 1.3 }}>
            {pedido.cliente_nombre}
          </p>
          <p className="font-brinnan" style={{ fontSize: '0.78rem', color: 'rgba(66,38,26,0.65)' }}>
            📞 {pedido.cliente_telefono}
          </p>
        </div>

        {/* Dirección */}
        <div style={{ marginBottom: '8px', padding: '6px 8px', background: 'rgba(66,38,26,0.04)', borderRadius: '8px' }}>
          <p className="font-brinnan" style={{ fontSize: '0.78rem', color: '#42261a', lineHeight: 1.4 }}>
            📍 {pedido.direccion}
          </p>
          {pedido.especificaciones && (
            <p className="font-brinnan" style={{ fontSize: '0.74rem', color: 'rgba(66,38,26,0.65)', marginTop: '3px', lineHeight: 1.4 }}>
              📝 {pedido.especificaciones}
            </p>
          )}
        </div>

        {/* Productos */}
        <div style={{ marginBottom: '8px' }}>
          {(pedido.productos || []).map((p, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
              <span className="font-brinnan" style={{ fontSize: '0.8rem', color: '#42261a', lineHeight: 1.35, flex: 1, paddingRight: '8px' }}>
                <span style={{ fontFamily: 'Brinnan', fontSize: '0.85rem', color: '#eb1e55' }}>{p.cantidad}×</span>{' '}
                {p.nombre}
                {p.notas ? <span style={{ color: 'rgba(66,38,26,0.5)', fontSize: '0.72rem' }}> · {p.notas}</span> : null}
              </span>
              <span className="font-brinnan" style={{ fontSize: '0.75rem', color: 'rgba(66,38,26,0.55)', whiteSpace: 'nowrap' }}>
                {formatCOP(p.subtotal)}
              </span>
            </div>
          ))}
        </div>

        {/* Salsas / servilletas */}
        {(pedido.salsas && pedido.salsas.length > 0) && (
          <p className="font-brinnan" style={{ fontSize: '0.74rem', color: 'rgba(66,38,26,0.6)', marginBottom: '4px' }}>
            🫙 Salsas: {Array.isArray(pedido.salsas) ? pedido.salsas.join(', ') : pedido.salsas}
          </p>
        )}
        {pedido.servilletas && (
          <p className="font-brinnan" style={{ fontSize: '0.74rem', color: 'rgba(66,38,26,0.6)', marginBottom: '4px' }}>
            🧻 Con servilletas
          </p>
        )}
        {pedido.notas && (
          <p className="font-brinnan" style={{ fontSize: '0.74rem', color: 'rgba(66,38,26,0.6)', marginBottom: '4px' }}>
            💬 {pedido.notas}
          </p>
        )}
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px 10px',
        borderTop: '1px solid rgba(66,38,26,0.08)',
      }}>
        <div>
          <span className="font-brinnan" style={{ fontSize: '1.1rem', color: '#42261a' }}>
            {formatCOP(pedido.total)}
          </span>
          <span className="font-brinnan" style={{ fontSize: '0.72rem', color: 'rgba(66,38,26,0.5)', marginLeft: '6px' }}>
            {METODO_LABELS[pedido.metodo_pago] || pedido.metodo_pago}
          </span>
        </div>
        {cfg.btnLabel && (
          <button
            onClick={() => onAvanzar(pedido.id, pedido.estado)}
            className="font-brinnan"
            style={{
              background: cfg.btnColor, color: '#fff',
              border: 'none', borderRadius: '8px',
              padding: '6px 12px', fontSize: '0.78rem',
              cursor: 'pointer',
              boxShadow: `0 2px 8px ${cfg.btnColor}60`,
              transition: 'opacity 0.15s',
            }}
          >
            {cfg.btnLabel}
          </button>
        )}
      </div>
    </div>
  )
}
