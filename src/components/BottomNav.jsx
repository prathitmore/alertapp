import { NavLink } from 'react-router-dom';
import { Home, Sliders, History, Settings } from 'lucide-react';

export default function BottomNav() {
  return (
    <div className="bottom-nav">
      <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Home size={20} />
        <span>Home</span>
      </NavLink>
      
      <NavLink to="/builder" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Sliders size={20} />
        <span>Builder</span>
      </NavLink>

      <NavLink to="/history" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <History size={20} />
        <span>History</span>
      </NavLink>
      
      <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Settings size={20} />
        <span>Settings</span>
      </NavLink>
    </div>
  );
}
