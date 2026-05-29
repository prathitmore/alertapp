import { useState } from 'react';
import { useAlerts } from '../context/AlertContext';
import { CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';

export default function History() {
  const { state } = useAlerts();
  const { logs, alerts } = state;
  const [filter, setFilter] = useState('ALL');

  const filteredLogs = logs.filter(log => {
    if (filter === 'ALL') return true;
    return log.status === filter;
  });

  const getAlertName = (alertId) => {
    const alert = alerts.find(a => a.id === alertId);
    return alert ? alert.name : 'Unknown Channel';
  };

  const formatTime = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const filters = ['ALL', 'SUCCESS', 'MISSED', 'FAILED'];

  return (
    <div className="page-container animate-fade-in" style={{ paddingBottom: 'calc(140px + var(--safe-area-bottom))' }}>
      
      {/* Title */}
      <h1 className="screen-title" style={{ fontSize: '26px', fontWeight: '800', marginBottom: '24px' }}>
        Event Logger
      </h1>

      {/* Filter Control Chips */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
        {filters.map(f => (
          <button 
            key={f}
            style={{ 
              fontFamily: 'var(--font-family-sans)',
              padding: '10px 20px', borderRadius: '24px', flexShrink: 0, fontWeight: '600', fontSize: '13px',
              backgroundColor: filter === f ? 'transparent' : 'rgba(255, 255, 255, 0.03)',
              color: filter === f ? 'var(--tech-cyan)' : 'var(--text-muted)',
              border: filter === f ? '1px solid var(--tech-cyan)' : '1px solid rgba(255, 255, 255, 0.05)', 
              transition: 'all var(--transition-speed)',
              cursor: 'pointer'
            }}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Event Feed List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', border: '1px dashed rgba(255, 255, 255, 0.08)', borderRadius: '24px' }}>
            <Clock size={22} color="var(--text-muted)" style={{ opacity: 0.5, marginBottom: '12px' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No events logged under this filter</p>
          </div>
        ) : (
          filteredLogs.map(log => {
            let statusText = 'Unknown';
            let statusColor = 'var(--text-muted)';
            let statusBg = 'rgba(255, 255, 255, 0.04)';
            
            if (log.status === 'SUCCESS') {
              statusText = 'Success';
              statusColor = '#10b981';
              statusBg = 'rgba(16, 185, 129, 0.08)';
            } else if (log.status === 'MISSED') {
              statusText = 'Missed';
              statusColor = 'var(--accent-color)';
              statusBg = 'rgba(255, 51, 75, 0.08)';
            } else if (log.status === 'FAILED') {
              statusText = 'Failed';
              statusColor = '#f59e0b';
              statusBg = 'rgba(245, 158, 11, 0.08)';
            }

            return (
              <div 
                key={log.id} 
                className="card animate-fade-in" 
                style={{ 
                  margin: 0, 
                  padding: '18px 20px', 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: '14px',
                  borderColor: log.status === 'SUCCESS' ? 'rgba(35, 231, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)'
                }}
              >
                <span className={`dot-indicator ${log.status === 'SUCCESS' ? 'green' : log.status === 'MISSED' ? 'red' : 'yellow'}`} style={{ marginTop: '6px' }} />
                
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <span style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>
                      {getAlertName(log.alertId)}
                    </span>
                    {/* Monospace ONLY for timestamps */}
                    <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '-0.2px' }}>
                      {formatTime(log.timestamp)}
                    </span>
                  </div>
                  
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.4', marginBottom: '8px' }}>
                    {log.details}
                  </p>
                  
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ 
                      fontSize: '10px', 
                      fontWeight: '700', 
                      padding: '2px 8px', 
                      borderRadius: '12px', 
                      backgroundColor: statusBg, 
                      color: statusColor,
                      border: '1px solid rgba(255, 255, 255, 0.03)'
                    }}>
                      {statusText}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
