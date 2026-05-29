import { useState, useEffect, Component } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Toggle from '../components/Toggle';
import { useAlerts } from '../context/AlertContext';
import { SoundRegistry, HapticRegistry } from '../data/registries';
import { soundService } from '../services/soundService';
import hapticService from '../services/hapticService';
import { getTriggerTier } from '../utils/helpers';
import { Play, Vibrate, Save, ArrowLeft, Volume2, Maximize, Settings, Bell, Eye, Heart } from 'lucide-react';

function AlertDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { state, dispatch } = useAlerts();
  
  const [localAlert, setLocalAlert] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    console.log('[DEBUG GUARD] Route Param Loaded ID:', id);
    console.log('[AlertDetail Debug] Loaded ID:', id);
    console.log('[AlertDetail Debug] Onboarding Flag Value:', localStorage.getItem('auraping_onboarded'));

    if (id === 'new') {
      const urlParams = new URLSearchParams(window.location.search);
      const catId = urlParams.get('category') || 'custom';
      
      const newAlert = {
        id: `alert_${Date.now()}`,
        name: catId === 'custom' ? 'New Monitor Rule' : `${catId.replace('_', ' ')} rule`.toUpperCase(),
        category: catId,
        enabled: true,
        priority: 'MEDIUM',
        trigger: { type: catId === 'custom' ? 'BATTERY' : catId.toUpperCase(), operator: 'LESS_THAN', value: 20 },
        actions: [{ type: 'SOUND', config: { soundId: `${catId}_medium`, volume: 'NORMAL' } }, { type: 'HAPTIC', config: { hapticPattern: 'DOUBLE_PULSE' } }, { type: 'VISUAL', config: { visualStyle: 'BANNER', repeat: false } }]
      };
      setLocalAlert(newAlert);
      setError(false);
      
      console.log('[AlertDetail Debug] New Alert Configured:', newAlert);
    } else if (state?.alerts) {
      const existing = state.alerts.find(a => a.id === id);
      console.log('[AlertDetail Debug] Existing Alert Found:', !!existing);
      if (existing) {
        setLocalAlert({ ...existing });
        setError(false);
        console.log('[AlertDetail Debug] Category:', existing.category);
        console.log('[AlertDetail Debug] Sound Registry Match:', existing.category ? !!SoundRegistry[existing.category] : false);
      } else {
        // If state is loaded but alert is not found, set error
        setError(true);
      }
    }
  }, [id, state?.alerts]);

  if (error) {
    return (
      <div className="page-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: '20px', textAlign: 'center' }}>
        <h2 style={{ color: '#fff' }}>Alert not found</h2>
        <p style={{ color: 'var(--text-muted)' }}>The requested alert channel does not exist.</p>
        <button onClick={() => navigate('/dashboard')} className="btn btn-secondary" style={{ padding: '12px 24px', borderRadius: '12px' }}>
          Back to Hub
        </button>
      </div>
    );
  }

  if (!localAlert) return <div className="page-container"><p style={{color: 'var(--text-muted)'}}>Loading profile...</p></div>;

  const handleSave = () => {
    if (id === 'new') {
      dispatch({ type: 'ADD_ALERT', payload: localAlert });
    } else {
      dispatch({ type: 'UPDATE_ALERT', payload: localAlert });
    }
    navigate('/dashboard');
  };

  const updateActionConfig = (actionType, configUpdates) => {
    if (!localAlert?.actions) return;
    const updatedActions = localAlert.actions.map(a => 
      a.type === actionType ? { ...a, config: { ...a.config, ...configUpdates } } : a
    );
    setLocalAlert({ ...localAlert, actions: updatedActions });
  };

  const soundAction = localAlert?.actions?.find(a => a.type === 'SOUND')?.config || {};
  const hapticAction = localAlert?.actions?.find(a => a.type === 'HAPTIC')?.config || {};
  const visualAction = localAlert?.actions?.find(a => a.type === 'VISUAL')?.config || {};

  const handlePreviewSound = async () => {
    if (soundAction.soundId && soundAction.soundId !== 'mute') {
      await soundService.playSound({ soundId: soundAction.soundId, volume: soundAction.volume || 'NORMAL' }, { mode: 'REPLACE' });
    }
  };

  const handleTestHaptic = async () => {
    if (hapticAction.hapticPattern && hapticAction.hapticPattern !== 'NONE') {
      await hapticService.triggerHaptic({ hapticPattern: hapticAction.hapticPattern });
    }
  };

  const handleTestAlert = () => {
    handlePreviewSound();
    handleTestHaptic();
  };

  return (
    <div className="page-container animate-fade-in" style={{ paddingBottom: 'calc(140px + var(--safe-area-bottom))' }}>
      
      {/* Header Back Button & Page Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <button 
          onClick={() => {
            if (id !== 'new') {
              dispatch({ type: 'UPDATE_ALERT', payload: localAlert });
            }
            navigate(-1);
          }} 
          style={{ 
            background: 'rgba(255, 255, 255, 0.03)', 
            border: '1px solid rgba(255, 255, 255, 0.05)', 
            borderRadius: '50%', 
            width: '40px', 
            height: '40px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: '#fff', 
            cursor: 'pointer' 
          }}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#fff', margin: 0 }}>Configure Channel</h1>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Configure logic constraints & feedback</span>
        </div>
      </div>

      {/* Title & Enable Switch */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ flex: 1, marginRight: '16px' }}>
            <input 
              type="text" 
              value={localAlert.name} 
              onChange={(e) => setLocalAlert({ ...localAlert, name: e.target.value })}
              style={{ 
                fontFamily: 'var(--font-family-sans)',
                background: 'transparent', 
                border: 'none', 
                color: '#fff', 
                fontSize: '18px', 
                fontWeight: '700', 
                width: '100%', 
                outline: 'none'
              }} 
            />
            <span className="telemetry-label" style={{ display: 'block', marginTop: '4px' }}>Monitor Channel Name</span>
            {localAlert.trigger && localAlert.trigger.type && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px', alignItems: 'flex-start' }}>
                <div style={{
                  display: 'inline-flex', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase',
                  backgroundColor: `${getTriggerTier(localAlert.trigger.type).color}20`,
                  color: getTriggerTier(localAlert.trigger.type).color,
                  border: `1px solid ${getTriggerTier(localAlert.trigger.type).color}40`
                }}>
                  Reliability: {getTriggerTier(localAlert.trigger.type).label}
                </div>
                {localAlert.enabled && getTriggerTier(localAlert.trigger.type).tier === 2 && (
                  <span style={{ fontSize: '11px', color: '#F59E0B', fontStyle: 'italic' }}>
                    Works while AuraPing remains active in memory.
                  </span>
                )}
                {localAlert.enabled && getTriggerTier(localAlert.trigger.type).tier === 3 && (
                  <span style={{ fontSize: '11px', color: '#EF4444', fontStyle: 'italic' }}>
                    Works only while AuraPing is open.
                  </span>
                )}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button 
              type="button"
              onClick={() => {
                const updated = { ...localAlert, isFavorite: !localAlert.isFavorite };
                setLocalAlert(updated);
                if (id !== 'new') {
                  dispatch({ type: 'UPDATE_ALERT', payload: updated });
                }
              }}
              style={{ 
                background: 'transparent', 
                border: 'none', 
                cursor: 'pointer',
                color: localAlert.isFavorite ? 'var(--tech-cyan)' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px'
              }}
            >
              <Heart size={20} fill={localAlert.isFavorite ? 'var(--tech-cyan)' : 'transparent'} />
            </button>
            <Toggle initial={localAlert.enabled} onChange={(v) => {
              const updated = { ...localAlert, enabled: v };
              setLocalAlert(updated);
              if (id !== 'new') {
                dispatch({ type: 'UPDATE_ALERT', payload: updated });
              }
            }} />
          </div>
        </div>
      </div>

      {/* 1. TRIGGER SETTINGS */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Settings size={18} color="var(--tech-cyan)" />
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>Trigger Threshold</h3>
        </div>

        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Event Source: <strong style={{ color: '#fff', textTransform: 'uppercase' }}>{localAlert.trigger.type}</strong>
        </div>

        {/* Dynamic threshold fields based on trigger type */}
        {localAlert.trigger.type === 'BATTERY' && (
          <>
            <div style={{ marginBottom: '16px' }}>
              <span className="telemetry-label" style={{ display: 'block', marginBottom: '8px' }}>Comparison Operator</span>
              <select 
                style={{
                  fontFamily: 'var(--font-family-sans)',
                  width: '100%', padding: '12px 16px', backgroundColor: 'var(--surface-color-light)', border: '1px solid rgba(255, 255, 255, 0.05)', 
                  borderRadius: '12px', color: '#fff', fontSize: '14px', outline: 'none'
                }}
                value={localAlert.trigger.operator}
                onChange={(e) => setLocalAlert({ ...localAlert, trigger: { ...localAlert.trigger, operator: e.target.value }})}
              >
                <option value="LESS_THAN">LESS THAN (&lt;)</option>
                <option value="GREATER_THAN">GREATER THAN (&gt;)</option>
                <option value="EQUALS">EQUALS (=)</option>
              </select>
            </div>
            {localAlert.trigger.value !== 'OVERHEAT' ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span className="telemetry-label">Threshold Value</span>
                  <span className="telemetry-val" style={{ color: 'var(--tech-cyan)' }}>{localAlert.trigger.value}%</span>
                </div>
                <input 
                  type="range" 
                  className="input-slider" 
                  min="0" max="100" 
                  value={Number(localAlert.trigger.value) || 0} 
                  onChange={(e) => setLocalAlert({ ...localAlert, trigger: { ...localAlert.trigger, value: e.target.value }})}
                  style={{ margin: '8px 0' }}
                />
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic' }}>
                Triggers automatically when system thermal sensors report battery overheating.
              </div>
            )}
          </>
        )}

        {(localAlert.trigger.type === 'CHARGING' || localAlert.trigger.type === 'WIFI' || localAlert.trigger.type === 'BLUETOOTH') && (
          <div style={{ marginBottom: '16px' }}>
            <span className="telemetry-label" style={{ display: 'block', marginBottom: '8px' }}>Target State</span>
            <select 
              style={{
                fontFamily: 'var(--font-family-sans)',
                width: '100%', padding: '12px 16px', backgroundColor: 'var(--surface-color-light)', border: '1px solid rgba(255, 255, 255, 0.05)', 
                borderRadius: '12px', color: '#fff', fontSize: '14px', outline: 'none'
              }}
              value={localAlert.trigger.value}
              onChange={(e) => setLocalAlert({ ...localAlert, trigger: { ...localAlert.trigger, operator: 'EQUALS', value: e.target.value }})}
            >
              <option value="CONNECTED">CONNECTED</option>
              <option value="DISCONNECTED">DISCONNECTED</option>
            </select>
          </div>
        )}

        {localAlert.trigger.type === 'LOCATION' && (
          <div style={{ marginBottom: '16px' }}>
            <span className="telemetry-label" style={{ display: 'block', marginBottom: '8px' }}>Location Crossing Event</span>
            <select 
              style={{
                fontFamily: 'var(--font-family-sans)',
                width: '100%', padding: '12px 16px', backgroundColor: 'var(--surface-color-light)', border: '1px solid rgba(255, 255, 255, 0.05)', 
                borderRadius: '12px', color: '#fff', fontSize: '14px', outline: 'none'
              }}
              value={localAlert.trigger.value}
              onChange={(e) => setLocalAlert({ ...localAlert, trigger: { ...localAlert.trigger, operator: 'EQUALS', value: e.target.value }})}
            >
              <option value="ENTER">ENTER AREA</option>
              <option value="EXIT">EXIT AREA</option>
            </select>
          </div>
        )}

        {localAlert.trigger.type === 'MOTION' && (
          <div style={{ marginBottom: '16px' }}>
            <span className="telemetry-label" style={{ display: 'block', marginBottom: '8px' }}>Motion Event Trigger</span>
            <select 
              style={{
                fontFamily: 'var(--font-family-sans)',
                width: '100%', padding: '12px 16px', backgroundColor: 'var(--surface-color-light)', border: '1px solid rgba(255, 255, 255, 0.05)', 
                borderRadius: '12px', color: '#fff', fontSize: '14px', outline: 'none'
              }}
              value={localAlert.trigger.value}
              onChange={(e) => setLocalAlert({ ...localAlert, trigger: { ...localAlert.trigger, operator: 'EQUALS', value: e.target.value }})}
            >
              <option value="MOVED">PHONE MOVED / SHAKEN</option>
              <option value="PICKED_UP">PHONE PICKED UP</option>
              <option value="CLAP">CLAP DETECTED</option>
              <option value="LOUD_NOISE">LOUD NOISE</option>
            </select>
          </div>
        )}

        {localAlert.trigger.type === 'NOTIFICATION' && (
          <div>
            <span className="telemetry-label" style={{ display: 'block', marginBottom: '8px' }}>Filter Text (Notification Keyword)</span>
            <input 
              type="text"
              style={{
                fontFamily: 'var(--font-family-sans)',
                width: '100%', padding: '12px 16px', backgroundColor: 'var(--surface-color-light)', border: '1px solid rgba(255, 255, 255, 0.05)', 
                borderRadius: '12px', color: '#fff', fontSize: '13px', outline: 'none'
              }}
              value={localAlert.trigger.value}
              onChange={(e) => setLocalAlert({ ...localAlert, trigger: { ...localAlert.trigger, operator: 'CONTAINS', value: e.target.value }})}
              placeholder="e.g. wrong password, food, delivery..."
            />
          </div>
        )}

        {localAlert.trigger.type === 'OTP' && (
          <div style={{ color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic' }}>
            Intercepts verified one-time passwords from banking, secure SMS, or messaging notifications automatically.
          </div>
        )}

        {localAlert.trigger.type === 'SYSTEM' && (
          <div style={{ marginBottom: '16px' }}>
            <span className="telemetry-label" style={{ display: 'block', marginBottom: '8px' }}>System Trigger Condition</span>
            <select 
              style={{
                fontFamily: 'var(--font-family-sans)',
                width: '100%', padding: '12px 16px', backgroundColor: 'var(--surface-color-light)', border: '1px solid rgba(255, 255, 255, 0.05)', 
                borderRadius: '12px', color: '#fff', fontSize: '14px', outline: 'none'
              }}
              value={localAlert.trigger.value}
              onChange={(e) => setLocalAlert({ ...localAlert, trigger: { ...localAlert.trigger, operator: 'EQUALS', value: e.target.value }})}
            >
              <option value="SIM_CHANGED">SIM CARD REMOVED / CHANGED</option>
              <option value="LOW_STORAGE">STORAGE CAPACITY ALMOST FULL</option>
            </select>
          </div>
        )}

        {localAlert?.trigger?.type === 'REMINDER' && (
          <div>
            {(localAlert?.trigger?.value && String(localAlert.trigger.value).includes(':')) ? (
              <>
                <span className="telemetry-label" style={{ display: 'block', marginBottom: '8px' }}>Scheduled Alert Time</span>
                <input 
                  type="time"
                  style={{
                    fontFamily: 'var(--font-family-sans)',
                    width: '100%', padding: '12px 16px', backgroundColor: 'var(--surface-color-light)', border: '1px solid rgba(255, 255, 255, 0.05)', 
                    borderRadius: '12px', color: '#fff', fontSize: '14px', outline: 'none'
                  }}
                  value={localAlert.trigger.value}
                  onChange={(e) => setLocalAlert({ ...localAlert, trigger: { ...(localAlert.trigger || {}), operator: 'EQUALS', value: e.target.value }})}
                />
              </>
            ) : (
              <div>
                <span className="telemetry-label" style={{ display: 'block', marginBottom: '8px' }}>Scheduled Event Target</span>
                <select 
                  style={{
                    fontFamily: 'var(--font-family-sans)',
                    width: '100%', padding: '12px 16px', backgroundColor: 'var(--surface-color-light)', border: '1px solid rgba(255, 255, 255, 0.05)', 
                    borderRadius: '12px', color: '#fff', fontSize: '14px', outline: 'none'
                  }}
                  value={localAlert.trigger.value || ''}
                  onChange={(e) => setLocalAlert({ ...localAlert, trigger: { ...(localAlert.trigger || {}), operator: 'EQUALS', value: e.target.value }})}
                >
                  <option value="RAIN">RAIN / STORM FORECAST</option>
                  <option value="ISS">ISS FLYBY PASS</option>
                </select>
              </div>
            )}
          </div>
        )}

        {localAlert.trigger.type === 'AUDIO' && (
          <div style={{ marginBottom: '16px' }}>
            <span className="telemetry-label" style={{ display: 'block', marginBottom: '8px' }}>Audio Detection Target</span>
            <select 
              style={{
                fontFamily: 'var(--font-family-sans)',
                width: '100%', padding: '12px 16px', backgroundColor: 'var(--surface-color-light)', border: '1px solid rgba(255, 255, 255, 0.05)', 
                borderRadius: '12px', color: '#fff', fontSize: '14px', outline: 'none'
              }}
              value={localAlert.trigger.value}
              onChange={(e) => setLocalAlert({ ...localAlert, trigger: { ...localAlert.trigger, operator: 'EQUALS', value: e.target.value }})}
            >
              <option value="CLAP">CLAP DETECTED</option>
              <option value="LOUD_NOISE">LOUD NOISE</option>
            </select>
          </div>
        )}
      </div>

      {/* 2. AUDIO PROFILE */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Volume2 size={18} color="var(--tech-cyan)" />
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>Audio Feedback</h3>
        </div>

        <span className="telemetry-label" style={{ display: 'block', marginBottom: '8px' }}>Sound Alarm</span>
        {localAlert.category && localAlert.category !== 'custom' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', width: '100%' }}>
            {['soft', 'medium', 'critical'].map((level, idx) => {
              const categorySounds = (localAlert.category && SoundRegistry) ? SoundRegistry[localAlert.category] : null;
              const snd = categorySounds ? categorySounds[level] : {
                id: `${localAlert.category || 'default'}_${level}`,
                file: `${localAlert.category || 'default'}_${level}.mp3`,
                level: level.toUpperCase()
              };
              const isActive = (soundAction.soundId || '') === snd.id;
              const displayName = localAlert.name ? `${localAlert.name} ${idx + 1}` : `Sound ${idx + 1}`;
              return (
                <div 
                  key={snd.id || `fallback_${level}_${idx}`}
                  onClick={() => updateActionConfig('SOUND', { soundId: snd.id })}
                  style={{
                    padding: '14px 16px', borderRadius: '12px',
                    border: isActive ? '1px solid var(--tech-cyan)' : '1px solid rgba(255,255,255,0.05)',
                    backgroundColor: isActive ? 'rgba(35, 231, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                    color: isActive ? 'var(--tech-cyan)' : '#fff',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ fontSize: '14px', fontWeight: '600', fontFamily: 'var(--font-family-sans)' }}>{displayName}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); if (snd.id) soundService.playSound({ soundId: snd.id, volume: soundAction.volume || 'NORMAL' }, { mode: 'REPLACE' }); }}
                      style={{
                        backgroundColor: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        color: isActive ? 'var(--tech-cyan)' : 'var(--text-muted)', cursor: 'pointer', padding: '4px'
                      }}
                    >
                      <Play size={18} fill={isActive ? 'var(--tech-cyan)' : 'transparent'} />
                    </button>
                    <div style={{ 
                      width: '18px', height: '18px', borderRadius: '50%', 
                      border: isActive ? '5px solid var(--tech-cyan)' : '2px solid rgba(255,255,255,0.2)',
                      backgroundColor: 'transparent'
                    }} />
                  </div>
                </div>
              );
            })}
            <div 
              onClick={() => updateActionConfig('SOUND', { soundId: 'mute' })}
              style={{
                padding: '14px 16px', borderRadius: '12px',
                border: soundAction.soundId === 'mute' ? '1px solid var(--tech-cyan)' : '1px solid rgba(255,255,255,0.05)',
                backgroundColor: soundAction.soundId === 'mute' ? 'rgba(35, 231, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                color: soundAction.soundId === 'mute' ? 'var(--tech-cyan)' : 'var(--text-muted)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                transition: 'all 0.15s ease', marginTop: '4px'
              }}
            >
              <span style={{ fontSize: '14px', fontWeight: '600', fontFamily: 'var(--font-family-sans)' }}>MUTE (NO AUDIO)</span>
              <div style={{ 
                width: '18px', height: '18px', borderRadius: '50%', 
                border: soundAction.soundId === 'mute' ? '5px solid var(--tech-cyan)' : '2px solid rgba(255,255,255,0.2)'
              }} />
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', width: '100%' }}>
            <select 
              style={{
                fontFamily: 'var(--font-family-sans)',
                flex: 1, padding: '12px 16px', backgroundColor: 'var(--surface-color-light)', border: '1px solid rgba(255, 255, 255, 0.05)', 
                borderRadius: '12px', color: '#fff', fontSize: '14px', outline: 'none'
              }}
              value={soundAction.soundId || 'mute'}
              onChange={(e) => updateActionConfig('SOUND', { soundId: e.target.value })}
            >
              <option value="mute">MUTE (NO AUDIO)</option>
              {Object.keys(SoundRegistry || {}).map(catId => (
                <optgroup label={catId.replace('_', ' ').toUpperCase()} key={catId}>
                  <option value={SoundRegistry[catId].soft.id}>{catId.replace('_', ' ').toUpperCase()} 1</option>
                  <option value={SoundRegistry[catId].medium.id}>{catId.replace('_', ' ').toUpperCase()} 2</option>
                  <option value={SoundRegistry[catId].critical.id}>{catId.replace('_', ' ').toUpperCase()} 3</option>
                </optgroup>
              ))}
            </select>
            <button 
              onClick={handlePreviewSound}
              style={{
                backgroundColor: 'rgba(35, 231, 255, 0.08)', border: '1px solid rgba(35, 231, 255, 0.15)', borderRadius: '12px', 
                width: '46px', height: '46px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tech-cyan)', cursor: 'pointer'
              }}
            >
              <Play size={18} />
            </button>
          </div>
        )}

        {/* Alert Volume Low/Normal/Boosted Selector */}
        {soundAction.soundId !== 'mute' && (
          <div style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.02)', 
            padding: '14px 16px', 
            borderRadius: '14px',
            border: '1px dashed rgba(255, 255, 255, 0.05)'
          }}>
            <span className="telemetry-label" style={{ display: 'block', marginBottom: '8px' }}>Alert Volume</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['LOW', 'NORMAL', 'BOOSTED'].map((level) => {
                const isActive = (soundAction.volume || 'NORMAL') === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => updateActionConfig('SOUND', { volume: level })}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      borderRadius: '10px',
                      fontSize: '12px',
                      fontWeight: '600',
                      fontFamily: 'var(--font-family-sans)',
                      backgroundColor: isActive ? 'rgba(35, 231, 255, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                      color: isActive ? 'var(--tech-cyan)' : 'var(--text-muted)',
                      border: isActive ? '1px solid rgba(35, 231, 255, 0.25)' : '1px solid rgba(255, 255, 255, 0.05)',
                      cursor: 'pointer',
                      transition: 'all var(--transition-speed)'
                    }}
                  >
                    {level}
                  </button>
                );
              })}
            </div>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginTop: '8px' }}>
              Applies hardware-level gain normalization. Boosted increases driver output for quieter presets.
            </span>
          </div>
        )}
      </div>

      {/* 3. HAPTICS */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Vibrate size={18} color="var(--tech-cyan)" />
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>Haptic Rhythm</h3>
        </div>

        <span className="telemetry-label" style={{ display: 'block', marginBottom: '8px' }}>Vibration pattern</span>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select 
            style={{
              fontFamily: 'var(--font-family-sans)',
              flex: 1, padding: '12px 16px', backgroundColor: 'var(--surface-color-light)', border: '1px solid rgba(255, 255, 255, 0.05)', 
              borderRadius: '12px', color: '#fff', fontSize: '14px', outline: 'none'
            }}
            value={hapticAction.hapticPattern || 'NONE'}
            onChange={(e) => updateActionConfig('HAPTIC', { hapticPattern: e.target.value })}
          >
            {Object.keys(HapticRegistry || {}).map(h => (
              <option key={h} value={h}>{h.replace('_', ' ').toUpperCase()}</option>
            ))}
            <option value="NONE">NONE (NO VIBRATION)</option>
          </select>
          <button 
            onClick={handleTestHaptic}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '12px', 
              width: '46px', height: '46px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer'
            }}
          >
            <Vibrate size={18} />
          </button>
        </div>
      </div>

      {/* 4. CRITICALITY LEVEL */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Bell size={18} color="var(--accent-color)" />
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>Criticality Override</h3>
        </div>

        <select 
          style={{
            fontFamily: 'var(--font-family-sans)',
            width: '100%', padding: '12px 16px', backgroundColor: 'var(--surface-color-light)', border: '1px solid rgba(255, 255, 255, 0.05)', 
            borderRadius: '12px', color: '#fff', fontSize: '14px', outline: 'none'
          }}
          value={localAlert.priority || 'MEDIUM'}
          onChange={(e) => setLocalAlert({ ...localAlert, priority: e.target.value })}
        >
          <option value="LOW">LOW (BACKGROUND EVENT)</option>
          <option value="MEDIUM">MEDIUM (STANDARD TELEMETRY)</option>
          <option value="HIGH">HIGH (ALERT OVERRIDE)</option>
          <option value="CRITICAL">CRITICAL (BYPASS SYSTEM DND)</option>
        </select>
      </div>

      {/* 5. VISUAL PROFILE */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Maximize size={18} color="var(--tech-cyan)" />
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>Visual Alerts</h3>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <span className="telemetry-label" style={{ display: 'block', marginBottom: '8px' }}>Notification Overlay</span>
          <select 
            style={{
              fontFamily: 'var(--font-family-sans)',
              width: '100%', padding: '12px 16px', backgroundColor: 'var(--surface-color-light)', border: '1px solid rgba(255, 255, 255, 0.05)', 
              borderRadius: '12px', color: '#fff', fontSize: '14px', outline: 'none'
            }}
            value={visualAction.visualStyle || 'BANNER'}
            onChange={(e) => updateActionConfig('VISUAL', { visualStyle: e.target.value })}
          >
            <option value="BANNER">HEADS-UP SYSTEM BANNER</option>
            <option value="POPUP">TELEMETRY SYSTEM POPUP</option>
            <option value="FULLSCREEN">FULLSCREEN CONSOLE TAKEOVER</option>
          </select>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span className="telemetry-label" style={{ display: 'block' }}>Persistent Repeat</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Repeat alerts until manually dismissed</span>
          </div>
          <Toggle initial={visualAction.repeat || false} onChange={(v) => updateActionConfig('VISUAL', { repeat: v })} />
        </div>
      </div>

      {/* Docked Control Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
        <button 
          onClick={handleTestAlert}
          className="btn btn-secondary"
          style={{ flex: 1, padding: '16px 8px', borderRadius: '16px', fontSize: '13px', fontWeight: '600' }}
        >
          Test Run
        </button>
        <button 
          onClick={handleSave}
          className="btn"
          style={{ flex: 2, padding: '16px 8px', borderRadius: '16px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          <Save size={16} /> Save Changes
        </button>
      </div>
    </div>
  );
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error('[AlertDetail ErrorBoundary]', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="page-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: '20px', textAlign: 'center', padding: '20px' }}>
          <h2 style={{ color: '#fff' }}>Configuration failed to load</h2>
          <p style={{ color: 'var(--text-muted)' }}>An error occurred while loading this alert channel.</p>
          <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '300px' }}>
            <button onClick={() => window.location.reload()} className="btn" style={{ flex: 1, padding: '12px' }}>
              Retry
            </button>
            <button onClick={() => window.history.back()} className="btn btn-secondary" style={{ flex: 1, padding: '12px' }}>
              Back
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function AlertDetailSafe() {
  return (
    <ErrorBoundary>
      <AlertDetail />
    </ErrorBoundary>
  );
}
