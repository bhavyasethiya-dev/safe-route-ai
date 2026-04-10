import { useState, useCallback, useRef } from 'react';
import MapView from './components/Map/MapView';
import SearchPanel from './components/Search/SearchPanel';
import RoutePanel from './components/Sidebar/RoutePanel';
import SOSPanel from './components/SOS/SOSPanel';
import AuthScreen from './components/Auth/AuthScreen';
import { fetchRoutes, fetchHeatmap, reverseGeocode, updateProfile, deleteProfile } from './services/api';
import { useToast } from './hooks/useToast';

function Navbar({ showHeatmap, onToggleHeatmap, user, onLogout }) {
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
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('safeRouteUser');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [routes, setRoutes] = useState([]);
  const [activeRouteId, setActiveRouteId] = useState('safest');
  const [activeTab, setActiveTab] = useState('navigation');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', emergencyContact: '' });
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

  const handleAuthSuccess = (userData, token) => {
    localStorage.setItem('safeRouteToken', token);
    localStorage.setItem('safeRouteUser', JSON.stringify(userData));
    setUser(userData);
    addToast(`Welcome back, ${userData.name}!`, 'success');
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      localStorage.removeItem('safeRouteToken');
      localStorage.removeItem('safeRouteUser');
      setUser(null);
      addToast('Signed out successfully.', 'info');
    }
  };

  const handleEditInit = () => {
    setProfileForm({
      name: user?.name || '',
      emergencyContact: user?.emergencyContact || ''
    });
    setIsEditingProfile(true);
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    addToast('Updating profile...', 'info', 2000);
    try {
      const data = await updateProfile({
        name: profileForm.name,
        emergencyContact: profileForm.emergencyContact
      });
      
      const updatedUser = data.user;
      localStorage.setItem('safeRouteUser', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setIsEditingProfile(false);
      addToast('✅ Profile updated safely!', 'success');
    } catch (err) {
      console.error(err);
      addToast('❌ Failed to update profile.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileDelete = async () => {
    if (window.confirm('⚠️ WARNING: Are you completely sure you want to permanently delete your account? This cannot be undone.')) {
      try {
        setLoading(true);
        addToast('Deleting account...', 'info', 2000);
        await deleteProfile();
        
        // Use logout flow to clear all local tokens
        localStorage.removeItem('safeRouteToken');
        localStorage.removeItem('safeRouteUser');
        setUser(null);
        addToast('Account successfully deleted.', 'info');
      } catch (err) {
        console.error(err);
        addToast('❌ Failed to delete account.', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="app-layout">
      {!user && <AuthScreen onAuthSuccess={handleAuthSuccess} />}
      
      <Navbar showHeatmap={showHeatmap} onToggleHeatmap={handleToggleHeatmap} user={user} onLogout={handleLogout} />
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
        <div className="sidebar-header" style={{ paddingBottom: '0' }}>
          <div className="sidebar-title">Safe Route AI</div>
          <div className="sidebar-tabs">
            <button className={`tab-btn ${activeTab === 'navigation' ? 'active' : ''}`} onClick={() => setActiveTab('navigation')}>Maps</button>
            <button className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>Profile</button>
          </div>
        </div>
        <div className="sidebar-body">
          {activeTab === 'navigation' ? (
            <>
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
            </>
          ) : (
            <div className="profile-panel">
              <div className="profile-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
              
              {!isEditingProfile ? (
                <>
                  <div className="profile-details">
                    <h3>{user?.name}</h3>
                    <p>{user?.email}</p>
                    {user?.emergencyContact && (
                      <div style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--brand-solid)' }}>
                        <strong>Emergency Contact:</strong> {user.emergencyContact}
                      </div>
                    )}
                  </div>
                  
                  <div className="profile-actions">
                    <button className="btn-edit" onClick={handleEditInit} style={{ width: '100%' }}>
                      ✏️ Edit Profile
                    </button>
                    <button className="btn-logout" onClick={handleLogout} style={{ width: '100%', justifyContent: 'center' }}>
                      🚪 Sign Out
                    </button>
                    <button className="btn-danger" onClick={handleProfileDelete} style={{ width: '100%', marginTop: '16px' }} disabled={loading}>
                      🚨 Delete Account
                    </button>
                  </div>
                </>
              ) : (
                <form className="profile-edit-form" onSubmit={handleProfileSave}>
                  <label>Full Name</label>
                  <input
                    type="text"
                    className="profile-input"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    required
                  />

                  <label>Emergency Contact (Phone)</label>
                  <input
                    type="tel"
                    className="profile-input"
                    placeholder="+1 (555) 000-0000"
                    value={profileForm.emergencyContact}
                    onChange={(e) => setProfileForm({ ...profileForm, emergencyContact: e.target.value })}
                  />

                  <div className="profile-actions" style={{ marginTop: '16px' }}>
                    <button type="submit" className="btn-save" disabled={loading}>
                      {loading ? 'Saving...' : '💾 Save Changes'}
                    </button>
                    <button type="button" className="btn-edit" onClick={() => setIsEditingProfile(false)} disabled={loading}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
