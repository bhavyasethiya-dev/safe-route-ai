import { useState } from 'react';
import { fetchEmergencyServices } from '../../services/api';

const SERVICE_ICONS = { police: '👮', hospital: '🏥', pharmacy: '💊' };
const SERVICE_COLORS = { police: '#4f8ef7', hospital: '#ff4757', pharmacy: '#2ed573' };

export default function SOSPanel({ userLocation, onServicesLoaded, addToast }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activated, setActivated] = useState(false);

  const handleSOS = async () => {
    if (!userLocation) {
      addToast('📍 Location not available. Enable location access first.', 'error');
      return;
    }

    setActivated(true);
    setLoading(true);
    addToast('🚨 SOS Activated — Finding nearest emergency services…', 'error', 4000);

    try {
      const result = await fetchEmergencyServices(userLocation.lat, userLocation.lon);
      setServices(result || []);
      if (onServicesLoaded) onServicesLoaded(result);
      addToast(`✅ Found ${result.length} nearby emergency services`, 'success');
    } catch (err) {
      addToast('Could not load emergency services. Try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const police = services.filter((s) => s.type === 'police');
  const hospitals = services.filter((s) => s.type === 'hospital');
  const pharmacies = services.filter((s) => s.type === 'pharmacy');

  const grouped = [
    { label: 'Police Stations', items: police },
    { label: 'Hospitals', items: hospitals },
    { label: 'Pharmacies', items: pharmacies },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="sos-panel">
      <div className="sos-header">
        <div className="sos-title">
          <span>🚨</span> Emergency
        </div>
        {activated && !loading && (
          <span style={{ fontSize: '0.7rem', color: 'var(--safe-green)' }}>Active</span>
        )}
      </div>

      <button
        className="btn-sos"
        id="sos-button"
        onClick={handleSOS}
        disabled={loading}
        type="button"
      >
        {loading ? (
          <><div className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} /> Finding Services…</>
        ) : (
          <><div className="sos-pulse" /> SOS — Find Emergency Services</>
        )}
      </button>

      {!activated && !loading && (
        <div style={{ marginTop: '10px', fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
          Press SOS to instantly locate nearest police stations, hospitals &amp; pharmacies
        </div>
      )}

      {services.length > 0 && (
        <div className="emergency-services">
          {grouped.map((group) => (
            <div key={group.label}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '8px 0 4px', fontWeight: 600 }}>
                {group.label}
              </div>
              {group.items.slice(0, 2).map((svc) => (
                <div key={svc.id} className="service-item" id={`service-${svc.id}`}>
                  <span className="service-icon">{SERVICE_ICONS[svc.type] || '📍'}</span>
                  <div className="service-info">
                    <div className="service-name">{svc.name}</div>
                    <div className="service-dist">
                      {(svc.distance / 1000).toFixed(1)} km away
                      {svc.phone && <span style={{ marginLeft: '6px', color: SERVICE_COLORS[svc.type] }}>📞 {svc.phone}</span>}
                    </div>
                  </div>
                  <span className={`service-open ${svc.type === 'pharmacy' ? 'closed' : 'open'}`}>
                    {svc.type === 'pharmacy' ? '24hr' : 'Open'}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
