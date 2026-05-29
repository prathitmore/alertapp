import { useState } from 'react';
import { Search, Plus, Power, ShieldCheck, Cpu, Clock, AlertTriangle, Shield, Check, Trash2, ChevronRight, Activity, VolumeX, Heart, ListFilter, Bell, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Toggle from '../components/Toggle';
import { useAlerts } from '../context/AlertContext';
import { filterAlerts, priorityToColor, getCategoryById, getTriggerTier } from '../utils/helpers';
import * as Icons from 'lucide-react';

export default function AlertsHub() {
  const navigate = useNavigate();
  const { state, dispatch } = useAlerts();
  const { alerts, logs, searchState } = state;

  const [showSearch, setShowSearch] = useState(false);
  const [showFilter, setShowFilter] = useState(false);

  const handleToggleAlert = (id, newState) => {
    dispatch({ type: 'TOGGLE_ALERT', payload: id });
  };

  const handleToggleFavorite = (id, e) => {
    e.stopPropagation();
    dispatch({ type: 'FAVORITE_ALERT', payload: id });
  };

  const handleFilter = (filter) => {
    dispatch({ type: 'APPLY_FILTER', payload: filter });
  };

  const handleSearch = (e) => {
    dispatch({ type: 'SET_SEARCH', payload: e.target.value });
  };

  const handleClearLogs = () => {
    dispatch({ type: 'CLEAR_LOGS' });
  };

  const handleMuteAll = () => {
    alerts.forEach(a => {
      if (a.enabled) {
        dispatch({ type: 'TOGGLE_ALERT', payload: a.id });
      }
    });
  };

  // Base list of active triggers matching search query
  const searchFiltered = alerts.filter(alert => {
    if (!searchState.query) return true;
    const query = searchState.query.toLowerCase();
    const cat = getCategoryById(alert.category);
    return (
      alert.name.toLowerCase().includes(query) ||
      (cat && cat.name.toLowerCase().includes(query)) ||
      (alert.trigger.value && String(alert.trigger.value).toLowerCase().includes(query))
    );
  });

  // Apply filters
  const filteredAlerts = searchFiltered.filter(alert => {
    if (searchState.activeFilter === 'ACTIVE') return alert.enabled;
    if (searchState.activeFilter === 'FAVORITES') return alert.isFavorite;
    if (searchState.activeFilter === 'CRITICAL') return alert.priority === 'CRITICAL';
    return true; // 'ALL'
  });

  // Split into favorites, predefined, and custom
  const favoriteAlerts = alerts.filter(a => a.isFavorite);
  const customAlerts = filteredAlerts.filter(a => a.category === 'custom');
  const recentLogs = logs.slice(0, 4);

  const activeCount = alerts.filter(a => a.enabled).length;

  const filters = ['ALL', 'ACTIVE', 'FAVORITES', 'CRITICAL'];

  return (
    <div className="page-container animate-fade-in" style={{ paddingBottom: '90px' }}>
      
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#fff', letterSpacing: '-0.5px', margin: 0 }}>
            AuraPing
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
            Smart Alert Center
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => setShowSearch(!showSearch)}
            style={{
              background: showSearch ? 'rgba(35, 231, 255, 0.1)' : 'rgba(255,255,255,0.03)',
              border: showSearch ? '1px solid var(--tech-cyan)' : '1px solid rgba(255,255,255,0.05)',
              borderRadius: '12px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s', color: showSearch ? 'var(--tech-cyan)' : '#fff'
            }}
          >
            <Search size={18} />
          </button>
          
          <button 
            onClick={() => setShowFilter(!showFilter)}
            style={{
              background: showFilter ? 'rgba(35, 231, 255, 0.1)' : 'rgba(255,255,255,0.03)',
              border: showFilter ? '1px solid var(--tech-cyan)' : '1px solid rgba(255,255,255,0.05)',
              borderRadius: '12px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s', color: showFilter ? 'var(--tech-cyan)' : '#fff'
            }}
          >
            <ListFilter size={18} />
          </button>
        </div>
      </div>

      {/* SEARCH PANEL */}
      {showSearch && (
        <div style={{ position: 'relative', marginBottom: '20px', animation: 'slide-down 0.2s ease' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '15px' }} />
          <input 
            type="text" 
            value={searchState.query}
            onChange={handleSearch}
            placeholder="Search alerts or keywords..." 
            style={{
              fontFamily: 'var(--font-family-sans)',
              width: '100%', padding: '14px 16px 14px 44px', 
              backgroundColor: 'rgba(255, 255, 255, 0.03)', 
              border: '1px solid rgba(255, 255, 255, 0.05)', 
              borderRadius: '12px', color: '#fff', fontSize: '13px',
              outline: 'none', transition: 'border-color 0.2s',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
            }} 
            onFocus={(e) => e.target.style.borderColor = 'rgba(35, 231, 255, 0.3)'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.05)'}
          />
        </div>
      )}

      {/* FILTER PANEL */}
      {showFilter && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none', animation: 'slide-down 0.2s ease' }}>
          {filters.map(f => (
            <button 
              key={f}
              style={{ 
                fontFamily: 'var(--font-family-sans)',
                padding: '8px 16px', borderRadius: '20px', flexShrink: 0, fontWeight: '600', fontSize: '11px',
                backgroundColor: searchState.activeFilter === f ? 'rgba(35, 231, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                color: searchState.activeFilter === f ? 'var(--tech-cyan)' : 'var(--text-muted)',
                border: searchState.activeFilter === f ? '1px solid var(--tech-cyan)' : '1px solid rgba(255, 255, 255, 0.05)', 
                transition: 'all 0.2s',
                cursor: 'pointer'
              }}
              onClick={() => handleFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {/* QUICK ACTIONS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={handleMuteAll} 
          className="btn btn-secondary" 
          style={{ padding: '14px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', border: '1px solid rgba(255, 255, 255, 0.03)' }}
        >
          <VolumeX size={14} /> Mute Active ({activeCount})
        </button>
        <button 
          onClick={handleClearLogs} 
          className="btn btn-secondary" 
          style={{ padding: '14px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', border: '1px solid rgba(255, 255, 255, 0.03)' }}
        >
          <Trash2 size={14} /> Scrub Logs
        </button>
      </div>

      {/* CHANNELS ENTRY CARD (PRIMARY PORTAL) */}
      <div 
        className="card highlight-card" 
        onClick={() => navigate('/categories')}
        style={{ 
          cursor: 'pointer',
          padding: '16px 20px', 
          marginBottom: '20px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(35, 231, 255, 0.08) 0%, rgba(5, 7, 11, 0.8) 100%)',
          border: '1px solid rgba(35, 231, 255, 0.2)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ 
            backgroundColor: 'rgba(35, 231, 255, 0.1)', 
            width: '42px', height: '42px', borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Bell size={18} color="var(--tech-cyan)" />
          </div>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#fff', margin: 0 }}>
              Predefined Alert Channels
            </h4>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Configure and test all 28 core triggers
            </span>
          </div>
        </div>
        <ChevronRight size={16} color="var(--tech-cyan)" />
      </div>

      {/* FAVORITE ALERTS (PINNED SECTION) */}
      {favoriteAlerts.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <span className="telemetry-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--tech-cyan)', marginBottom: '10px' }}>
            <Heart size={10} fill="var(--tech-cyan)" /> Pinned Channels ({favoriteAlerts.length})
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {favoriteAlerts.map(alert => {
              const cat = getCategoryById(alert.category);
              const IconComponent = cat && Icons[cat.icon] ? Icons[cat.icon] : Bell;
              
              return (
                <div 
                  key={alert.id}
                  className={`card ${alert.enabled ? 'active-card' : ''}`}
                  onClick={() => navigate(`/alert/${alert.id}`)}
                  style={{ margin: 0, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      backgroundColor: alert.enabled ? 'rgba(35, 231, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                      border: alert.enabled ? '1px solid rgba(35, 231, 255, 0.15)' : '1px solid rgba(255, 255, 255, 0.05)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: alert.enabled ? 'var(--tech-cyan)' : 'var(--text-muted)'
                    }}>
                      <IconComponent size={16} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                        <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#fff', margin: 0 }}>{alert.name}</h4>
                        {alert.trigger && alert.trigger.type && (
                          <div style={{
                            padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: '800', textTransform: 'uppercase',
                            backgroundColor: `${getTriggerTier(alert.trigger.type).color}20`,
                            color: getTriggerTier(alert.trigger.type).color,
                            border: `1px solid ${getTriggerTier(alert.trigger.type).color}40`
                          }}>
                            {getTriggerTier(alert.trigger.type).label}
                          </div>
                        )}
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{cat?.name || 'Predefined Trigger'}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Toggle initial={alert.enabled} onChange={(newState) => handleToggleAlert(alert.id, newState)} />
                    <ChevronRight size={14} color="var(--text-muted)" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CUSTOM ALERTS SECTION */}
      <div style={{ marginBottom: '24px' }}>
        <span className="telemetry-label" style={{ display: 'block', marginBottom: '10px' }}>
          Custom Alerts ({customAlerts.length})
        </span>

        {customAlerts.length === 0 ? (
          <div style={{ 
            textAlign: 'center', padding: '24px 16px', 
            border: '1.5px dashed rgba(255, 255, 255, 0.04)', borderRadius: '16px',
            backgroundColor: 'rgba(255, 255, 255, 0.01)'
          }}>
            <Sparkles size={18} color="var(--text-muted)" style={{ opacity: 0.5, marginBottom: '8px' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>No custom alerts configured.</p>
            <button 
              onClick={() => navigate('/builder')}
              style={{
                background: 'none', border: 'none', color: 'var(--tech-cyan)', fontSize: '11px', fontWeight: '700',
                marginTop: '8px', cursor: 'pointer', outline: 'none'
              }}
            >
              + Create Custom Alert
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {customAlerts.map(alert => (
              <div 
                key={alert.id}
                className={`card ${alert.enabled ? 'active-card' : ''}`}
                onClick={() => navigate(`/alert/${alert.id}`)}
                style={{ margin: 0, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    backgroundColor: alert.enabled ? 'rgba(35, 231, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                    border: alert.enabled ? '1px solid rgba(35, 231, 255, 0.15)' : '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: alert.enabled ? 'var(--tech-cyan)' : 'var(--text-muted)'
                  }}>
                    <Cpu size={16} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                      <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#fff', margin: 0 }}>{alert.name}</h4>
                      {alert.trigger && alert.trigger.type && (
                        <div style={{
                          padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: '800', textTransform: 'uppercase',
                          backgroundColor: `${getTriggerTier(alert.trigger.type).color}20`,
                          color: getTriggerTier(alert.trigger.type).color,
                          border: `1px solid ${getTriggerTier(alert.trigger.type).color}40`
                        }}>
                          {getTriggerTier(alert.trigger.type).label}
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Keyword: "{alert.trigger.value || ''}"
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Toggle initial={alert.enabled} onChange={(newState) => handleToggleAlert(alert.id, newState)} />
                  <ChevronRight size={14} color="var(--text-muted)" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* LIVE EVENT LOGS (RECENT TRIGGERS) */}
      <div>
        <span className="telemetry-label" style={{ display: 'block', marginBottom: '10px' }}>
          Recent Activity Logs
        </span>
        <div className="card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px', margin: 0 }}>
          {recentLogs.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', margin: '8px 0', opacity: 0.7 }}>
              No recent alert triggers recorded
            </p>
          ) : (
            recentLogs.map((log, idx) => (
              <div 
                key={log.id} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  fontSize: '12px', 
                  borderBottom: idx < recentLogs.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none', 
                  paddingBottom: idx < recentLogs.length - 1 ? '10px' : '0' 
                }}
              >
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span className={`dot-indicator ${log.status === 'SUCCESS' ? 'green' : 'red'}`} style={{ width: '6px', height: '6px', flexShrink: 0 }} />
                  <span style={{ color: '#fff', fontWeight: '500', lineHeight: '1.3' }}>{log.details}</span>
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: '10px', flexShrink: 0, fontFamily: 'monospace', marginLeft: '12px' }}>
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* floating custom alert quick button */}
      <button 
        onClick={() => navigate('/builder')} 
        style={{
          position: 'fixed', 
          bottom: '88px', 
          right: '20px',
          width: '48px', 
          height: '48px', 
          borderRadius: '50%', 
          backgroundColor: 'var(--tech-cyan)',
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          boxShadow: '0 8px 24px rgba(35, 231, 255, 0.25)', 
          border: 'none', 
          cursor: 'pointer', 
          zIndex: 100,
          transition: 'transform 0.15s ease'
        }}
        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.92)'}
        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <Plus size={20} color="#05070B" strokeWidth={2.5} />
      </button>

    </div>
  );
}
