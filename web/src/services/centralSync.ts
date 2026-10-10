/**
 * Central Cloud Synchronization Engine
 * Connects all devices (phones, laptops, PCs, tablets) to a single shared system
 * and central cloud message bus so any change made on any device is instantly
 * applied across all users and devices in real time.
 */

const SYNC_TOPIC = 'agrimarket-central-sync-soccsksargen'
const NTFY_BASE = 'https://ntfy.sh'

// Unique client identifier for this tab/device to prevent processing own echoes
const DEVICE_CLIENT_ID = `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

export type SyncEventType =
  | 'ORDER_CREATED'
  | 'ORDER_STATUS_UPDATED'
  | 'PRODUCT_ADDED'
  | 'PRODUCT_UPDATED'
  | 'PRODUCT_STOCK_UPDATED'
  | 'APPLICATION_SUBMITTED'
  | 'APPLICATION_REVIEWED'
  | 'MESSAGE_SENT'
  | 'NOTIFICATION_CREATED'
  | 'REVIEW_ADDED'
  | 'POST_CREATED'
  | 'TRADE_CREATED'
  | 'TRADE_STATUS_UPDATED'
  | 'FULL_CATALOG_SYNC'

export interface SyncPayload {
  type: SyncEventType
  clientId: string
  timestamp: number
  data: any
}

type SyncHandler = (payload: SyncPayload) => void

const listeners = new Set<SyncHandler>()
const processedMessageIds = new Set<string>()

// Same-device multi-tab broadcast channel
let localBroadcastChannel: BroadcastChannel | null = null
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    localBroadcastChannel = new BroadcastChannel('agrimarket_cross_tab_sync')
    localBroadcastChannel.onmessage = (event) => {
      const payload = event.data as SyncPayload
      if (payload && payload.clientId !== DEVICE_CLIENT_ID) {
        listeners.forEach((listener) => {
          try {
            listener(payload)
          } catch (err) {
            console.error('Local sync handler error:', err)
          }
        })
      }
    }
  } catch (err) {
    console.warn('BroadcastChannel initialization fallback:', err)
  }
}

/**
 * Publish an action to the cloud central bus so all devices worldwide receive it.
 */
export const publishSyncEvent = async (type: SyncEventType, data: any): Promise<void> => {
  const payload: SyncPayload = {
    type,
    clientId: DEVICE_CLIENT_ID,
    timestamp: Date.now(),
    data,
  }

  // 1. Broadcast locally to other tabs immediately
  if (localBroadcastChannel) {
    try {
      localBroadcastChannel.postMessage(payload)
    } catch {
      // Ignore local broadcast errors
    }
  }

  // 2. Broadcast to central cloud pub-sub for all connected phones & computers
  try {
    await fetch(`${NTFY_BASE}/${SYNC_TOPIC}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Title: `Sync: ${type}`,
      },
      body: JSON.stringify(payload),
    })
  } catch (err) {
    console.warn('Central cloud sync publish warning:', err)
  }
}

/**
 * Subscribe to real-time events published from any device.
 */
export const subscribeToSync = (handler: SyncHandler): (() => void) => {
  listeners.add(handler)
  return () => {
    listeners.delete(handler)
  }
}

let eventSource: EventSource | null = null
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null

const handleRawMessage = (rawJson: string) => {
  try {
    const parsed = JSON.parse(rawJson)
    // ntfy wraps the payload in parsed.message if stringified
    let content: SyncPayload | null = null

    if (parsed.message) {
      try {
        content = JSON.parse(parsed.message) as SyncPayload
      } catch {
        content = parsed as unknown as SyncPayload
      }
    } else if (parsed.type) {
      content = parsed as SyncPayload
    }

    if (!content || !content.type || content.clientId === DEVICE_CLIENT_ID) {
      return
    }

    const dedupeKey = `${content.type}-${content.timestamp}-${content.clientId}`
    if (processedMessageIds.has(dedupeKey)) return
    processedMessageIds.add(dedupeKey)
    if (processedMessageIds.size > 200) {
      const first = processedMessageIds.values().next().value
      if (first) processedMessageIds.delete(first)
    }

    listeners.forEach((listener) => {
      try {
        listener(content!)
      } catch (e) {
        console.error('Error invoking sync listener:', e)
      }
    })
  } catch {
    // Ignore non-json or heartbeat messages
  }
}

/**
 * Initialize connection to the shared cloud central database
 */
export const initCentralSync = () => {
  if (typeof window === 'undefined') return

  // 1. Fetch recent events from the last 24h to synchronize initial state
  const catchupRecentEvents = async () => {
    try {
      const response = await fetch(`${NTFY_BASE}/${SYNC_TOPIC}/json?since=24h&poll=1`)
      if (!response.ok) return
      const text = await response.text()
      const lines = text.trim().split('\n')
      lines.forEach((line) => {
        if (line) handleRawMessage(line)
      })
    } catch {
      // Offline or network issue, fallback to localStorage
    }
  }

  void catchupRecentEvents()

  // 2. Open continuous Server-Sent Events (SSE) connection for instant push updates
  const connectSSE = () => {
    if (eventSource) {
      try {
        eventSource.close()
      } catch {
        // Ignore close error
      }
    }

    try {
      eventSource = new EventSource(`${NTFY_BASE}/${SYNC_TOPIC}/sse`)

      eventSource.onmessage = (event) => {
        if (event.data) {
          handleRawMessage(event.data)
        }
      }

      eventSource.onerror = () => {
        if (eventSource) {
          eventSource.close()
          eventSource = null
        }
        if (!reconnectTimeout) {
          reconnectTimeout = setTimeout(() => {
            reconnectTimeout = null
            connectSSE()
          }, 5000)
        }
      }
    } catch (e) {
      console.warn('SSE connection initialization error, polling fallback active:', e)
    }
  }

  connectSSE()

  // 3. Periodic fallback poll every 8 seconds in case SSE drops on mobile cellular
  const pollInterval = setInterval(() => {
    void catchupRecentEvents()
  }, 8000)

  return () => {
    if (eventSource) eventSource.close()
    if (reconnectTimeout) clearTimeout(reconnectTimeout)
    clearInterval(pollInterval)
  }
}
