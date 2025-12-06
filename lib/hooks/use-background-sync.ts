'use client';

import { useState, useEffect, useCallback } from 'react';
import { isBackgroundSyncSupported, isOnline } from '@/lib/utils/pwa';

interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
  timestamp: number;
}

export function useBackgroundSync() {
  const [isSupported, setIsSupported] = useState(false);
  const [queueLength, setQueueLength] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    setIsSupported(isBackgroundSyncSupported());
    
    // Load queue length from IndexedDB
    loadQueueLength();
    
    // Listen for sync events
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSyncMessage);
    }

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSyncMessage);
      }
    };
  }, []);

  const handleSyncMessage = (event: MessageEvent) => {
    if (event.data?.type === 'SYNC_SUCCESS') {
      loadQueueLength();
    }
  };

  const loadQueueLength = async () => {
    try {
      const db = await openDB();
      const queue = await getAllFromQueue(db);
      setQueueLength(queue.length);
    } catch (error) {
      console.error('Error loading queue length:', error);
    }
  };

  const queueRequest = useCallback(async (
    url: string,
    method: string = 'POST',
    headers: Record<string, string> = {},
    body?: string
  ): Promise<string> => {
    if (!isSupported) {
      throw new Error('Background sync is not supported');
    }

    const request: QueuedRequest = {
      id: crypto.randomUUID(),
      url,
      method,
      headers,
      body,
      timestamp: Date.now(),
    };

    try {
      const db = await openDB();
      await addToQueue(db, request);
      setQueueLength((prev) => prev + 1);

      // Register sync if online
      if (isOnline() && 'serviceWorker' in navigator && 'sync' in (ServiceWorkerRegistration.prototype as any)) {
        const registration = await navigator.serviceWorker.ready;
        await (registration as any).sync.register('sync-queue');
      }

      return request.id;
    } catch (error) {
      console.error('Error queueing request:', error);
      throw error;
    }
  }, [isSupported]);

  const syncNow = useCallback(async () => {
    if (!isSupported || !isOnline()) {
      return;
    }

    setIsSyncing(true);
    try {
      if ('serviceWorker' in navigator && 'sync' in (ServiceWorkerRegistration.prototype as any)) {
        const registration = await navigator.serviceWorker.ready;
        await (registration as any).sync.register('sync-queue');
      }
      await loadQueueLength();
    } catch (error) {
      console.error('Error syncing:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isSupported]);

  return {
    isSupported,
    queueLength,
    isSyncing,
    queueRequest,
    syncNow,
  };
}

// IndexedDB helpers
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('renderiq-sync-queue', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('queue')) {
        db.createObjectStore('queue', { keyPath: 'id', autoIncrement: false });
      }
    };
  });
}

function getAllFromQueue(db: IDBDatabase): Promise<QueuedRequest[]> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['queue'], 'readonly');
    const store = transaction.objectStore('queue');
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function addToQueue(db: IDBDatabase, request: QueuedRequest): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['queue'], 'readwrite');
    const store = transaction.objectStore('queue');
    const addRequest = store.add(request);

    addRequest.onerror = () => reject(addRequest.error);
    addRequest.onsuccess = () => resolve();
  });
}




