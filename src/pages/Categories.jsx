import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAlerts } from '../context/AlertContext';
import Toggle from '../components/Toggle';
import { ChevronRight, ArrowLeft, Shield } from 'lucide-react';
import * as Icons from 'lucide-react';
import { CategoryRegistry } from '../data/registries';

export default function Categories() {
  const navigate = useNavigate();
  const { state, dispatch } = useAlerts();
  const { alerts } = state;

  const handleToggleAlert = (id, newState) => {
    dispatch({ type: 'TOGGLE_ALERT', payload: id });
  };

  const groups = [
    {
      title: 'Power & System',
      color: '#FFB800',
      ids: ['battery_full', 'low_battery', 'charger_connected', 'charger_disconnected', 'overheat', 'low_storage']
    },
    {
      title: 'Connectivity',
      color: '#23E7FF',
      ids: ['wifi_connected', 'wifi_lost', 'bt_connected', 'bt_lost', 'sim_changed']
    },
    {
      title: 'Context & Messaging',
      color: '#A855F7',
      ids: ['otp_detected', 'keyword_detected', 'wrong_password', 'cab_nearby', 'food_delivery_nearby', 'cash_received']
    },
    {
      title: 'Location & Motion',
      color: '#10B981',
      ids: ['location_entered', 'location_exited', 'phone_moved', 'phone_picked_up']
    },
    {
      title: 'Reminders & Ambient',
      color: '#F43F5E',
      ids: ['wakeup_alarm_loop', 'sleep_reminder', 'water_reminder', 'clap_detect', 'loud_noise', 'rain_alert', 'iss_pass']
    }
  ];

  return (
    <div className="page-container animate-fade-in" style={{ paddingBottom: '90px' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button 
          onClick={() => navigate('/dashboard')}
          style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '12px', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#fff'
          }}
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: 0 }}>
            Alert Channels
          </h1>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Grouped view of all 28 core telemetry alerts
          </span>
        </div>
      </div>

      {/* GROUPS LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {groups.map((group) => (
          <div key={group.title}>
            {/* Group Title Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ 
                width: '6px', height: '6px', borderRadius: '50%', backgroundColor: group.color,
                boxShadow: `0 0 8px ${group.color}`
              }} />
              <span style={{ 
                fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' 
              }}>
                {group.title}
              </span>
            </div>

            {/* Group Cards List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {group.ids.map(catId => {
                // Find matching predefined alert in state
                const alert = alerts.find(a => a.category === catId);
                if (!alert) return null;

                // Find category info for icon
                const catInfo = CategoryRegistry.find(c => c.id === catId) || { name: alert.name, icon: 'Bell' };
                const IconComponent = Icons[catInfo.icon] || Icons.Bell;

                return (
                  <div 
                    key={alert.id}
                    className={`card ${alert.enabled ? 'active-card' : ''}`}
                    onClick={() => navigate(`/alert/${alert.id}`)}
                    style={{ 
                      margin: 0, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                      cursor: 'pointer', transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        backgroundColor: alert.enabled ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.01)',
                        border: alert.enabled ? `1px solid rgba(255,255,255,0.1)` : '1px solid rgba(255,255,255,0.03)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: alert.enabled ? group.color : 'var(--text-muted)',
                        boxShadow: alert.enabled ? `0 0 10px ${group.color}15` : 'none'
                      }}>
                        <IconComponent size={16} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#fff', margin: 0 }}>
                          {alert.name}
                        </h4>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          Priority: {alert.priority}
                        </span>
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
        ))}
      </div>

    </div>
  );
}
