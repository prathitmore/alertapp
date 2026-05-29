import React, { createContext, useReducer, useEffect, useContext } from 'react';
import { AlertReducer, initialState } from './AlertReducer';
import { MockAlerts, MockLogs } from '../data/mockData';
import { TemplateRegistry } from '../data/registries';
import EngineService from '../services/EngineService';
import foregroundService from '../services/foregroundService';

export const AlertContext = createContext();

export const useAlerts = () => useContext(AlertContext);

export const AlertProvider = ({ children }) => {
  const [state, dispatch] = useReducer(AlertReducer, initialState);

  // Initialize with mock data
  useEffect(() => {
    dispatch({ 
      type: 'INIT_DATA', 
      payload: { 
        alerts: MockAlerts, 
        logs: MockLogs, 
        templates: TemplateRegistry 
      } 
    });
  }, []);

  // Initialize engine once
  useEffect(() => {
    EngineService.init(dispatch);
    
    let capacitorListener = null;

    // Use Capacitor App lifecycle listeners if native
    const isNative = window.Capacitor && window.Capacitor.isNativePlatform();
    if (isNative) {
      import('@capacitor/app').then(({ App }) => {
        capacitorListener = App.addListener('appStateChange', (stateInfo) => {
          if (stateInfo.isActive) {
            foregroundService.rehydrateEngine(dispatch, EngineService, state.alerts);
          }
        });
      });
    }

    // Always keep browser fallback for cross-platform robustness
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        foregroundService.rehydrateEngine(dispatch, EngineService, state.alerts);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      EngineService.cleanup();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (capacitorListener) {
        capacitorListener.then(l => l.remove());
      }
    };
  }, [state.alerts]); // Depend on state.alerts for recovery referencing

  // Sync rules to engine & evaluate foreground requirement
  useEffect(() => {
    EngineService.updateRules(state.alerts);
    foregroundService.syncForegroundState(state.alerts);
  }, [state.alerts]);

  return (
    <AlertContext.Provider value={{ state, dispatch }}>
      {children}
    </AlertContext.Provider>
  );
};
