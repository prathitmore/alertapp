export const initialState = {
  version: 1,
  alerts: [],
  logs: [],
  templates: [],
  searchState: {
    query: '',
    activeFilter: 'ALL', // 'ALL', 'ACTIVE', 'FAVORITES', 'CRITICAL', 'RECENT'
  },
  settings: {
    darkMode: true,
    reducedMotion: false,
    onboarded: false,
  },
  selectedAlert: null,
};

const saveState = (state) => {
  try {
    const storedState = localStorage.getItem('auraping_state_v2');
    console.log('[DEBUG GUARD] Storage load/save: Loaded state from localStorage', !!storedState);
    const stateToSave = {
      alerts: state.alerts,
      logs: state.logs,
      settings: state.settings
    };
    localStorage.setItem('auraping_state_v2', JSON.stringify(stateToSave));
    console.log('[DEBUG GUARD] Storage load/save: Saved state to localStorage');
  } catch (e) {
    console.error('Failed to save state to localStorage', e);
  }
};

// Removed old saveAlerts and saveLogs

export function AlertReducer(state, action) {
  switch (action.type) {
    case 'INIT_DATA': {
      let loadedAlerts = action.payload.alerts || [];
      let loadedLogs = action.payload.logs || [];
      let loadedSettings = { ...state.settings };
      
      try {
        const storedState = localStorage.getItem('auraping_state_v2');
        if (storedState) {
          const parsed = JSON.parse(storedState);
          if (Array.isArray(parsed.alerts)) loadedAlerts = parsed.alerts;
          if (Array.isArray(parsed.logs)) loadedLogs = parsed.logs;
          if (parsed.settings) loadedSettings = { ...loadedSettings, ...parsed.settings };
        } else {
          // Check old v1 storage for migration
          const oldAlerts = localStorage.getItem('auraping_alerts_v1');
          const oldLogs = localStorage.getItem('auraping_logs_v1');
          if (oldAlerts) loadedAlerts = JSON.parse(oldAlerts);
          if (oldLogs) loadedLogs = JSON.parse(oldLogs);
          
          const newState = { alerts: loadedAlerts, logs: loadedLogs, settings: loadedSettings };
          localStorage.setItem('auraping_state_v2', JSON.stringify(newState));
        }
      } catch (e) {
        console.error('Failed to read state from localStorage', e);
      }

      return {
        ...state,
        alerts: loadedAlerts,
        logs: loadedLogs,
        settings: loadedSettings,
        templates: action.payload.templates || [],
      };
    }
      
    case 'ADD_ALERT': {
      const nextAlerts = [action.payload, ...state.alerts];
      const nextState = { ...state, alerts: nextAlerts };
      saveState(nextState);
      return nextState;
    }
      
    case 'UPDATE_ALERT': {
      const nextAlerts = state.alerts.map(alert => 
        alert.id === action.payload.id ? { ...alert, ...action.payload, updatedAt: new Date().toISOString() } : alert
      );
      const nextState = { ...state, alerts: nextAlerts };
      saveState(nextState);
      return nextState;
    }
      
    case 'DELETE_ALERT': {
      const nextAlerts = state.alerts.filter(alert => alert.id !== action.payload);
      const nextState = { ...state, alerts: nextAlerts };
      saveState(nextState);
      return nextState;
    }
      
    case 'TOGGLE_ALERT': {
      const nextAlerts = state.alerts.map(alert => 
        alert.id === action.payload ? { ...alert, enabled: !alert.enabled, updatedAt: new Date().toISOString() } : alert
      );
      const nextState = { ...state, alerts: nextAlerts };
      saveState(nextState);
      return nextState;
    }
      
    case 'FAVORITE_ALERT': {
      const nextAlerts = state.alerts.map(alert => 
        alert.id === action.payload ? { ...alert, isFavorite: !alert.isFavorite, updatedAt: new Date().toISOString() } : alert
      );
      const nextState = { ...state, alerts: nextAlerts };
      saveState(nextState);
      return nextState;
    }
      
    case 'APPLY_FILTER':
      return {
        ...state,
        searchState: { ...state.searchState, activeFilter: action.payload },
      };
      
    case 'SET_SEARCH':
      return {
        ...state,
        searchState: { ...state.searchState, query: action.payload },
      };
      
    case 'LOAD_TEMPLATE': {
      const newAlertFromTemplate = {
        ...action.payload,
        id: `alert_${Date.now()}`,
        enabled: true,
        isTemplate: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const nextAlerts = [newAlertFromTemplate, ...state.alerts];
      const nextState = { ...state, alerts: nextAlerts };
      saveState(nextState);
      return nextState;
    }
      
    case 'ADD_LOG': {
      const nextLogs = [action.payload, ...state.logs];
      const nextState = { ...state, logs: nextLogs };
      saveState(nextState);
      return nextState;
    }
      
    case 'CLEAR_LOGS': {
      const nextState = { ...state, logs: [] };
      saveState(nextState);
      return nextState;
    }
      
    case 'UPDATE_SETTINGS': {
      const nextSettings = { ...state.settings, ...action.payload };
      const nextState = { ...state, settings: nextSettings };
      saveState(nextState);
      return nextState;
    }
      
    case 'SET_SELECTED_ALERT':
      return {
        ...state,
        selectedAlert: action.payload,
      };

    default:
      return state;
  }
}
