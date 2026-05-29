import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Splash from './pages/Splash';
import Onboarding from './pages/Onboarding';
import AlertsHub from './pages/AlertsHub';
import Categories from './pages/Categories';
import AlertDetail from './pages/AlertDetail';
import CustomBuilder from './pages/CustomBuilder';
import History from './pages/History';
import Settings from './pages/Settings';
import BottomNav from './components/BottomNav';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Full screen pages without bottom nav */}
        <Route path="/" element={<Splash />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/alert/:id" element={<AlertDetail />} />
        <Route path="/builder" element={<CustomBuilder />} />
        
        {/* Pages with bottom nav */}
        <Route path="/dashboard" element={<WithNav><AlertsHub /></WithNav>} />
        <Route path="/categories" element={<WithNav><Categories /></WithNav>} />
        <Route path="/history" element={<WithNav><History /></WithNav>} />
        <Route path="/settings" element={<WithNav><Settings /></WithNav>} />
      </Routes>
    </BrowserRouter>
  );
}

function WithNav({ children }) {
  return (
    <>
      {children}
      <BottomNav />
    </>
  );
}

export default App;
