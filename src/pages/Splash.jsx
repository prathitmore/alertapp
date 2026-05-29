import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity } from 'lucide-react';

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      let onboarded = false;
      try {
        const stateStr = localStorage.getItem('auraping_state_v2');
        if (stateStr) {
          const stateObj = JSON.parse(stateStr);
          if (stateObj.settings?.onboarded) {
            onboarded = true;
          }
        }
      } catch (e) {}
      
      // Migration fallback
      if (!onboarded && localStorage.getItem('auraping_onboarded') === 'true') {
        onboarded = true;
      }

      if (onboarded) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div style={{
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100dvh',
      backgroundColor: 'var(--bg-color)',
      color: 'var(--tech-cyan)',
      backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(35, 231, 255, 0.04) 0%, transparent 60%)'
    }}>
      <div style={{
        backgroundColor: 'rgba(35, 231, 255, 0.08)',
        border: '1px solid rgba(35, 231, 255, 0.15)',
        padding: '24px',
        borderRadius: '24px',
        boxShadow: '0 0 32px rgba(35, 231, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'fadeIn 0.6s ease'
      }}>
        <Activity size={48} color="var(--tech-cyan)" />
      </div>
      <h1 style={{ marginTop: '24px', fontWeight: '800', letterSpacing: '-0.5px', color: '#fff', fontSize: '26px' }}>
        AuraPing
      </h1>
      <p style={{ color: 'var(--text-muted)', marginTop: '6px', fontSize: '13px', fontWeight: '500' }}>
        Telemetry & Alerts Console
      </p>
    </div>
  );
}
