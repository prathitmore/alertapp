import { useState, useEffect } from 'react';
import Toggle from '../components/Toggle';
import foregroundService from '../services/foregroundService';
import { diagnosticsService } from '../services/diagnosticsService';
import { useAlerts } from '../context/AlertContext';
import { Activity, ShieldAlert, Battery, Smartphone, Settings2, Download, Upload, Info } from 'lucide-react';

export default function Settings() {
  const { state, dispatch } = useAlerts();
  const [batteryStatus, setBatteryStatus] = useState('Checking...');
  const [isRestricted, setIsRestricted] = useState(false);
  const [diagnostics, setDiagnostics] = useState(diagnosticsService.getStats());

  const settings = state.settings || { darkMode: true, reducedMotion: false };

  useEffect(() => {
    const fetchBatteryStatus = async () => {
      const res = await foregroundService.checkBatteryOptimization();
      setBatteryStatus(res.restricted ? 'Restricted' : 'Optimized');
      setIsRestricted(res.restricted);
    };
    fetchBatteryStatus();
  }, []);

  const handleFixBattery = () => {
    foregroundService.requestIgnoreBatteryOptimization();
  };

  const handleClearDiagnostics = () => {
    diagnosticsService.clear();
    setDiagnostics(diagnosticsService.getStats());
  };

  const activeMonitorsCount = state.alerts.filter(a => a.enabled).length;
  const criticalMonitorsCount = state.alerts.filter(a => a.enabled && (a.priority === 'CRITICAL' || a.priority === 'HIGH')).length;
  const healthObj = foregroundService.getHealthState();

  const getHealthColor = (status) => {
    switch (status) {
      case 'HEALTHY': return '#10b981';
      case 'DEGRADED': return 'var(--accent-color)';
      case 'RECOVERING': return 'var(--primary-color)';
      case 'FAILED': return 'var(--accent-color)';
      default: return 'var(--text-muted)';
    }
  };

  const SettingsRow = ({ label, value, action, color = 'var(--text-color)' }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
      <span style={{ color: '#fff', fontSize: '14px', fontWeight: '500' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ color, fontSize: '14px', fontWeight: '600' }}>{value}</span>
        {action}
      </div>
    </div>
  );

  return (
    <div className="page-container animate-fade-in" style={{ paddingBottom: 'calc(140px + var(--safe-area-bottom))' }}>
      
      {/* Title */}
      <h1 className="screen-title" style={{ fontSize: '26px', fontWeight: '800', marginBottom: '24px' }}>
        Settings
      </h1>

      {/* Permissions & OEM Card */}
      <div className="card" style={{ padding: '0 20px', overflow: 'hidden' }}>
        <div style={{ padding: '20px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.04)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldAlert size={18} color="var(--accent-color)" />
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>Permissions & Background Health</h3>
        </div>
        
        <SettingsRow 
          label="Battery Optimization" 
          value={batteryStatus} 
          color={isRestricted ? 'var(--accent-color)' : '#10b981'}
          action={isRestricted && <button className="btn" style={{ padding: '6px 12px', width: 'auto', borderRadius: '8px', fontSize: '11px', fontWeight: '600' }} onClick={handleFixBattery}>Fix</button>}
        />
        <SettingsRow 
          label="Notification Access" 
          value="Active Polling" 
          color="#10b981" 
        />
        
        <div style={{ padding: '16px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
          <span className="telemetry-label" style={{ display: 'block', color: '#fff', marginBottom: '6px' }}>OEM Autostart Configuration</span>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            To prevent system termination on Xiaomi, Oppo, and Vivo devices, ensure manual Autostart permissions are enabled in Android system settings.
          </p>
        </div>
        
        <div style={{ padding: '16px 0' }}>
          <span className="telemetry-label" style={{ display: 'block', color: '#fff', marginBottom: '6px' }}>Sleeping Apps Exclusion</span>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            On Samsung flagships, exclude AuraPing from the 'Put unused apps to sleep' restriction block to guarantee zero-latency alerts.
          </p>
        </div>
      </div>

      {/* Monitoring Health */}
      <div className="card" style={{ padding: '0 20px', overflow: 'hidden' }}>
        <div style={{ padding: '20px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.04)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Activity size={18} color="var(--tech-cyan)" />
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>System Telemetry Health</h3>
        </div>
        <SettingsRow label="Monitoring Status" value={activeMonitorsCount > 0 ? 'Active' : 'Idle'} color={activeMonitorsCount > 0 ? 'var(--tech-cyan)' : 'var(--text-muted)'} />
        <SettingsRow label="Background Mode" value={criticalMonitorsCount > 0 ? 'Foreground Service' : 'Standard'} color="var(--text-muted)" />
        <SettingsRow label="Listener Service" value={healthObj.status} color={getHealthColor(healthObj.status)} />
      </div>

      {/* Diagnostics */}
      <div className="card" style={{ padding: '0 20px', overflow: 'hidden' }}>
        <div style={{ padding: '20px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Settings2 size={18} color="var(--tech-cyan)" />
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>Diagnostics & Telemetry Logs</h3>
          </div>
          <button className="btn btn-secondary" style={{ padding: '6px 12px', width: 'auto', borderRadius: '8px', fontSize: '11px', fontWeight: '600' }} onClick={handleClearDiagnostics}>Clear</button>
        </div>
        <SettingsRow label="Missed Triggers" value={diagnostics.missedTriggers} color="var(--text-muted)" />
        <SettingsRow label="Failed Playbacks" value={diagnostics.failedPlayback} color="var(--accent-color)" />
        <SettingsRow label="Fallback Audio Triggers" value={diagnostics.fallbackUsage} color="var(--accent-color)" />
        <SettingsRow label="Listener Service Degradations" value={diagnostics.listenerDegradation} color="var(--text-muted)" />
      </div>

      {/* Appearance & Sound */}
      <div className="card" style={{ padding: '0 20px' }}>
        <div style={{ padding: '18px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
          <Toggle 
            label="Dark Mode Interface" 
            initial={settings.darkMode} 
            onChange={(val) => dispatch({ type: 'UPDATE_SETTINGS', payload: { darkMode: val } })}
          />
        </div>
        <div style={{ padding: '18px 0' }}>
          <Toggle 
            label="Reduced UI Motion" 
            initial={settings.reducedMotion} 
            onChange={(val) => dispatch({ type: 'UPDATE_SETTINGS', payload: { reducedMotion: val } })}
          />
        </div>
      </div>

      <div className="card" style={{ padding: '20px' }}>
        <SettingsRow label="Internal Sound Library" value="84 / 84 Assets loaded" color="var(--tech-cyan)" />
      </div>

      {/* Config Backups */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button className="btn btn-secondary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px', borderRadius: '16px', fontSize: '13px', fontWeight: '600' }}>
          <Download size={16} /> Export Config
        </button>
        <button className="btn btn-secondary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px', borderRadius: '16px', fontSize: '13px', fontWeight: '600' }}>
          <Upload size={16} /> Import Config
        </button>
      </div>

      <div style={{ textAlign: 'center', padding: '20px', opacity: 0.5 }}>
        <Info size={16} style={{ marginBottom: '6px' }} />
        <p style={{ fontSize: '12px' }}>AuraPing v1.0.0-Beta</p>
      </div>
      
    </div>
  );
}
