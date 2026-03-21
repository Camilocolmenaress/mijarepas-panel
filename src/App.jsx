import { useState } from 'react'
import usePedidos from './hooks/usePedidos'
import KanbanBoard from './components/KanbanBoard'
import Historial from './components/Historial'
import FiltroSede from './components/FiltroSede'
import PromocionesPanel from './components/PromocionesPanel'
import './index.css'

const PANEL_PASS = 'mijarepas2026'

/* ── Pantalla de Login ──────────────────────────────────────────────────────── */
function LoginScreen({ onAuth }) {
  const [pass, setPass] = useState('')
  const [error, setError] = useState(false)

  const handleLogin = () => {
    if (pass === PANEL_PASS) {
      sessionStorage.setItem('mija_panel_auth', '1')
      onAuth()
    } else {
      setError(true)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh', background: '#42261a',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ textAlign: 'center', width: '100%', maxWidth: '340px', padding: '0 24px' }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '20px',
          background: '#eb1e55', margin: '0 auto 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: '2.5rem' }}>🫓</span>
        </div>
        <h1 className="font-brinnan" style={{ fontSize: '1.8rem', color: '#fff1d2', marginBottom: '4px' }}>
          Mijarepas
        </h1>
        <p className="font-brinnan" style={{ fontSize: '0.85rem', color: 'rgba(255,241,210,0.5)', marginBottom: '32px' }}>
          Panel de pedidos
        </p>

        <input
          type="password"
          value={pass}
          onChange={e => { setPass(e.target.value); setError(false) }}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          placeholder="Contraseña"
          className="font-brinnan"
          autoFocus
          style={{
            width: '100%', padding: '14px 16px', fontSize: '1rem',
            borderRadius: '12px', border: `2px solid ${error ? '#eb1e55' : 'rgba(255,241,210,0.25)'}`,
            background: 'rgba(255,255,255,0.1)', color: '#fff1d2',
            outline: 'none', boxSizing: 'border-box',
            marginBottom: '8px',
          }}
        />

        {error && (
          <p className="font-brinnan" style={{ color: '#eb1e55', fontSize: '0.8rem', marginBottom: '8px' }}>
            Contraseña incorrecta
          </p>
        )}

        <button
          onClick={handleLogin}
          className="font-brinnan"
          style={{
            width: '100%', padding: '14px', fontSize: '1rem',
            borderRadius: '12px', border: 'none',
            background: '#eb1e55', color: '#fff', cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(235,30,85,0.4)',
            marginTop: '4px',
          }}
        >
          Entrar
        </button>
      </div>
    </div>
  )
}

export default function App() {
  const [isAuth, setIsAuth] = useState(() => sessionStorage.getItem('mija_panel_auth') === '1')
  const [tab, setTab] = useState('pedidos')       // 'pedidos' | 'historial' | 'promos'
  const [sedeActiva, setSedeActiva] = useState('Todas')

  const {
    pedidos,
    pedidosKanban,
    loading,
    flashRecibido,
    avanzarEstado,
    countRecibidos,
    isMuted,
    silenciar,
    conexionOk,
    isOnline,
    alertaActiva,
    confirmarAlerta,
  } = usePedidos()

  if (!isAuth) return <LoginScreen onAuth={() => setIsAuth(true)} />

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
              <h1 className="font-brinnan" style={{ fontSize: '1.2rem', color: 'var(--boleblanco)', lineHeight: 1 }}>
                Mijarepas
              </h1>
              <p className="font-brinnan" style={{ fontSize: '0.72rem', color: 'rgba(255,241,210,0.65)', lineHeight: 1 }}>
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

          {/* Botón silenciar alarma */}
          {countRecibidos > 0 && (
            <button
              onClick={silenciar}
              className="font-brinnan"
              style={{
                padding: '4px 10px', borderRadius: '16px', fontSize: '0.78rem',
                border: '1.5px solid rgba(255,241,210,0.35)', cursor: 'pointer',
                background: isMuted ? 'rgba(255,241,210,0.15)' : 'transparent',
                color: 'var(--boleblanco)',
                opacity: isMuted ? 0.6 : 1,
              }}
            >
              {isMuted ? '🔇 Silenciado' : '🔇 Silenciar'}
            </button>
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

      {/* ── BANNER DE CONEXIÓN ────────────────────────────────────────── */}
      {(!isOnline || !conexionOk) && (
        <div
          className="font-brinnan"
          style={{
            background: '#E12B4E',
            color: '#fff',
            padding: '10px 16px',
            textAlign: 'center',
            fontSize: '0.82rem',
            lineHeight: 1.4,
            flexShrink: 0,
          }}
        >
          {!isOnline
            ? '⚠️ Sin conexión a internet. Verifica tu conexión.'
            : '⚠️ Sin conexión al servidor. Los pedidos nuevos no se mostrarán hasta que se restablezca la conexión.'}
        </div>
      )}

      {/* ── BANNER DE ALERTA NUEVO PEDIDO ─────────────────────────────── */}
      {alertaActiva && (
        <div
          onClick={confirmarAlerta}
          className="font-brinnan alerta-parpadeo"
          style={{
            position: 'fixed', top: 0, left: 0, right: 0,
            zIndex: 9999,
            background: '#E12B4E', color: '#fff',
            padding: '16px 20px',
            textAlign: 'center',
            fontSize: '1.1rem',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(225,43,78,0.5)',
          }}
        >
          🔔 NUEVO PEDIDO — Toca para confirmar
        </div>
      )}
      <style>{`
        @keyframes parpadeo {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .alerta-parpadeo {
          animation: parpadeo 1s ease-in-out infinite;
        }
      `}</style>

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
              <p className="font-brinnan" style={{ color: 'rgba(66,38,26,0.5)' }}>Cargando pedidos...</p>
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
