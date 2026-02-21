import React, { useState, useEffect, useRef } from 'react';
import { FaXRay, FaSearch, FaUpload, FaSave, FaCheck, FaSpinner, FaEye, FaArrowLeft, FaImage, FaFileMedical } from 'react-icons/fa';
import api from '../services/api';

const PLANTILLAS = [
  { id: 'general',      label: 'General',          campos: ['tecnica', 'hallazgos', 'impresion', 'recomendaciones'] },
  { id: 'torax',        label: 'Tórax / Rx Tórax', campos: ['tecnica', 'hallazgos', 'impresion', 'recomendaciones'] },
  { id: 'columna',      label: 'Columna',           campos: ['tecnica', 'hallazgos', 'impresion', 'recomendaciones'] },
  { id: 'extremidades', label: 'Extremidades',      campos: ['tecnica', 'hallazgos', 'impresion', 'recomendaciones'] },
  { id: 'abdomen',      label: 'Abdomen',           campos: ['tecnica', 'hallazgos', 'impresion', 'recomendaciones'] },
  { id: 'mamografia',   label: 'Mamografía',        campos: ['tecnica', 'hallazgos', 'impresion', 'birads', 'recomendaciones'] },
  { id: 'personalizada', label: 'Personalizada',    campos: ['tecnica', 'hallazgos', 'impresion', 'recomendaciones'] },
];

const CAMPO_LABELS = {
  tecnica:         'Técnica Utilizada',
  hallazgos:       'Hallazgos',
  impresion:       'Impresión Diagnóstica',
  birads:          'Categoría BIRADS',
  recomendaciones: 'Recomendaciones',
};

const PRESETS = {
  normal:   { brillo: 0,   contraste: 0,   saturacion: 0,   zoom: 1 },
  hueso:    { brillo: 20,  contraste: 40,  saturacion: -60, zoom: 1 },
  pulmones: { brillo: -10, contraste: 30,  saturacion: -80, zoom: 1 },
  tejidos:  { brillo: 10,  contraste: 20,  saturacion: 20,  zoom: 1 },
};

const ESTADO_COLORES = {
  pendiente:   { bg: '#fff3cd', color: '#856404' },
  en_proceso:  { bg: '#cce5ff', color: '#004085' },
  completado:  { bg: '#d4edda', color: '#155724' },
};

const Imagenologia = () => {
  const [vista, setVista] = useState('lista'); // 'lista' | 'visor'
  const [estudios, setEstudios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('pendiente');
  const [estudioActual, setEstudioActual] = useState(null);
  const [imagenes, setImagenes] = useState([]);
  const [imagenActual, setImagenActual] = useState(null);
  const [indiceImagen, setIndiceImagen] = useState(0);
  const [ajustes, setAjustes] = useState({ brillo: 0, contraste: 0, saturacion: 0, zoom: 1, invertir: false, rotacion: 0, flipH: false, flipV: false });
  const [reporte, setReporte] = useState({});
  const [plantilla, setPlantilla] = useState('general');
  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [tab, setTab] = useState('ajustes'); // 'ajustes' | 'reporte'
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const dragRef = useRef({ dragging: false, lastX: 0, lastY: 0, offsetX: 0, offsetY: 0 });

  useEffect(() => { cargarEstudios(); }, [filtroEstado]);

  const cargarEstudios = async () => {
    setLoading(true);
    try {
      const params = filtroEstado ? { estado: filtroEstado } : {};
      const resp = await api.getImagenologiaLista(params);
      const lista = Array.isArray(resp) ? resp : (resp?.resultados || resp?.data || []);
      setEstudios(lista);
    } catch (err) {
      console.error('Error cargando imagenología:', err);
      setEstudios([]);
    } finally {
      setLoading(false);
    }
  };

  const abrirVisor = async (estudio) => {
    setEstudioActual(estudio);
    setVista('visor');
    setAjustes({ brillo: 0, contraste: 0, saturacion: 0, zoom: 1, invertir: false, rotacion: 0, flipH: false, flipV: false });
    setReporte({});
    setImagenes([]);
    setImagenActual(null);
    setIndiceImagen(0);
    dragRef.current = { dragging: false, lastX: 0, lastY: 0, offsetX: 0, offsetY: 0 };

    try {
      const ws = await api.getImagenologiaWorkspace(estudio._id || estudio.id);
      const data = ws?.data || ws || {};
      if (data.ajustes) setAjustes(prev => ({ ...prev, ...data.ajustes }));
      if (data.reporte) setReporte(data.reporte);
      if (data.plantilla) setPlantilla(data.plantilla);
      const imgs = data.imagenes || estudio.imagenes || [];
      setImagenes(imgs);
      if (imgs.length > 0) setImagenActual(imgs[0]);
    } catch (e) {
      const imgs = estudio.imagenes || [];
      setImagenes(imgs);
      if (imgs.length > 0) setImagenActual(imgs[0]);
    }
  };

  // Render de imagen en canvas
  useEffect(() => {
    if (!imagenActual || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const src = imagenActual.url || imagenActual.path || imagenActual;
    img.src = src.startsWith('http') ? src : ('/' + src.replace(/^\//, ''));
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(canvas.width / 2 + dragRef.current.offsetX, canvas.height / 2 + dragRef.current.offsetY);
      ctx.rotate((ajustes.rotacion * Math.PI) / 180);
      ctx.scale(
        ajustes.flipH ? -ajustes.zoom : ajustes.zoom,
        ajustes.flipV ? -ajustes.zoom : ajustes.zoom
      );
      const b = 1 + ajustes.brillo / 100;
      const c = 1 + ajustes.contraste / 100;
      const s = 1 + ajustes.saturacion / 100;
      ctx.filter = `brightness(${b}) contrast(${c}) saturate(${s})${ajustes.invertir ? ' invert(1)' : ''}`;
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();
    };
    img.onerror = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#222';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#888';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('No se pudo cargar la imagen', canvas.width / 2, canvas.height / 2);
    };
  }, [imagenActual, ajustes]);

  const handleSubirImagenes = async (e) => {
    const files = e.target.files;
    if (!files.length || !estudioActual) return;
    setSubiendo(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach(f => formData.append('imagenes', f));
      const token = localStorage.getItem('token');
      const resp = await fetch(`/api/imagenologia/upload/${estudioActual._id || estudioActual.id}`, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token },
        body: formData
      });
      const data = await resp.json();
      const nuevas = data.imagenes || data.data?.imagenes || [];
      setImagenes(prev => [...prev, ...nuevas]);
      if (nuevas.length > 0 && !imagenActual) setImagenActual(nuevas[0]);
    } catch (err) {
      alert('Error al subir imágenes: ' + err.message);
    } finally {
      setSubiendo(false);
    }
  };

  const guardarAjustes = async () => {
    if (!estudioActual) return;
    setGuardando(true);
    try {
      await api.updateImagenologiaWorkspace(estudioActual._id || estudioActual.id, {
        ajustes, reporte, plantilla
      });
      alert('Ajustes guardados correctamente');
    } catch (err) {
      alert('Error al guardar: ' + err.message);
    } finally {
      setGuardando(false);
    }
  };

  const finalizarReporte = async () => {
    if (!estudioActual) return;
    if (!window.confirm('¿Finalizar y marcar como completado?')) return;
    setGuardando(true);
    try {
      await api.updateImagenologiaWorkspace(estudioActual._id || estudioActual.id, {
        ajustes, reporte, plantilla
      });
      await api.finalizarReporteImagenologia(estudioActual._id || estudioActual.id);
      alert('Reporte finalizado exitosamente');
      setVista('lista');
      cargarEstudios();
    } catch (err) {
      alert('Error al finalizar: ' + err.message);
    } finally {
      setGuardando(false);
    }
  };

  const aplicarPreset = (nombre) => {
    const p = PRESETS[nombre];
    if (p) setAjustes(prev => ({ ...prev, ...p }));
  };

  const plantillaActual = PLANTILLAS.find(p => p.id === plantilla) || PLANTILLAS[0];

  // ============================================================
  // VISTA LISTA
  // ============================================================
  if (vista === 'lista') {
    return (
      <div style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10, color: '#1a3a5c' }}>
            <FaXRay style={{ color: '#87CEEB' }} /> Imagenología
          </h1>
          <div style={{ display: 'flex', gap: 10 }}>
            {['', 'pendiente', 'en_proceso', 'completado'].map(e => (
              <button key={e} onClick={() => setFiltroEstado(e)} style={{
                padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 'bold',
                background: filtroEstado === e ? '#1a3a5c' : '#f0f0f0',
                color: filtroEstado === e ? 'white' : '#333'
              }}>
                {e === '' ? 'Todos' : e.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <FaSpinner className="spin" style={{ fontSize: 40, color: '#87CEEB' }} />
          </div>
        ) : estudios.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: 15 }}>
            <FaXRay style={{ fontSize: 60, color: '#ddd', marginBottom: 20 }} />
            <p style={{ color: '#999', fontSize: 18 }}>No hay estudios de imagenología {filtroEstado ? `con estado "${filtroEstado}"` : ''}</p>
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  <th style={{ padding: '14px 15px', textAlign: 'left', color: '#666', fontSize: 13 }}>Código</th>
                  <th style={{ padding: '14px 15px', textAlign: 'left', color: '#666', fontSize: 13 }}>Paciente</th>
                  <th style={{ padding: '14px 15px', textAlign: 'left', color: '#666', fontSize: 13 }}>Estudio</th>
                  <th style={{ padding: '14px 15px', textAlign: 'center', color: '#666', fontSize: 13 }}>Imágenes</th>
                  <th style={{ padding: '14px 15px', textAlign: 'center', color: '#666', fontSize: 13 }}>Estado</th>
                  <th style={{ padding: '14px 15px', textAlign: 'left', color: '#666', fontSize: 13 }}>Fecha</th>
                  <th style={{ padding: '14px 15px', textAlign: 'center', color: '#666', fontSize: 13 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {estudios.map(e => {
                  const est = ESTADO_COLORES[e.estado] || ESTADO_COLORES.pendiente;
                  return (
                    <tr key={e._id || e.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '12px 15px', fontFamily: 'monospace', fontSize: 13 }}>
                        {e.codigo || e._id?.slice(-6).toUpperCase()}
                      </td>
                      <td style={{ padding: '12px 15px', fontWeight: 'bold' }}>
                        {e.paciente?.nombre} {e.paciente?.apellido}
                      </td>
                      <td style={{ padding: '12px 15px' }}>
                        {e.estudio?.nombre || 'Estudio de imagen'}
                      </td>
                      <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                        <span style={{ background: '#e8f4fd', color: '#1565c0', padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 'bold' }}>
                          {(e.imagenes || []).length}
                        </span>
                      </td>
                      <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                        <span style={{ padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 'bold', background: est.bg, color: est.color }}>
                          {(e.estado || 'pendiente').replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '12px 15px', color: '#666', fontSize: 13 }}>
                        {new Date(e.createdAt || e.fecha).toLocaleDateString('es-DO')}
                      </td>
                      <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                        <button onClick={() => abrirVisor(e)} style={{
                          padding: '8px 16px', background: '#1a3a5c', color: 'white', border: 'none',
                          borderRadius: 6, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 'bold'
                        }}>
                          <FaEye /> Abrir Visor
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // ============================================================
  // VISTA VISOR
  // ============================================================
  return (
    <div style={{ padding: 20 }}>
      {/* Header visor */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          <button onClick={() => { setVista('lista'); cargarEstudios(); }} style={{
            padding: '8px 14px', background: '#f0f0f0', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
          }}>
            <FaArrowLeft /> Volver
          </button>
          <div>
            <h2 style={{ margin: 0, color: '#1a3a5c' }}>
              {estudioActual?.paciente?.nombre} {estudioActual?.paciente?.apellido}
            </h2>
            <p style={{ margin: 0, color: '#666', fontSize: 13 }}>
              {estudioActual?.estudio?.nombre || 'Estudio de imagen'} · Código: {estudioActual?.codigo || estudioActual?._id?.slice(-6).toUpperCase()}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={guardarAjustes} disabled={guardando} style={{
            padding: '10px 18px', background: '#3498db', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 'bold'
          }}>
            {guardando ? <FaSpinner className="spin" /> : <FaSave />} Guardar
          </button>
          <button onClick={finalizarReporte} disabled={guardando} style={{
            padding: '10px 18px', background: '#27ae60', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 'bold'
          }}>
            <FaCheck /> Finalizar Reporte
          </button>
        </div>
      </div>

      {/* Cuerpo del visor */}
      <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 280px', gap: 10, height: 'calc(100vh - 160px)' }}>
        {/* Miniaturas */}
        <div style={{ background: '#111', borderRadius: 10, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {imagenes.map((img, i) => (
            <div key={i} onClick={() => { setImagenActual(img); setIndiceImagen(i); }} style={{
              border: indiceImagen === i ? '2px solid #87CEEB' : '2px solid transparent',
              borderRadius: 6, overflow: 'hidden', cursor: 'pointer', aspectRatio: '1',
              background: '#222'
            }}>
              <img src={img.url || img.path || img} alt={`Img ${i + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => { e.target.style.display = 'none'; }} />
            </div>
          ))}
          <button onClick={() => fileInputRef.current?.click()} disabled={subiendo} style={{
            background: '#333', border: '2px dashed #555', borderRadius: 6, padding: '10px 0', cursor: 'pointer', color: '#87CEEB', fontSize: 20
          }}>
            {subiendo ? '⏳' : '+'}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*,.dcm" multiple style={{ display: 'none' }} onChange={handleSubirImagenes} />
        </div>

        {/* Canvas central */}
        <div style={{ background: '#000', borderRadius: 10, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          {imagenActual ? (
            <canvas ref={canvasRef}
              style={{ maxWidth: '100%', maxHeight: '100%', cursor: 'grab' }}
              onWheel={e => {
                e.preventDefault();
                setAjustes(prev => ({ ...prev, zoom: Math.max(0.1, Math.min(10, prev.zoom - e.deltaY * 0.001)) }));
              }}
              onMouseDown={e => {
                dragRef.current.dragging = true;
                dragRef.current.lastX = e.clientX;
                dragRef.current.lastY = e.clientY;
              }}
              onMouseMove={e => {
                if (!dragRef.current.dragging) return;
                dragRef.current.offsetX += e.clientX - dragRef.current.lastX;
                dragRef.current.offsetY += e.clientY - dragRef.current.lastY;
                dragRef.current.lastX = e.clientX;
                dragRef.current.lastY = e.clientY;
                setAjustes(prev => ({ ...prev })); // forzar re-render
              }}
              onMouseUp={() => { dragRef.current.dragging = false; }}
              onMouseLeave={() => { dragRef.current.dragging = false; }}
            />
          ) : (
            <div style={{ textAlign: 'center', color: '#555' }}>
              <FaImage style={{ fontSize: 60, marginBottom: 15 }} />
              <p>Sin imagen. Suba imágenes con el botón +</p>
            </div>
          )}
        </div>

        {/* Panel derecho */}
        <div style={{ background: 'white', borderRadius: 10, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '2px solid #f0f0f0' }}>
            {['ajustes', 'reporte'].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, padding: '12px 0', border: 'none', background: tab === t ? '#1a3a5c' : 'white',
                color: tab === t ? 'white' : '#666', cursor: 'pointer', fontWeight: 'bold', fontSize: 13,
                textTransform: 'capitalize'
              }}>
                {t === 'ajustes' ? '🎛 Ajustes' : '📋 Reporte'}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 15 }}>
            {/* TAB AJUSTES */}
            {tab === 'ajustes' && (
              <>
                {/* Presets */}
                <div style={{ marginBottom: 15 }}>
                  <label style={{ fontSize: 12, fontWeight: 'bold', color: '#555', display: 'block', marginBottom: 6 }}>Presets</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {Object.keys(PRESETS).map(p => (
                      <button key={p} onClick={() => aplicarPreset(p)} style={{
                        padding: '6px', background: '#f0f8ff', border: '1px solid #87CEEB', borderRadius: 6,
                        cursor: 'pointer', fontSize: 12, fontWeight: 'bold', color: '#1a3a5c', textTransform: 'capitalize'
                      }}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sliders */}
                {[
                  { key: 'brillo',     label: 'Brillo',    min: -100, max: 100 },
                  { key: 'contraste',  label: 'Contraste', min: -100, max: 100 },
                  { key: 'saturacion', label: 'Saturación', min: -100, max: 100 },
                  { key: 'zoom',       label: 'Zoom',      min: 0.1, max: 5, step: 0.1 },
                ].map(({ key, label, min, max, step = 1 }) => (
                  <div key={key} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <label style={{ fontSize: 12, fontWeight: 'bold', color: '#555' }}>{label}</label>
                      <span style={{ fontSize: 12, color: '#888' }}>{parseFloat(ajustes[key]).toFixed(1)}</span>
                    </div>
                    <input type="range" min={min} max={max} step={step} value={ajustes[key]}
                      onChange={e => setAjustes(prev => ({ ...prev, [key]: parseFloat(e.target.value) }))}
                      style={{ width: '100%', accentColor: '#1a3a5c' }} />
                  </div>
                ))}

                {/* Toggle invertir */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 'bold', color: '#555' }}>Invertir (Negativo)</label>
                  <button onClick={() => setAjustes(prev => ({ ...prev, invertir: !prev.invertir }))} style={{
                    padding: '4px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: 12,
                    background: ajustes.invertir ? '#1a3a5c' : '#ddd',
                    color: ajustes.invertir ? 'white' : '#333'
                  }}>
                    {ajustes.invertir ? 'ON' : 'OFF'}
                  </button>
                </div>

                {/* Transformaciones */}
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 'bold', color: '#555', display: 'block', marginBottom: 6 }}>Transformaciones</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {[
                      { label: '↺ -90°', action: () => setAjustes(p => ({ ...p, rotacion: (p.rotacion - 90 + 360) % 360 })) },
                      { label: '↻ +90°', action: () => setAjustes(p => ({ ...p, rotacion: (p.rotacion + 90) % 360 })) },
                      { label: '↔ Flip H', action: () => setAjustes(p => ({ ...p, flipH: !p.flipH })) },
                      { label: '↕ Flip V', action: () => setAjustes(p => ({ ...p, flipV: !p.flipV })) },
                    ].map(({ label, action }) => (
                      <button key={label} onClick={action} style={{
                        padding: '8px', background: '#f0f8ff', border: '1px solid #87CEEB', borderRadius: 6,
                        cursor: 'pointer', fontSize: 12, fontWeight: 'bold', color: '#1a3a5c'
                      }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reset */}
                <button onClick={() => setAjustes({ brillo: 0, contraste: 0, saturacion: 0, zoom: 1, invertir: false, rotacion: 0, flipH: false, flipV: false })} style={{
                  width: '100%', padding: 10, background: '#f8f9fa', border: '1px solid #ddd', borderRadius: 8,
                  cursor: 'pointer', fontSize: 13, color: '#555'
                }}>
                  Restablecer Todo
                </button>
              </>
            )}

            {/* TAB REPORTE */}
            {tab === 'reporte' && (
              <>
                {/* Selector plantilla */}
                <div style={{ marginBottom: 15 }}>
                  <label style={{ fontSize: 12, fontWeight: 'bold', color: '#555', display: 'block', marginBottom: 5 }}>Plantilla de Reporte</label>
                  <select value={plantilla} onChange={e => setPlantilla(e.target.value)} style={{
                    width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13
                  }}>
                    {PLANTILLAS.map(p => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                </div>

                {/* Campos dinámicos de la plantilla */}
                {plantillaActual.campos.map(campo => (
                  <div key={campo} style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 12, fontWeight: 'bold', color: '#555', display: 'block', marginBottom: 4 }}>
                      {CAMPO_LABELS[campo] || campo}
                    </label>
                    {campo === 'birads' ? (
                      <select value={reporte[campo] || ''} onChange={e => setReporte(prev => ({ ...prev, [campo]: e.target.value }))} style={{
                        width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13
                      }}>
                        <option value="">Seleccionar BIRADS</option>
                        {['0','1','2','3','4A','4B','4C','5','6'].map(b => (
                          <option key={b} value={b}>BIRADS {b}</option>
                        ))}
                      </select>
                    ) : (
                      <textarea value={reporte[campo] || ''} onChange={e => setReporte(prev => ({ ...prev, [campo]: e.target.value }))}
                        placeholder={`Escribir ${CAMPO_LABELS[campo]?.toLowerCase()}...`} rows={campo === 'hallazgos' ? 5 : 3}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }}
                      />
                    )}
                  </div>
                ))}

                <button onClick={guardarAjustes} disabled={guardando} style={{
                  width: '100%', padding: 10, background: '#3498db', color: 'white', border: 'none', borderRadius: 8,
                  cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 5
                }}>
                  {guardando ? <FaSpinner className="spin" /> : <FaSave />} Guardar Borrador
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Imagenologia;
