// HAPPENIN — OFFLINE DETECTION & QUEUE MANAGEMENT
// Uses tokens from offline-tokens.json and retry-tokens.json

import { useState, useEffect } from 'react';
import { retryConfig, QueuedAction } from './motion.config';
import { openDB, DBSchema, IDBPDatabase } from 'idb';

const PING_INTERVAL = 5000;
const OFFLINE_TIMEOUT = 4000;
const DB_NAME = 'happenin_offline';
const DB_VERSION = 1;
const QUEUE_STORE = 'action_queue';

// IndexedDB Schema
interface HappeninDB extends DBSchema {
  action_queue: {
    key: string;
    value: QueuedAction;
    indexes: { 'by-type': string; 'by-created': number };
  };
}

// Initialize IndexedDB
async function getDB(): Promise<IDBPDatabase<HappeninDB>> {
  return openDB<HappeninDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        const store = db.createObjectStore(QUEUE_STORE, { keyPath: 'id' });
        store.createIndex('by-type', 'type');
        store.createIndex('by-created', 'createdAt');
      }
    },
  });
}

// OFFLINE DETECTION HOOK
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Ping check every 5s
    const pingInterval = setInterval(async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), OFFLINE_TIMEOUT);

        await fetch('/api/health', {
          method: 'HEAD',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        setIsOnline(true);
      } catch {
        setIsOnline(false);
      }
    }, PING_INTERVAL);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(pingInterval);
    };
  }, []);

  return isOnline;
}

// RETRY WITH EXPONENTIAL BACKOFF
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  actionName: string = 'Action'
): Promise<T> {
  let attempt = 0;

  while (attempt < retryConfig.maxAttempts) {
    try {
      return await fn();
    } catch (error) {
      attempt++;

      if (attempt >= retryConfig.maxAttempts) {
        console.error(`${actionName} failed after ${retryConfig.maxAttempts} attempts`);
        throw error;
      }

      const delay = Math.min(
        retryConfig.backoff.initial * Math.pow(retryConfig.backoff.multiplier, attempt - 1),
        retryConfig.backoff.max
      );

      console.log(`${actionName} attempt ${attempt} failed. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error(`${actionName} exhausted all retry attempts`);
}

// ACTION QUEUE MANAGEMENT (IndexedDB)
export async function getActionQueue(): Promise<QueuedAction[]> {
  try {
    const db = await getDB();
    return await db.getAll(QUEUE_STORE);
  } catch (error) {
    console.error('Failed to get action queue:', error);
    return [];
  }
}

export async function addToQueue(action: Omit<QueuedAction, 'id' | 'createdAt' | 'retryCount'>): Promise<void> {
  try {
    const db = await getDB();
    const newAction: QueuedAction = {
      ...action,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      retryCount: 0,
    };
    await db.add(QUEUE_STORE, newAction);
  } catch (error) {
    console.error('Failed to add to queue:', error);
  }
}

export async function removeFromQueue(actionId: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete(QUEUE_STORE, actionId);
  } catch (error) {
    console.error('Failed to remove from queue:', error);
  }
}

export async function clearQueue(): Promise<void> {
  try {
    const db = await getDB();
    await db.clear(QUEUE_STORE);
  } catch (error) {
    console.error('Failed to clear queue:', error);
  }
}

// PROCESS QUEUE WHEN BACK ONLINE
export async function processQueue(
  handlers: {
    REGISTER_EVENT?: (payload: any) => Promise<void>;
    SAVE_PROFILE?: (payload: any) => Promise<void>;
    ADD_MEMBERSHIP?: (payload: any) => Promise<void>;
  }
): Promise<void> {
  const queue = await getActionQueue();
  const db = await getDB();

  for (const action of queue) {
    const handler = handlers[action.type];
    if (!handler) continue;

    try {
      await handler(action.payload);
      await removeFromQueue(action.id);
    } catch (error) {
      console.error(`Failed to process queued action ${action.id}:`, error);
      
      // Increment retry count
      const updatedAction = { ...action, retryCount: action.retryCount + 1 };
      
      // Remove if max retries exceeded
      if (updatedAction.retryCount >= retryConfig.maxAttempts) {
        await removeFromQueue(action.id);
      } else {
        await db.put(QUEUE_STORE, updatedAction);
      }
    }
  }
}

/**
 * DISASTER SCENARIO: Internet drop mid-registration
 * 
 * Preserve registration intent locally so user doesn't lose work
 * Automatically retries when back online
 */
export async function saveRegistrationIntent(data: {
  eventId: string;
  ticketType: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  await addToQueue({
    type: 'REGISTER_EVENT',
    payload: data,
  });
}

/**
 * Get last saved registration intent (for resuming)
 */
export async function getLastRegistrationIntent(): Promise<{
  eventId: string;
  ticketType: string;
  metadata?: Record<string, any>;
} | null> {
  const queue = await getActionQueue();
  const registrationAction = queue.find(a => a.type === 'REGISTER_EVENT');
  
  if (registrationAction) {
    return registrationAction.payload;
  }
  
  return null;
}
