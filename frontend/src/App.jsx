import { useState, useCallback, useRef } from 'react';
import MapView from './components/Map/MapView';
import SearchPanel from './components/Search/SearchPanel';
import RoutePanel from './components/Sidebar/RoutePanel';
import SOSPanel from './components/SOS/SOSPanel';
import { fetchRoutes, fetchHeatmap, reverseGeocode } from './services/api';
import { useToast } from './hooks/useToast';

function Navbar({ showHeatmap, onToggleHeatmap }) {
  return (
    <nav className="navbar" id="main-navbar">
      <div className="navbar-logo">
        <div className="logo-icon">🛡️</div>
        <div className="logo-text">
          Safe<span>Route</span> AI
        </div>
      </div>
      <div className="navbar-status">
        <div className="status-dot" />
        <span>AI Safety Engine Active</span>
      </div>
      <div className="navbar-actions">
        <button
          className={`btn-nav ${showHeatmap ? 'active' : ''}`}
          id="toggle-heatmap-btn"
          onClick={onToggleHeatmap}
          style={showHeatmap ? { borderColor: 'var(--danger-red)', color: 'var(--danger-red)' } : {}}
        >
          🌡️ Heatmap
        </button>
      </div>
    </nav>
  );
}

function ToastContainer({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}

function HeatmapLegend() {
  return (
    <div className="heatmap-legend" id="heatmap-legend">
      <div className="legend-title">Risk Level</div>
      <div className="legend-bar" />
      <div className="legend-labels">
        <span>Safe</span>
        <span>Medium</span>
        <span>Danger</span>
      </div>
    </div>
  );
}

function MapControls({ onLocate, onReset }) {
  return (
    <div className="map-controls">
      <button className="map-control-btn" id="locate-btn" onClick={onLocate} title="My Location">🎯</button>
      <button className="map-control-btn" id="reset-btn" onClick={onReset} title="Reset Map">🔄</button>
    </div>
  );
}

export default function App() {
  const [routes, setRoutes] = useState([]);
  const [activeRouteId, setActiveRouteId] = useState('safest');
  const [heatmapPoints, setHeatmapPoints] = useState([]);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [emergencyServices, setEmergencyServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const mapRef = useRef(null);
  const { toasts, addToast } = useToast();

  const handleSearch = useCallback(async (from, to) => {
    setLoading(true);
    setRoutes([]);
    setEmergencyServices([]);
    setOrigin(from);
    setDestination(to);
    addToast('🤖 AI analyzing routes for safety…', 'info');

    try {
      const data = await fetchRoutes(from.lat, from.lon, to.lat, to.lon);
      setRoutes(data.routes || []);
      setActiveRouteId('safest');

      // Load heatmap for the area
      const lats = [from.lat, to.lat];
      const lons = [from.lon, to.lon];
      const padding = 0.05;
      const bounds = {
        minLat: Math.min(...lats) - padding,
        maxLat: Math.max(...lats) + padding,
        minLon: Math.min(...lons) - padding,
        maxLon: Math.max(...lons) + padding,
      };

      const heatData = await fetchHeatmap(bounds);
      setHeatmapPoints(heatData || []);

      const safeRoute = data.routes?.find((r) => r.type === 'safest');
      if (safeRoute) {
        addToast(
          `✅ Safest route found! Safety score: ${safeRoute.safety?.score}/100`,
          'success',
          4000
        );
      }
    } catch (err) {
      console.error(err);
      addToast('❌ Failed to fetch routes. Check your connection.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) {
      addToast('Geolocation not supported by your browser', 'error');
      return;
    }

    addToast('📡 Getting your location…', 'info', 2000);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        setUserLocation({ lat, lon });

        try {
          const place = await reverseGeocode(lat, lon);
          addToast(`📍 Location set: ${place.shortName}`, 'success');
          return place;
        } catch {
          addToast('📍 Location detected!', 'success');
        }
      },
      (err) => {
        addToast('Could not get your location. Check permissions.', 'error');
        console.error(err);
      },
      { enableHighAccuracy: true }
    );
  }, [addToast]);

  const handleReset = useCallback(() => {
    setRoutes([]);
    setActiveRouteId('safest');
    setHeatmapPoints([]);
    setOrigin(null);
    setDestination(null);
    setEmergencyServices([]);
    addToast('🔄 Map reset', 'info', 1500);
  }, [addToast]);

  const handleToggleHeatmap = useCallback(() => {
    setShowHeatmap((prev) => !prev);
    addToast(showHeatmap ? '🌡️ Heatmap hidden' : '🌡️ Heatmap visible', 'info', 1500);
  }, [showHeatmap, addToast]);

  return (
    <div className="app-layout">
      <Navbar showHeatmap={showHeatmap} onToggleHeatmap={handleToggleHeatmap} />
      <ToastContainer toasts={toasts} />

      <MapView
        center={userLocation ? [userLocation.lat, userLocation.lon] : [28.6139, 77.2090]}
        zoom={12}
        routes={routes}
        activeRouteId={activeRouteId}
        heatmapPoints={heatmapPoints}
        origin={origin}
        destination={destination}
        emergencyServices={emergencyServices}
        showHeatmap={showHeatmap && heatmapPoints.length > 0}
        onMapReady={(m) => { mapRef.current = m; }}
      />

      {showHeatmap && heatmapPoints.length > 0 && <HeatmapLegend />}

      <MapControls onLocate={handleLocate} onReset={handleReset} />

      {/* Sidebar */}
      <aside className="sidebar" id="app-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-title">Navigation Panel</div>
        </div>
        <div className="sidebar-body">
          <SearchPanel
            onSearch={handleSearch}
            onLocate={handleLocate}
            loading={loading}
          />

          <RoutePanel
            routes={routes}
            activeRouteId={activeRouteId}
            onSelectRoute={setActiveRouteId}
          />

          <SOSPanel
            userLocation={userLocation}
            onServicesLoaded={setEmergencyServices}
            addToast={addToast}
          />

          {/* Tip */}
          {routes.length === 0 && (
            <div className="welcome-tip" style={{ marginTop: '4px' }}>
              <div className="tip-icon">💡</div>
              <div className="tip-title">How It Works</div>
              <div className="tip-desc">
                Our AI analyzes <strong>crime data</strong>, <strong>street lighting</strong>, 
                <strong> traffic density</strong>, and <strong>nearby active places</strong> 
                to score each route's safety — not just the distance.
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
