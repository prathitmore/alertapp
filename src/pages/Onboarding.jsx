import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Zap, LayoutTemplate, Bell, Activity, Cpu } from 'lucide-react';
import { useAlerts } from '../context/AlertContext';

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const { dispatch } = useAlerts();

  const slides = [
    {
      stepLabel: "Getting Started",
      icon: <Activity size={36} color="var(--tech-cyan)" />,
      title: "Welcome to AuraPing",
      desc: "An intelligent, high-frequency, local alert engine designed for absolute Android background reliability. Let's initialize the telemetry pipeline."
    },
    {
      stepLabel: "Background Service",
      icon: <ShieldAlert size={36} color="var(--accent-color)" />,
      title: "Background Persistence",
      desc: "To prevent Android from killing active audio alert pipelines, AuraPing requires unrestricted battery usage permissions and notification access."
    },
    {
      stepLabel: "OEM Exclusions",
      icon: <Cpu size={36} color="var(--primary-color)" />,
      title: "Device Specific Settings",
      desc: "Samsung, Xiaomi, Oppo, and Vivo devices enforce aggressive memory optimizations. Please enable Autostart and exclude AuraPing from Sleeping Apps."
    },
    {
      stepLabel: "Ready to Monitor",
      icon: <LayoutTemplate size={36} color="var(--tech-cyan)" />,
      title: "Choose Channels",
      desc: "Choose from predefined event templates (Battery Full, Wi-Fi Drop, OTP Intercept) or build custom channels directly in the rule console."
    }
  ];

  const handleFinish = () => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: { onboarded: true } });
    localStorage.setItem('auraping_onboarded', 'true');
    navigate('/dashboard');
  };

  return (
    <div className="page-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100dvh', justifyContent: 'space-between', paddingBottom: '32px' }}>
      
      {/* Step indicator tag */}
      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '16px' }}>
        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--tech-cyan)' }}>
          {slides[step].stepLabel}
        </span>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Setup {step + 1} of {slides.length}
        </span>
      </div>

      {/* Main Slide Card */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', margin: '20px 0' }}>
        <div style={{ 
          marginBottom: '24px', 
          padding: '20px', 
          backgroundColor: 'rgba(255, 255, 255, 0.02)', 
          borderRadius: '50%', 
          border: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--tech-cyan)'
        }}>
          {slides[step].icon}
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '12px', color: '#fff' }}>
          {slides[step].title}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6', padding: '0 8px', maxWidth: '340px' }}>
          {slides[step].desc}
        </p>
      </div>

      {/* Slide Dot Indicator */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
        {slides.map((_, i) => (
          <div key={i} style={{
            width: '6px', height: '6px', borderRadius: '50%',
            backgroundColor: i === step ? 'var(--tech-cyan)' : 'rgba(255, 255, 255, 0.1)',
            boxShadow: i === step ? '0 0 8px var(--tech-cyan)' : 'none',
            transition: 'background-color 0.2s'
          }} />
        ))}
      </div>

      {/* Footer Navigation Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          {step > 0 && (
            <button className="btn btn-secondary" style={{ flex: 1, padding: '16px', borderRadius: '16px', fontSize: '13px', fontWeight: '600' }} onClick={() => setStep(step - 1)}>
              Back
            </button>
          )}
          {step < slides.length - 1 ? (
            <button className="btn" style={{ flex: 2, padding: '16px', borderRadius: '16px', fontSize: '13px', fontWeight: '600' }} onClick={() => setStep(step + 1)}>
              Next
            </button>
          ) : (
            <button className="btn" style={{ flex: 2, padding: '16px', borderRadius: '16px', fontSize: '13px', fontWeight: '600' }} onClick={handleFinish}>
              Get Started
            </button>
          )}
        </div>
        
        {step < slides.length - 1 && (
          <button 
            style={{ 
              background: 'none', border: 'none', color: 'var(--text-muted)', 
              fontSize: '12px', fontWeight: '500',
              padding: '8px', cursor: 'pointer', textAlign: 'center'
            }} 
            onClick={handleFinish}
          >
            Skip setup
          </button>
        )}
      </div>
      
    </div>
  );
}
