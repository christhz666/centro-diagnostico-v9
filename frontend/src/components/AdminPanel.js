import React, { useState, useEffect } from 'react';
import { FaPalette, FaSave, FaSpinner } from 'react-icons/fa';
import api from '../services/api';

const AdminPanel = () => {
  const [config, setConfig] = useState({
    empresa_nombre: '',
    empresa_ruc: '',
    empresa_telefono: '',
    empresa_email: '',
    empresa_direccion: '',
    color_primario: '#667eea',
    color_secundario: '#764ba2'
  });
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      try {
        const resp = await api.getConfiguracion();
        const data = resp?.configuracion || resp || {};
        setConfig(prev => ({ ...prev, ...data }));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      await api.updateConfiguracion(config);
      alert('Configuración guardada correctamente');
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setGuardando(false);
    }
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 60 }}>
      <FaSpinner className="spin" style={{ fontSize: 40 }} />
    </div>
  );

  const campo = (label, key, type = 'text') => (
    <div style={{ marginBottom: 15 }}>
      <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 5, color: '#444' }}>{label}</label>
      <input type={type} value={config[key] || ''} onChange={e => setConfig({ ...config, [key]: e.target.value })}
        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box' }} />
    </div>
  );

  return (
    <div style={{ padding: 20, maxWidth: 700, margin: '0 auto' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#1b262c', marginBottom: 25 }}>
        <FaPalette style={{ color: '#3282b8' }} /> Personalización del Sistema
      </h2>
      <form onSubmit={guardar}>
        <div style={{ background: 'white', padding: 25, borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.08)', marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 20px', color: '#2c3e50' }}>Datos de la Empresa</h3>
          {campo('Nombre de la Empresa', 'empresa_nombre')}
          {campo('RNC / RUC', 'empresa_ruc')}
          {campo('Teléfono', 'empresa_telefono')}
          {campo('Email', 'empresa_email', 'email')}
          {campo('Dirección', 'empresa_direccion')}
        </div>
        <div style={{ background: 'white', padding: 25, borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.08)', marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 20px', color: '#2c3e50' }}>Colores del Sistema</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 5 }}>Color Primario</label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input type="color" value={config.color_primario || '#667eea'} onChange={e => setConfig({ ...config, color_primario: e.target.value })} style={{ width: 50, height: 40, border: 'none', cursor: 'pointer' }} />
                <input type="text" value={config.color_primario || '#667eea'} onChange={e => setConfig({ ...config, color_primario: e.target.value })} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd' }} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 5 }}>Color Secundario</label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input type="color" value={config.color_secundario || '#764ba2'} onChange={e => setConfig({ ...config, color_secundario: e.target.value })} style={{ width: 50, height: 40, border: 'none', cursor: 'pointer' }} />
                <input type="text" value={config.color_secundario || '#764ba2'} onChange={e => setConfig({ ...config, color_secundario: e.target.value })} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd' }} />
              </div>
            </div>
          </div>
        </div>
        <button type="submit" disabled={guardando} style={{
          width: '100%', padding: 14, background: '#3282b8', color: 'white', border: 'none', borderRadius: 10,
          cursor: 'pointer', fontWeight: 'bold', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
        }}>
          {guardando ? <FaSpinner className="spin" /> : <FaSave />} Guardar Configuración
        </button>
      </form>
    </div>
  );
};

export default AdminPanel;
