import { useState, useEffect, useCallback, useRef } from 'react'
import { getAlerts, checkAlerts, requestNotificationPermission } from '../utils/priceAlerts'

const CHECK_INTERVAL_MS = 30000

export const usePriceAlerts = (quotes) => {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [permissionStatus, setPermissionStatus] = useState('default')
  const [triggeredAlerts, setTriggeredAlerts] = useState([])
  const requestId = useRef(0)
  const quotesRef = useRef(quotes)
  quotesRef.current = quotes
  const quoteCount = quotes ? Object.keys(quotes).length : 0

  const refreshAlerts = useCallback(async () => {
    const id = ++requestId.current

    try {
      const loadedAlerts = await getAlerts()
      if (id !== requestId.current) {
        return loadedAlerts
      }
      setAlerts(loadedAlerts)
      setError(null)
      return loadedAlerts
    } catch (err) {
      if (id === requestId.current) {
        setError(err.message || 'Failed to load price alerts')
      }
      return null
    } finally {
      if (id === requestId.current) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    refreshAlerts()

    if ('Notification' in window) {
      setPermissionStatus(Notification.permission)
    } else {
      setPermissionStatus('unsupported')
    }
  }, [refreshAlerts])

  const requestPermission = useCallback(async () => {
    const permission = await requestNotificationPermission()
    setPermissionStatus(permission)
    return permission
  }, [])

  useEffect(() => {
    if (quoteCount === 0) {
      return undefined
    }

    let cancelled = false

    const checkAndNotify = async () => {
      const currentQuotes = quotesRef.current
      if (!currentQuotes || Object.keys(currentQuotes).length === 0) {
        return
      }

      try {
        const triggered = await checkAlerts(currentQuotes, (alert, currentPrice) => {
          if (cancelled) {
            return
          }
          setTriggeredAlerts((prev) => [...prev, { ...alert, currentPrice, triggeredAt: new Date() }])
        })

        if (!cancelled && triggered.length > 0) {
          await refreshAlerts()
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to check price alerts')
        }
      }
    }

    checkAndNotify()

    const intervalId = setInterval(checkAndNotify, CHECK_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(intervalId)
    }
  }, [quoteCount, refreshAlerts])

  const dismissTriggeredAlert = useCallback((alertId) => {
    setTriggeredAlerts((prev) => prev.filter((alert) => alert.id !== alertId))
  }, [])

  return {
    alerts,
    loading,
    error,
    triggeredAlerts,
    permissionStatus,
    refreshAlerts,
    requestPermission,
    dismissTriggeredAlert,
  }
}
