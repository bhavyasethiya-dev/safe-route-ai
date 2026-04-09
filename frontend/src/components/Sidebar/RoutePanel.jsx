import { useState, useEffect } from 'react';

function getScoreClass(score) {
  if (score >= 70) return 'high';
  if (score >= 45) return 'mid';
  return 'low';
}

function getScoreColor(score) {
  if (score >= 70) return 'score-high';
  if (score >= 45) return 'score-mid';
  return 'score-low';
}

function AnimatedScore({ target }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let start = 0;
    const step = () => {
      start += Math.ceil((target - start) / 6);
      setCurrent(start);
      if (start < target) requestAnimationFrame(step);
      else setCurrent(target);
    };
    requestAnimationFrame(step);
  }, [target]);

  return <>{current}</>;
}

function FactorChip({ icon, label, value }) {
  const cls = getScoreClass(value);
  return (
    <div className="factor-chip">
      <span className="factor-icon">{icon}</span>
      <span>{label}</span>
      <span className={`factor-score ${cls === 'high' ? 'score-high' : cls === 'mid' ? 'score-mid' : 'score-low'}`}>
        {Math.round(value)}
      </span>
    </div>
  );
}

function RouteCard({ route, isActive, onClick }) {
  const score = route.safety?.score ?? 0;
  const cls = getScoreClass(score);
  const scoreCls = getScoreColor(score);
  const factors = route.safety?.factors || {};

  const distKm = (route.distance / 1000).toFixed(1);
  const durMin = Math.round(route.duration / 60);

  return (
    <div
      className={`route-card ${route.type} ${isActive ? 'active' : ''}`}
      onClick={onClick}
      id={`route-card-${route.id}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      <div className="route-card-header">
        <div className={`route-type-badge ${route.type}`}>
          {route.type === 'safest' ? '🛡️ Safest' : '⚡ Shortest'}
        </div>
        <span className={`route-active-tag ${isActive ? 'active' : ''}`}>
          {isActive ? '✓ Selected' : 'Click to select'}
        </span>
      </div>

      {/* Safety Score Bar */}
      <div className="safety-score-wrapper">
        <div className="safety-score-label">
          <span className="safety-score-text">Safety Score</span>
          <span className={`safety-score-value ${scoreCls}`}>
            <AnimatedScore target={score} />/100
          </span>
        </div>
        <div className="safety-bar">
          <div
            className={`safety-bar-fill ${cls}`}
            style={{ width: `${score}%` }}
          />
        </div>
        {route.safety?.recommendation && (
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {route.safety.recommendation}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="route-stats">
        <div className="route-stat">
          <div className="route-stat-label">Distance</div>
          <div className="route-stat-value">{distKm} km</div>
        </div>
        <div className="route-stat">
          <div className="route-stat-label">Est. Time</div>
          <div className="route-stat-value">{durMin} min</div>
        </div>
      </div>

      {/* Safety Factors */}
      {Object.keys(factors).length > 0 && (
        <div className="safety-factors">
          <FactorChip icon="🚗" label="Traffic" value={factors.traffic ?? 50} />
          <FactorChip icon="🔒" label="Crime" value={100 - (factors.crime ?? 50)} />
          <FactorChip icon="💡" label="Lighting" value={factors.lighting ?? 50} />
          <FactorChip icon="🏪" label="Active POI" value={factors.poi ?? 50} />
        </div>
      )}
    </div>
  );
}

export default function RoutePanel({ routes, activeRouteId, onSelectRoute }) {
  if (!routes || routes.length === 0) {
    return (
      <div className="welcome-tip">
        <div className="tip-icon">🗺️</div>
        <div className="tip-title">Ready to Navigate</div>
        <div className="tip-desc">
          Enter your start and destination above to get AI-analyzed safe routes with safety scores.
        </div>
      </div>
    );
  }

  // Sort: safest first
  const sorted = [...routes].sort((a, b) => (b.safety?.score ?? 0) - (a.safety?.score ?? 0));

  return (
    <div className="routes-section">
      <div className="section-label">
        <span>🤖</span>
        <span>AI Route Analysis</span>
        <span className="ai-badge">AI Scored</span>
      </div>
      {sorted.map((route) => (
        <RouteCard
          key={route.id}
          route={route}
          isActive={route.id === activeRouteId}
          onClick={() => onSelectRoute(route.id)}
        />
      ))}
    </div>
  );
}
