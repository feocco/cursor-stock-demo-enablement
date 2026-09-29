import { useEffect, useState } from 'react'
import { getMarketSession } from '../../utils/marketSession'

const pillStyles = {
  open: 'bg-gain/10 text-gain border-gain/30',
  'pre-market': 'bg-accent/10 text-accent border-accent/30',
  'after-hours': 'bg-accent/10 text-accent border-accent/30',
  closed: 'bg-surface-raised text-text-muted border-border',
}

const dotStyles = {
  open: 'bg-gain',
  'pre-market': 'bg-accent',
  'after-hours': 'bg-accent',
  closed: 'bg-text-muted',
}

const MarketStatus = ({ compact = false }) => {
  const [session, setSession] = useState(() => getMarketSession())

  useEffect(() => {
    const refresh = () => setSession(getMarketSession())
    const intervalId = setInterval(refresh, 60 * 1000)
    return () => clearInterval(intervalId)
  }, [])

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-lg border font-medium ${pillStyles[session.status]} ${
        compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm'
      }`}
      role="status"
      data-testid="market-status"
      data-session={session.status}
      title="US equity session, Eastern Time"
      aria-label={`${session.label}. US equity session, Eastern Time.`}
    >
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${dotStyles[session.status]} ${
          session.status === 'open' ? 'animate-pulse motion-reduce:animate-none' : ''
        }`}
        aria-hidden="true"
      />
      <span className="whitespace-nowrap">{session.label}</span>
    </div>
  )
}

export default MarketStatus
