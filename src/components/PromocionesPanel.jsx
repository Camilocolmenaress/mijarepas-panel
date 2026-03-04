import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const EMPTY_FORM = {
  titulo: '',
  descripcion: '',
  precio: '',
  precio_original: '',
  imagen_url: '',
  fecha_inicio: '',
  fecha_fin: '',
  activa: true,
}

function formatCOP(n) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n)
}

export default function PromocionesPanel() {
  const [promos, setPromos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const fileInputRef = useRef(null)

  // ── Cargar promos ──
  const fetchPromos = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('promociones')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setPromos(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchPromos() }, [])

  // ── Subir imagen a Supabase Storage ──
  const subirImagen = async (file) => {
    const fileName = `promo-${Date.now()}-${file.name}`
    const { data, error } = await supabase.storage
      .from('promociones')
      .upload(fileName, file)
    if (error) throw error
    return `https://whqgocniizugylxcyznd.supabase.co/storage/v1/object/public/promociones/${fileName}`
  }

  // ── Eliminar imagen del bucket ──
  const eliminarImagenStorage = async (url) => {
    if (!url || !url.includes('/storage/v1/object/public/promociones/')) return
    const fileName = url.split('/storage/v1/object/public/promociones/')[1]
    if (fileName) {
      await supabase.storage.from('promociones').remove([fileName])
    }
  }

  // ── Seleccionar archivo de imagen ──
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  // ── Abrir form nueva ──
  const handleNueva = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setImageFile(null)
    setImagePreview(null)
    setShowForm(true)
  }

  // ── Abrir form editar ──
  const handleEditar = (promo) => {
    setForm({
      titulo: promo.titulo || '',
      descripcion: promo.descripcion || '',
      precio: promo.precio || '',
      precio_original: promo.precio_original || '',
      imagen_url: promo.imagen_url || '',
      fecha_inicio: promo.fecha_inicio || '',
      fecha_fin: promo.fecha_fin || '',
      activa: promo.activa ?? true,
    })
    setEditingId(promo.id)
    setImageFile(null)
    setImagePreview(promo.imagen_url || null)
    setShowForm(true)
  }

  // ── Guardar (crear o editar) ──
  const handleGuardar = async () => {
    if (!form.titulo.trim() || !form.descripcion.trim() || !form.precio) return
    setSaving(true)

    let imagenUrl = form.imagen_url.trim() || null

    // Si hay un archivo nuevo, subirlo
    if (imageFile) {
      try {
        // Si editando y ya tenia imagen, eliminar la vieja
        if (editingId && form.imagen_url) {
          await eliminarImagenStorage(form.imagen_url)
        }
        imagenUrl = await subirImagen(imageFile)
      } catch (err) {
        console.error('Error subiendo imagen:', err)
        setSaving(false)
        return
      }
    }

    const row = {
      titulo: form.titulo.trim(),
      descripcion: form.descripcion.trim(),
      precio: Number(form.precio),
      precio_original: form.precio_original ? Number(form.precio_original) : null,
      imagen_url: imagenUrl,
      fecha_inicio: form.fecha_inicio || null,
      fecha_fin: form.fecha_fin || null,
      activa: form.activa,
    }

    if (editingId) {
      await supabase.from('promociones').update(row).eq('id', editingId)
    } else {
      await supabase.from('promociones').insert([row])
    }

    setSaving(false)
    setShowForm(false)
    setEditingId(null)
    setImageFile(null)
    setImagePreview(null)
    fetchPromos()
  }

  // ── Toggle activa ──
  const handleToggleActiva = async (promo) => {
    await supabase.from('promociones').update({ activa: !promo.activa }).eq('id', promo.id)
    fetchPromos()
  }

  // ── Eliminar ──
  const handleEliminar = async (id) => {
    // Eliminar imagen del bucket si existe
    const promo = promos.find(p => p.id === id)
    if (promo?.imagen_url) {
      await eliminarImagenStorage(promo.imagen_url)
    }
    await supabase.from('promociones').delete().eq('id', id)
    setConfirmDelete(null)
    fetchPromos()
  }

  // ── Estilos ──
  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1.5px solid rgba(66,38,26,0.2)',
    fontSize: '0.85rem',
    fontFamily: 'Brinnan, sans-serif',
    color: 'var(--terrocana)',
    background: '#fff',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle = {
    fontSize: '0.75rem',
    color: 'rgba(66,38,26,0.65)',
    marginBottom: '4px',
    display: 'block',
  }

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <p className="font-brinnan" style={{ color: 'rgba(66,38,26,0.5)' }}>Cargando promociones...</p>
      </div>
    )
  }

  // ── FORMULARIO ──
  if (showForm) {
    return (
      <div style={{ padding: '16px', maxWidth: '560px', margin: '0 auto', width: '100%', flex: 1, overflowY: 'auto' }} className="kanban-col">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <button
            onClick={() => { setShowForm(false); setEditingId(null) }}
            style={{
              background: 'rgba(66,38,26,0.1)', border: 'none', borderRadius: '50%',
              width: '34px', height: '34px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem', color: 'var(--terrocana)',
            }}
          >
            ←
          </button>
          <h2 className="font-brinnan" style={{ fontSize: '1.2rem', color: 'var(--terrocana)' }}>
            {editingId ? 'Editar Promocion' : 'Nueva Promocion'}
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: '24px' }}>
          {/* Titulo */}
          <div>
            <label className="font-brinnan" style={labelStyle}>Titulo *</label>
            <input
              type="text"
              value={form.titulo}
              onChange={e => setForm({ ...form, titulo: e.target.value })}
              placeholder="Ej: Combo Ocaña"
              style={inputStyle}
            />
          </div>

          {/* Descripcion */}
          <div>
            <label className="font-brinnan" style={labelStyle}>Descripcion *</label>
            <textarea
              value={form.descripcion}
              onChange={e => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Describe la promocion..."
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', minHeight: '70px' }}
            />
          </div>

          {/* Precios en fila */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label className="font-brinnan" style={labelStyle}>Precio promo *</label>
              <input
                type="number"
                value={form.precio}
                onChange={e => setForm({ ...form, precio: e.target.value })}
                placeholder="15000"
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="font-brinnan" style={labelStyle}>Precio original</label>
              <input
                type="number"
                value={form.precio_original}
                onChange={e => setForm({ ...form, precio_original: e.target.value })}
                placeholder="25000"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Imagen */}
          <div>
            <label className="font-brinnan" style={labelStyle}>Imagen</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />

            {/* Preview */}
            {imagePreview && (
              <div style={{ marginBottom: '8px', position: 'relative', display: 'inline-block' }}>
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{
                    width: '100%',
                    maxHeight: '120px',
                    objectFit: 'cover',
                    borderRadius: '10px',
                    display: 'block',
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null)
                    setImagePreview(null)
                    setForm({ ...form, imagen_url: '' })
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }}
                  style={{
                    position: 'absolute', top: '6px', right: '6px',
                    background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%',
                    width: '26px', height: '26px', color: '#fff', fontSize: '0.8rem',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="font-brinnan"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1.5px dashed rgba(66,38,26,0.25)',
                fontSize: '0.82rem',
                color: 'rgba(66,38,26,0.55)',
                background: 'rgba(66,38,26,0.03)',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              {imagePreview ? 'Cambiar imagen' : 'Subir imagen'}
            </button>
          </div>

          {/* Fechas en fila */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label className="font-brinnan" style={labelStyle}>Fecha inicio</label>
              <input
                type="date"
                value={form.fecha_inicio}
                onChange={e => setForm({ ...form, fecha_inicio: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="font-brinnan" style={labelStyle}>Fecha fin</label>
              <input
                type="date"
                value={form.fecha_fin}
                onChange={e => setForm({ ...form, fecha_fin: e.target.value })}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Toggle activa */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label className="font-brinnan" style={{ fontSize: '0.82rem', color: 'var(--terrocana)' }}>Activa</label>
            <button
              type="button"
              onClick={() => setForm({ ...form, activa: !form.activa })}
              style={{
                width: '44px', height: '24px', borderRadius: '12px',
                border: 'none', cursor: 'pointer', position: 'relative',
                background: form.activa ? 'var(--verdevos)' : '#ccc',
                transition: 'background 0.2s',
              }}
            >
              <span style={{
                position: 'absolute', top: '2px',
                left: form.activa ? '22px' : '2px',
                width: '20px', height: '20px', borderRadius: '50%',
                background: '#fff', transition: 'left 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
            </button>
          </div>

          {/* Boton guardar */}
          <button
            onClick={handleGuardar}
            disabled={saving || !form.titulo.trim() || !form.descripcion.trim() || !form.precio}
            className="font-brinnan"
            style={{
              width: '100%', padding: '14px',
              background: '#E12B4E', color: '#fff',
              border: 'none', borderRadius: '12px',
              fontSize: '1rem', cursor: saving ? 'default' : 'pointer',
              opacity: (saving || !form.titulo.trim() || !form.descripcion.trim() || !form.precio) ? 0.6 : 1,
              transition: 'opacity 0.15s',
              marginTop: '4px',
            }}
          >
            {saving ? 'Guardando...' : (editingId ? 'Guardar cambios' : 'Crear promocion')}
          </button>
        </div>
      </div>
    )
  }

  // ── LISTA ──
  return (
    <div style={{ padding: '12px', flex: 1, overflowY: 'auto' }} className="kanban-col">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h2 className="font-brinnan" style={{ fontSize: '1.1rem', color: 'var(--terrocana)' }}>
          Promociones ({promos.length})
        </h2>
        <button
          onClick={handleNueva}
          className="font-brinnan"
          style={{
            background: '#E12B4E', color: '#fff',
            border: 'none', borderRadius: '10px',
            padding: '8px 16px', fontSize: '0.82rem',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(235,30,85,0.3)',
          }}
        >
          + Nueva Promocion
        </button>
      </div>

      {promos.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🎉</div>
          <p className="font-brinnan" style={{ color: 'rgba(66,38,26,0.5)', fontSize: '0.9rem' }}>
            No hay promociones. Crea la primera.
          </p>
        </div>
      )}

      {/* Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {promos.map(promo => (
          <div
            key={promo.id}
            style={{
              background: '#fff',
              borderRadius: '14px',
              padding: '14px 16px',
              boxShadow: '0 1px 6px rgba(66,38,26,0.08)',
              border: '1px solid rgba(66,38,26,0.08)',
            }}
          >
            {/* Fila superior: titulo + badge */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
              <h3 className="font-brinnan" style={{ fontSize: '1rem', color: 'var(--terrocana)', lineHeight: 1.2 }}>
                {promo.titulo}
              </h3>
              <span
                className="font-brinnan"
                style={{
                  fontSize: '0.68rem',
                  padding: '2px 8px',
                  borderRadius: '50px',
                  color: '#fff',
                  background: promo.activa ? '#007d3e' : '#999',
                  flexShrink: 0,
                  lineHeight: 1.5,
                }}
              >
                {promo.activa ? 'Activa' : 'Inactiva'}
              </span>
            </div>

            {/* Descripcion */}
            <p className="font-brinnan" style={{ fontSize: '0.78rem', color: 'rgba(66,38,26,0.6)', lineHeight: 1.4, marginBottom: '8px' }}>
              {promo.descripcion}
            </p>

            {/* Precios */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              {promo.precio_original && (
                <span className="font-brinnan" style={{ fontSize: '0.78rem', color: '#999', textDecoration: 'line-through' }}>
                  {formatCOP(promo.precio_original)}
                </span>
              )}
              <span className="font-brinnan" style={{ fontSize: '1.05rem', color: 'var(--fucsebollita)' }}>
                {formatCOP(promo.precio)}
              </span>
            </div>

            {/* Fechas */}
            {(promo.fecha_inicio || promo.fecha_fin) && (
              <p className="font-brinnan" style={{ fontSize: '0.7rem', color: 'rgba(66,38,26,0.45)', marginBottom: '8px' }}>
                {promo.fecha_inicio && `Desde: ${promo.fecha_inicio}`}
                {promo.fecha_inicio && promo.fecha_fin && ' — '}
                {promo.fecha_fin && `Hasta: ${promo.fecha_fin}`}
              </p>
            )}

            {/* Acciones */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {/* Toggle activa */}
              <button
                onClick={() => handleToggleActiva(promo)}
                className="font-brinnan"
                style={{
                  padding: '5px 10px', borderRadius: '8px', fontSize: '0.72rem',
                  border: '1px solid rgba(66,38,26,0.15)', cursor: 'pointer',
                  background: promo.activa ? 'rgba(0,125,62,0.08)' : 'rgba(66,38,26,0.05)',
                  color: promo.activa ? '#007d3e' : '#999',
                }}
              >
                {promo.activa ? 'Desactivar' : 'Activar'}
              </button>

              {/* Editar */}
              <button
                onClick={() => handleEditar(promo)}
                className="font-brinnan"
                style={{
                  padding: '5px 10px', borderRadius: '8px', fontSize: '0.72rem',
                  border: '1px solid rgba(66,38,26,0.15)', cursor: 'pointer',
                  background: 'rgba(249,172,49,0.08)', color: '#b87800',
                }}
              >
                Editar
              </button>

              {/* Eliminar */}
              {confirmDelete === promo.id ? (
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <span className="font-brinnan" style={{ fontSize: '0.7rem', color: '#E12B4E' }}>Seguro?</span>
                  <button
                    onClick={() => handleEliminar(promo.id)}
                    className="font-brinnan"
                    style={{
                      padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem',
                      border: 'none', cursor: 'pointer',
                      background: '#E12B4E', color: '#fff',
                    }}
                  >
                    Si
                  </button>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="font-brinnan"
                    style={{
                      padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem',
                      border: '1px solid rgba(66,38,26,0.15)', cursor: 'pointer',
                      background: '#fff', color: 'var(--terrocana)',
                    }}
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(promo.id)}
                  className="font-brinnan"
                  style={{
                    padding: '5px 10px', borderRadius: '8px', fontSize: '0.72rem',
                    border: '1px solid rgba(235,30,85,0.2)', cursor: 'pointer',
                    background: 'rgba(235,30,85,0.06)', color: '#E12B4E',
                  }}
                >
                  Eliminar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
