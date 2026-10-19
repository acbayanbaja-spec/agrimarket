/**
 * In-Browser Cross-Tab Synchronization Engine
 * Securely synchronizes UI state across tabs in the same browser via BroadcastChannel.
 * Completely purged of external public third-party pub/sub topics (ntfy.sh).
 * All authoritative cross-device synchronization occurs over authenticated backend Socket.IO.
 */

// Unique client identifier for this tab/device to prevent processing own echoes
const DEVICE_CLIENT_ID = `tab-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export type SyncEventType =
  | 'ORDER_CREATED'
  | 'ORDER_STATUS_UPDATED'
  | 'ORDER_ITEM_PREP_UPDATED'
  | 'ORDER_PACKED'
  | 'PRODUCT_ADDED'
  | 'PRODUCT_UPDATED'
  | 'PRODUCT_STOCK_UPDATED'
  | 'PRODUCT_DELETED'
  | 'APPLICATION_SUBMITTED'
  | 'APPLICATION_REVIEWED'
  | 'MESSAGE_SENT'
  | 'NOTIFICATION_CREATED'
  | 'REVIEW_ADDED'
  | 'POST_CREATED'
  | 'TRADE_CREATED'
  | 'TRADE_STATUS_UPDATED'
  | 'FULL_CATALOG_SYNC';

export interface SyncPayload {
  type: SyncEventType;
  clientId: string;
  timestamp: number;
  data: any;
}

type SyncHandler = (payload: SyncPayload) => void;

const listeners = new Set<SyncHandler>();
const processedMessageIds = new Set<string>();

// Same-device multi-tab broadcast channel (strictly local to browser)
let localBroadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    localBroadcastChannel = new BroadcastChannel('agrimarket_local_tab_sync');
    localBroadcastChannel.onmessage = (event) => {
      const payload = event.data as SyncPayload;
      if (payload && payload.clientId !== DEVICE_CLIENT_ID) {
        const dedupeKey = `${payload.type}-${payload.timestamp}-${payload.clientId}`;
        if (processedMessageIds.has(dedupeKey)) return;
        processedMessageIds.add(dedupeKey);
        if (processedMessageIds.size > 200) {
          const first = processedMessageIds.values().next().value;
          if (first) processedMessageIds.delete(first);
        }

        listeners.forEach((listener) => {
          try {
            listener(payload);
          } catch (err) {
            console.error('Local sync handler error:', err);
          }
        });
      }
    };
  } catch (err) {
    console.warn('BroadcastChannel initialization fallback:', err);
  }
}

/**
 * Publish an action to local browser tabs.
 */
export const publishSyncEvent = async (type: SyncEventType, data: any): Promise<void> => {
  const payload: SyncPayload = {
    type,
    clientId: DEVICE_CLIENT_ID,
    timestamp: Date.now(),
    data,
  };

  if (localBroadcastChannel) {
    try {
      localBroadcastChannel.postMessage(payload);
    } catch {
      // Ignore local broadcast errors
    }
  }
};

/**
 * Subscribe to local tab events.
 */
export const subscribeToSync = (handler: SyncHandler): (() => void) => {
  listeners.add(handler);
  return () => {
    listeners.delete(handler);
  };
};

/**
 * Initialize cross-tab synchronization.
 */
export const initCentralSync = () => {
  // Returns cleanup callback
  return () => {
    // No-op cleanup for local broadcast
  };
};
