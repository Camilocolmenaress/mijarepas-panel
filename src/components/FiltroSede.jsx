const SEDES = ['Todas', 'Aurora', 'Lagos', 'Mutis', 'Piedecuesta']

export default function FiltroSede({ sedeActiva, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
      {SEDES.map(s => {
        const activo = sedeActiva === s
        return (
          <button
            key={s}
            onClick={() => onChange(s)}
            className="font-brinnan"
            style={{
              padding: '5px 12px',
              borderRadius: '20px',
              border: activo ? '2px solid #42261a' : '2px solid rgba(66,38,26,0.25)',
              background: activo ? '#42261a' : 'rgba(255,255,255,0.6)',
              color: activo ? '#fff1d2' : '#42261a',
              fontSize: '0.78rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
            }}
          >
            {s === 'Todas' ? '📍 Todas' : s}
          </button>
        )
      })}
    </div>
  )
}
