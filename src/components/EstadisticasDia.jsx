function formatCOP(n) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n)
}

const METODO_LABELS = { nequi: 'Nequi 📱', bancolombia: 'Bancolombia 🏦', efectivo: 'Efectivo 💵' }
const SEDES = ['Aurora', 'Lagos', 'Mutis', 'Piedecuesta']

export default function EstadisticasDia({ pedidos }) {
  if (!pedidos || pedidos.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(66,38,26,0.4)' }}>
        <p className="font-brinnan" style={{ fontSize: '1.1rem' }}>Sin pedidos hoy todavía</p>
      </div>
    )
  }

  const total = pedidos.reduce((s, p) => s + (p.total || 0), 0)
  const promedio = total / pedidos.length

  // Por sede
  const porSede = SEDES.map(sede => ({
    sede,
    count: pedidos.filter(p => p.sede === sede).length,
    total: pedidos.filter(p => p.sede === sede).reduce((s, p) => s + (p.total || 0), 0),
  })).filter(s => s.count > 0)

  // Por método de pago
  const metodos = ['nequi', 'bancolombia', 'efectivo']
  const porMetodo = metodos.map(m => ({
    metodo: m,
    count: pedidos.filter(p => p.metodo_pago === m).length,
    total: pedidos.filter(p => p.metodo_pago === m).reduce((s, p) => s + (p.total || 0), 0),
  })).filter(m => m.count > 0)

  // Producto más vendido
  const conteoProductos = {}
  pedidos.forEach(p => {
    (p.productos || []).forEach(prod => {
      const k = prod.nombre
      conteoProductos[k] = (conteoProductos[k] || 0) + (prod.cantidad || 1)
    })
  })
  const productoTop = Object.entries(conteoProductos).sort((a, b) => b[1] - a[1])[0]

  const cardStyle = {
    background: '#fff', borderRadius: '12px',
    padding: '16px 18px', boxShadow: '0 2px 12px rgba(66,38,26,0.08)',
    marginBottom: '0',
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>

      {/* Total pedidos */}
      <div style={cardStyle}>
        <p className="font-brinnan" style={{ fontSize: '0.75rem', color: 'rgba(66,38,26,0.55)', marginBottom: '6px' }}>Total pedidos</p>
        <p className="font-brinnan" style={{ fontSize: '2rem', color: '#eb1e55' }}>{pedidos.length}</p>
      </div>

      {/* Total ventas */}
      <div style={cardStyle}>
        <p className="font-brinnan" style={{ fontSize: '0.75rem', color: 'rgba(66,38,26,0.55)', marginBottom: '6px' }}>Total ventas</p>
        <p className="font-brinnan" style={{ fontSize: '1.5rem', color: '#42261a' }}>{formatCOP(total)}</p>
      </div>

      {/* Promedio por pedido */}
      <div style={cardStyle}>
        <p className="font-brinnan" style={{ fontSize: '0.75rem', color: 'rgba(66,38,26,0.55)', marginBottom: '6px' }}>Promedio / pedido</p>
        <p className="font-brinnan" style={{ fontSize: '1.5rem', color: '#42261a' }}>{formatCOP(promedio)}</p>
      </div>

      {/* Producto top */}
      {productoTop && (
        <div style={cardStyle}>
          <p className="font-brinnan" style={{ fontSize: '0.75rem', color: 'rgba(66,38,26,0.55)', marginBottom: '6px' }}>⭐ Producto top</p>
          <p className="font-brinnan" style={{ fontSize: '0.95rem', color: '#42261a', lineHeight: 1.3 }}>{productoTop[0]}</p>
          <p className="font-brinnan" style={{ fontSize: '0.78rem', color: '#eb1e55' }}>{productoTop[1]} und</p>
        </div>
      )}

      {/* Por sede */}
      {porSede.length > 0 && (
        <div style={{ ...cardStyle, gridColumn: 'span 2' }}>
          <p className="font-brinnan" style={{ fontSize: '0.75rem', color: 'rgba(66,38,26,0.55)', marginBottom: '10px' }}>📍 Por sede</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {porSede.map(s => (
              <div key={s.sede} style={{
                background: 'rgba(66,38,26,0.05)', borderRadius: '8px', padding: '6px 10px',
              }}>
                <p className="font-brinnan" style={{ fontSize: '0.85rem', color: '#42261a' }}>{s.sede}</p>
                <p className="font-brinnan" style={{ fontSize: '0.75rem', color: 'rgba(66,38,26,0.6)' }}>
                  {s.count} pedido{s.count !== 1 ? 's' : ''} · {formatCOP(s.total)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Por método de pago */}
      {porMetodo.length > 0 && (
        <div style={{ ...cardStyle, gridColumn: 'span 2' }}>
          <p className="font-brinnan" style={{ fontSize: '0.75rem', color: 'rgba(66,38,26,0.55)', marginBottom: '10px' }}>💳 Por método de pago</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {porMetodo.map(m => (
              <div key={m.metodo} style={{
                background: 'rgba(66,38,26,0.05)', borderRadius: '8px', padding: '6px 10px',
              }}>
                <p className="font-brinnan" style={{ fontSize: '0.83rem', color: '#42261a' }}>{METODO_LABELS[m.metodo] || m.metodo}</p>
                <p className="font-brinnan" style={{ fontSize: '0.75rem', color: 'rgba(66,38,26,0.6)' }}>
                  {m.count} pedido{m.count !== 1 ? 's' : ''} · {formatCOP(m.total)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
