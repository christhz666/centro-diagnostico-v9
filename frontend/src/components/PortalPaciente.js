import React, { useState } from 'react';
import { FaFlask, FaLock, FaUser, FaSpinner, FaCheckCircle, FaClock, FaArrowLeft, FaQrcode } from 'react-icons/fa';

const PortalPaciente = () => {
  const [modo, setModo] = useState('login'); // 'login' | 'resultados'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [datos, setDatos] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Complete usuario y contraseña');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/resultados/acceso-paciente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (data.success) {
        setDatos(data);
        setModo('resultados');
      } else {
        setError(data.message || 'Usuario o contraseña incorrectos');
      }
    } catch (err) {
      setError('Error de conexión. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const getEstadoBadge = (estado) => {
    const configs = {
      pendiente: { bg: '#fff3cd', color: '#856404', label: '⏳ Pendiente' },
      en_proceso: { bg: '#cce5ff', color: '#004085', label: '🔬 En Proceso' },
      completado: { bg: '#d4edda', color: '#155724', label: '✅ Disponible' },
      entregado: { bg: '#d4edda', color: '#155724', label: '✅ Entregado' },
    };
    const c = configs[estado] || { bg: '#f8f9fa', color: '#666', label: estado };
    return <span style={{ background: c.bg, color: c.color, padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 'bold' }}>{c.label}</span>;
  };

  const colores = { azulOscuro: '#1a3a5c', azulCielo: '#87CEEB' };

  if (modo === 'resultados' && datos) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a3a5c 0%, #2980b9 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 20 }}>
        <div style={{ width: '100%', maxWidth: 800, background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
          <div style={{ background: colores.azulOscuro, padding: '25px 30px', color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0 }}>🏥 Centro Diagnóstico Mi Esperanza</h2>
                <p style={{ margin: '5px 0 0', opacity: 0.8 }}>Portal de Resultados</p>
              </div>
              <button onClick={() => { setModo('login'); setDatos(null); setUsername(''); setPassword(''); }} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: 8, padding: '8px 15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <FaArrowLeft /> Salir
              </button>
            </div>
          </div>

          <div style={{ padding: 30 }}>
            {/* Info Paciente */}
            <div style={{ background: '#f0f8ff', borderRadius: 12, padding: 20, marginBottom: 25, border: '1px solid #bee3f8' }}>
              <h3 style={{ margin: '0 0 10px', color: colores.azulOscuro }}>
                👤 {datos.paciente?.nombre} {datos.paciente?.apellido}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, fontSize: 14, color: '#555' }}>
                <div><strong>Cédula:</strong> {datos.paciente?.cedula}</div>
                <div><strong>Factura:</strong> {datos.factura?.numero}</div>
                <div><strong>Fecha:</strong> {new Date(datos.factura?.fecha).toLocaleDateString('es-DO')}</div>
                <div><strong>Total:</strong> RD$ {(datos.factura?.total || 0).toLocaleString()}</div>
              </div>
            </div>

            <h3 style={{ color: colores.azulOscuro, marginBottom: 15 }}>🔬 Resultados de su Visita</h3>

            {datos.data && datos.data.length > 0 ? (
              datos.data.map((r, i) => (
                <div key={i} style={{ border: '1px solid #e0e0e0', borderRadius: 12, marginBottom: 15, overflow: 'hidden' }}>
                  <div style={{ background: '#f8f9fa', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ fontSize: 16, color: '#2c3e50' }}>{r.estudio?.nombre || 'Estudio'}</strong>
                      <div style={{ fontSize: 13, color: '#888', marginTop: 3 }}>Código: {r.codigoMuestra} · {r.estudio?.codigo}</div>
                    </div>
                    {getEstadoBadge(r.estado)}
                  </div>
                  {r.estado === 'completado' || r.estado === 'entregado' ? (
                    <div style={{ padding: 20 }}>
                      {r.valores && r.valores.length > 0 && (
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 15 }}>
                          <thead>
                            <tr style={{ background: '#f0f8ff' }}>
                              <th style={{ padding: 10, textAlign: 'left', fontSize: 13, color: '#555' }}>Parámetro</th>
                              <th style={{ padding: 10, textAlign: 'center', fontSize: 13, color: '#555' }}>Valor</th>
                              <th style={{ padding: 10, textAlign: 'center', fontSize: 13, color: '#555' }}>Unidad</th>
                              <th style={{ padding: 10, textAlign: 'center', fontSize: 13, color: '#555' }}>Referencia</th>
                              <th style={{ padding: 10, textAlign: 'center', fontSize: 13, color: '#555' }}>Estado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {r.valores.map((v, j) => (
                              <tr key={j} style={{ borderTop: '1px solid #eee' }}>
                                <td style={{ padding: 10, fontWeight: 'bold' }}>{v.parametro}</td>
                                <td style={{ padding: 10, textAlign: 'center', fontWeight: 'bold', color: v.estado === 'alto' || v.estado === 'bajo' || v.estado === 'critico' ? '#e74c3c' : '#27ae60' }}>{v.valor}</td>
                                <td style={{ padding: 10, textAlign: 'center', color: '#888' }}>{v.unidad}</td>
                                <td style={{ padding: 10, textAlign: 'center', color: '#888', fontSize: 12 }}>{v.valorReferencia}</td>
                                <td style={{ padding: 10, textAlign: 'center' }}>
                                  {v.estado && <span style={{ background: v.estado === 'normal' ? '#d4edda' : '#f8d7da', color: v.estado === 'normal' ? '#155724' : '#721c24', padding: '2px 8px', borderRadius: 10, fontSize: 11 }}>{v.estado}</span>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                      {r.interpretacion && <p style={{ background: '#f8f9fa', padding: 15, borderRadius: 8, color: '#444', fontStyle: 'italic' }}>{r.interpretacion}</p>}
                      {r.validadoPor && <p style={{ fontSize: 13, color: '#888', margin: '10px 0 0' }}>✅ Validado por: Dr. {r.validadoPor.nombre} {r.validadoPor.apellido}</p>}
                    </div>
                  ) : (
                    <div style={{ padding: 20, textAlign: 'center', color: '#888' }}>
                      <FaClock style={{ fontSize: 30, marginBottom: 10 }} />
                      <p>Sus resultados estarán disponibles en breve. Por favor, regrese más tarde.</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
                <FaFlask style={{ fontSize: 40, marginBottom: 15 }} />
                <p>No hay resultados disponibles aún para esta visita.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a3a5c 0%, #2980b9 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <div style={{ background: 'white', borderRadius: 20, padding: 40, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <div style={{ width: 70, height: 70, background: colores.azulOscuro, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}>
            <FaFlask style={{ fontSize: 30, color: 'white' }} />
          </div>
          <h2 style={{ margin: 0, color: colores.azulOscuro }}>Centro Diagnóstico</h2>
          <h3 style={{ margin: '5px 0 0', color: '#888', fontWeight: 'normal' }}>Mi Esperanza</h3>
          <p style={{ margin: '15px 0 0', color: '#666', fontSize: 14 }}>Portal de resultados para pacientes</p>
        </div>

        {error && <div style={{ background: '#f8d7da', color: '#721c24', padding: 12, borderRadius: 8, marginBottom: 20, textAlign: 'center', fontSize: 14 }}>{error}</div>}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 15 }}>
            <label style={{ fontSize: 13, color: '#666', marginBottom: 5, display: 'block' }}>Usuario</label>
            <div style={{ position: 'relative' }}>
              <FaUser style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
              <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Ej: juan4501" style={{ width: '100%', padding: '12px 12px 12px 35px', borderRadius: 8, border: '1px solid #ddd', boxSizing: 'border-box', fontSize: 14 }} />
            </div>
          </div>
          <div style={{ marginBottom: 25 }}>
            <label style={{ fontSize: 13, color: '#666', marginBottom: 5, display: 'block' }}>Contraseña</label>
            <div style={{ position: 'relative' }}>
              <FaLock style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Su contraseña de la factura" style={{ width: '100%', padding: '12px 12px 12px 35px', borderRadius: 8, border: '1px solid #ddd', boxSizing: 'border-box', fontSize: 14 }} />
            </div>
          </div>
          <button type="submit" disabled={loading} style={{ width: '100%', padding: 14, background: colores.azulOscuro, color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            {loading ? <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> : <FaCheckCircle />}
            {loading ? 'Verificando...' : 'Ver Mis Resultados'}
          </button>
        </form>

        <div style={{ marginTop: 25, padding: 15, background: '#f0f8ff', borderRadius: 10, fontSize: 13, color: '#555' }}>
          <p style={{ margin: 0 }}><strong>💡 ¿Dónde encuentro mis credenciales?</strong><br />Su usuario y contraseña están impresos en la factura que recibió al momento de registrarse.</p>
        </div>
      </div>
    </div>
  );
};

export default PortalPaciente;
