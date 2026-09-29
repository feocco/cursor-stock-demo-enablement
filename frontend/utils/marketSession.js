const WEEKDAYS = new Set(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])

const SESSIONS = {
  open: { status: 'open', label: 'Market open' },
  preMarket: { status: 'pre-market', label: 'Pre-market' },
  afterHours: { status: 'after-hours', label: 'After hours' },
  closed: { status: 'closed', label: 'Market closed' },
}

const OPEN_START = 9 * 60 + 30
const OPEN_END = 16 * 60
const PRE_MARKET_START = 4 * 60
const AFTER_HOURS_END = 20 * 60

/**
 * US equity session for a given instant, evaluated in Eastern Time.
 * Regular hours are 9:30–16:00, pre-market 4:00–9:30, after hours 16:00–20:00.
 * Weekends are closed.
 */
export const getMarketSession = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)

  const lookup = {}
  parts.forEach((part) => {
    if (part.type !== 'literal') {
      lookup[part.type] = part.value
    }
  })

  const weekday = lookup.weekday
  let hour = Number(lookup.hour)
  const minute = Number(lookup.minute)

  if (hour === 24) {
    hour = 0
  }

  if (!WEEKDAYS.has(weekday) || !Number.isFinite(hour) || !Number.isFinite(minute)) {
    return SESSIONS.closed
  }

  const minutes = hour * 60 + minute

  if (minutes >= OPEN_START && minutes < OPEN_END) {
    return SESSIONS.open
  }

  if (minutes >= PRE_MARKET_START && minutes < OPEN_START) {
    return SESSIONS.preMarket
  }

  if (minutes >= OPEN_END && minutes < AFTER_HOURS_END) {
    return SESSIONS.afterHours
  }

  return SESSIONS.closed
}
