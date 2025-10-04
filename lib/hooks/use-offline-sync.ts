'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface OfflineAction {
  id: string;
  type: 'render' | 'project' | 'gallery-action';
  data: any;
  timestamp: number;
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingActions, setPendingActions] = useState<OfflineAction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingActions();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // Initial check
    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load pending actions from IndexedDB
    loadPendingActions();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadPendingActions = async () => {
    try {
      const actions = await getPendingActionsFromDB();
      setPendingActions(actions);
    } catch (error) {
      console.error('Failed to load pending actions:', error);
    }
  };

  const queueAction = useCallback(async (action: Omit<OfflineAction, 'id' | 'timestamp'>) => {
    const newAction: OfflineAction = {
      ...action,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };

    try {
      await saveActionToDB(newAction);
      setPendingActions(prev => [...prev, newAction]);
      
      if (isOnline) {
        // Try to sync immediately if online
        await syncAction(newAction);
      } else {
        toast.info('Action queued for sync when online');
      }
    } catch (error) {
      console.error('Failed to queue action:', error);
      toast.error('Failed to save action');
    }
  }, [isOnline]);

  const syncAction = async (action: OfflineAction) => {
    try {
      let response: Response;

      switch (action.type) {
        case 'render':
          response = await fetch('/api/renders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(action.data),
          });
          break;
        case 'project':
          response = await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(action.data),
          });
          break;
        case 'gallery-action':
          response = await fetch(action.data.url, {
            method: action.data.method,
            headers: action.data.headers,
            body: action.data.body,
          });
          break;
        default:
          throw new Error('Unknown action type');
      }

      if (response.ok) {
        await removeActionFromDB(action.id);
        setPendingActions(prev => prev.filter(a => a.id !== action.id));
        return true;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to sync action:', error);
      throw error;
    }
  };

  const syncPendingActions = async () => {
    if (pendingActions.length === 0) return;

    setIsSyncing(true);
    let syncedCount = 0;
    let failedCount = 0;

    try {
      for (const action of pendingActions) {
        try {
          await syncAction(action);
          syncedCount++;
        } catch (error) {
          failedCount++;
          console.error(`Failed to sync action ${action.id}:`, error);
        }
      }

      if (syncedCount > 0) {
        toast.success(`${syncedCount} actions synced successfully`);
      }
      if (failedCount > 0) {
        toast.error(`${failedCount} actions failed to sync`);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const clearPendingActions = async () => {
    try {
      await clearAllActionsFromDB();
      setPendingActions([]);
      toast.success('Pending actions cleared');
    } catch (error) {
      console.error('Failed to clear pending actions:', error);
      toast.error('Failed to clear pending actions');
    }
  };

  return {
    isOnline,
    pendingActions,
    isSyncing,
    queueAction,
    syncPendingActions,
    clearPendingActions,
  };
}

// IndexedDB helpers
async function getPendingActionsFromDB(): Promise<OfflineAction[]> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('wentire-offline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['actions'], 'readonly');
      const store = transaction.objectStore('actions');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('actions')) {
        db.createObjectStore('actions', { keyPath: 'id' });
      }
    };
  });
}

async function saveActionToDB(action: OfflineAction): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('wentire-offline', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['actions'], 'readwrite');
      const store = transaction.objectStore('actions');
      const addRequest = store.add(action);
      
      addRequest.onsuccess = () => resolve();
      addRequest.onerror = () => reject(addRequest.error);
    };
    
    request.onerror = () => reject(request.error);
  });
}

async function removeActionFromDB(id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('wentire-offline', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['actions'], 'readwrite');
      const store = transaction.objectStore('actions');
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };
    
    request.onerror = () => reject(request.error);
  });
}

async function clearAllActionsFromDB(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('wentire-offline', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['actions'], 'readwrite');
      const store = transaction.objectStore('actions');
      const clearRequest = store.clear();
      
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    };
    
    request.onerror = () => reject(request.error);
  });
}
