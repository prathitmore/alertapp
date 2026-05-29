import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAlerts } from '../context/AlertContext';
import { generateMockAlertId } from '../utils/helpers';
import { CategoryRegistry } from '../data/registries';
import { ArrowLeft, Cpu, Shield, AlertTriangle, Play, Volume2 } from 'lucide-react';
import { soundService } from '../services/soundService';

export default function CustomBuilder() {
  const navigate = useNavigate();
  const { dispatch } = useAlerts();

  const [triggerType, setTriggerType] = useState('BATTERY_LOW');
  const [triggerValue, setTriggerValue] = useState('20');
  const [priority, setPriority] = useState('MEDIUM');
  const [actionType, setActionType] = useState('SOUND');
  const [volume, setVolume] = useState('NORMAL');
  const [condition, setCondition] = useState('NONE');

  const handleCreate = () => {
    const formattedTriggerType = triggerType.toLowerCase();
    const newAlert = {
      id: generateMockAlertId(),
      name: `System ${triggerType.replace('_', ' ')} Monitor`.toUpperCase(),
      category: formattedTriggerType,
      enabled: true,
      isTemplate: false,
      priority,
      trigger: { type: triggerType, operator: 'EQUALS', value: triggerValue },
      conditions: condition !== 'NONE' ? [condition] : [],
      actions: [
        { type: actionType, config: { soundId: `${formattedTriggerType}_medium`, volume } },
        { type: 'HAPTIC', config: { hapticPattern: 'DOUBLE_PULSE' } },
        { type: 'VISUAL', config: { visualStyle: 'BANNER', repeat: false } }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    dispatch({ type: 'ADD_ALERT', payload: newAlert });
    navigate('/dashboard');
  };

  const handlePreviewSound = async () => {
    const soundId = `${triggerType.toLowerCase()}_medium`;
    await soundService.playSound({ soundId, volume }, { mode: 'REPLACE' });
  };

  return (
    <div className="page-container animate-fade-in" style={{ paddingBottom: 'calc(140px + var(--safe-area-bottom))' }}>
      
      {/* Header Back Button & Page Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <button 
          onClick={() => navigate(-1)} 
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
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#fff', margin: 0 }}>Rule Builder</h1>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Build custom hardware telemetry rules</span>
        </div>
      </div>

      {/* STEP 01: IF (Trigger source) */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Cpu size={18} color="var(--tech-cyan)" />
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>1. Hardware Trigger</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <span className="telemetry-label" style={{ display: 'block', marginBottom: '6px' }}>Telemetry Node</span>
            <select 
              style={{
                fontFamily: 'var(--font-family-sans)',
                width: '100%', padding: '12px 16px', backgroundColor: 'var(--surface-color-light)', border: '1px solid rgba(255, 255, 255, 0.05)', 
                borderRadius: '12px', color: '#fff', fontSize: '14px', outline: 'none'
              }} 
              value={triggerType} 
              onChange={(e) => setTriggerType(e.target.value)}
            >
              {CategoryRegistry.map(cat => (
                <option key={cat.id} value={cat.id.toUpperCase()}>{cat.name.toUpperCase()}</option>
              ))}
            </select>
          </div>

          <div>
            <span className="telemetry-label" style={{ display: 'block', marginBottom: '6px' }}>Trigger Value Threshold</span>
            <input 
              type="text" 
              placeholder="e.g. 20, or network SSID" 
              value={triggerValue}
              onChange={(e) => setTriggerValue(e.target.value)}
              style={{
                fontFamily: 'var(--font-family-sans)',
                width: '100%', padding: '12px 16px', 
                backgroundColor: 'var(--surface-color-light)', border: '1px solid rgba(255, 255, 255, 0.05)', 
                borderRadius: '12px', color: '#fff', fontSize: '14px', outline: 'none'
              }} 
            />
          </div>
        </div>
      </div>

      {/* STEP 02: AND (Condition limits) */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Shield size={18} color="var(--text-muted)" />
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>2. Context Constraints</h3>
        </div>

        <select 
          style={{
            fontFamily: 'var(--font-family-sans)',
            width: '100%', padding: '12px 16px', backgroundColor: 'var(--surface-color-light)', border: '1px solid rgba(255, 255, 255, 0.05)', 
            borderRadius: '12px', color: '#fff', fontSize: '14px', outline: 'none'
          }} 
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
        >
          <option value="NONE">NO CONTEXTUAL CONSTRAINTS</option>
          <option value="NIGHT_ONLY">NIGHT ONLY (22:00 - 07:00)</option>
          <option value="CHARGING_ONLY">ONLY WHILE DEVICE CHARGING</option>
          <option value="BATTERY_ONLY">ONLY WHILE DISCHARGING</option>
        </select>
      </div>

      {/* STEP 03: THEN (Action pipeline) */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <AlertTriangle size={18} color="var(--accent-color)" />
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>3. Action Pipeline</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <span className="telemetry-label" style={{ display: 'block', marginBottom: '6px' }}>Output Pipeline Mode</span>
            <select 
              style={{
                fontFamily: 'var(--font-family-sans)',
                width: '100%', padding: '12px 16px', backgroundColor: 'var(--surface-color-light)', border: '1px solid rgba(255, 255, 255, 0.05)', 
                borderRadius: '12px', color: '#fff', fontSize: '14px', outline: 'none'
              }}
              value={actionType}
              onChange={(e) => setActionType(e.target.value)}
            >
              <option value="SOUND">PLAY AUDIO + FIRING HAPTICS</option>
              <option value="HAPTIC">FIRING HAPTICS ONLY</option>
              <option value="VISUAL">VISUAL SYSTEM OVERLAY POPUP</option>
            </select>
          </div>

          {actionType === 'SOUND' && (
            <div style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.02)', 
              padding: '14px 16px', 
              borderRadius: '14px',
              border: '1px dashed rgba(255, 255, 255, 0.05)',
              marginBottom: '4px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="telemetry-label">Alert Volume Level</span>
                <button 
                  onClick={handlePreviewSound}
                  style={{
                    backgroundColor: 'rgba(35, 231, 255, 0.08)', border: '1px solid rgba(35, 231, 255, 0.15)', borderRadius: '8px', 
                    padding: '4px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--tech-cyan)', cursor: 'pointer'
                  }}
                >
                  <Play size={12} /> Preview
                </button>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['LOW', 'NORMAL', 'BOOSTED'].map((level) => {
                  const isActive = volume === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setVolume(level)}
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
            </div>
          )}

          <div>
            <span className="telemetry-label" style={{ display: 'block', marginBottom: '6px' }}>Priority Level Class</span>
            <select 
              style={{
                fontFamily: 'var(--font-family-sans)',
                width: '100%', padding: '12px 16px', backgroundColor: 'var(--surface-color-light)', border: '1px solid rgba(255, 255, 255, 0.05)', 
                borderRadius: '12px', color: '#fff', fontSize: '14px', outline: 'none'
              }}
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="LOW">LOW (SILENT BACKGROUND)</option>
              <option value="MEDIUM">MEDIUM (STANDARD TELEMETRY)</option>
              <option value="HIGH">HIGH (BYPASS STANDARD MUTE)</option>
              <option value="CRITICAL">CRITICAL (BYPASS SYSTEM DND)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Commit button */}
      <div style={{ marginTop: '24px' }}>
        <button 
          className="btn" 
          onClick={handleCreate}
          style={{ padding: '18px 24px', borderRadius: '16px', fontWeight: '700' }}
        >
          Build & Initialize Rule
        </button>
      </div>

    </div>
  );
}
