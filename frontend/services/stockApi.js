// Stock API service using Finnhub (free tier: 60 req/min)
// Sign up at https://finnhub.io for a free API key

const API_KEY = import.meta.env.VITE_FINNHUB_API_KEY || 'demo'
const BASE_URL = 'https://finnhub.io/api/v1';
const BACKEND_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

// Cache to reduce API calls
const cache = new Map()
const CACHE_DURATION = 5000 // 5 seconds

const getCached = (key) => {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }
  return null
}

const setCache = (key, data) => {
  cache.set(key, { data, timestamp: Date.now() })
}

// Helper: Generate deterministic fallback quote
const generateFallbackQuote = (symbol) => {
  const seed = Array.from(symbol).reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const basePrice = 100 + (seed % 200) // Base price between 100-300
  
  // Small bounded drift: up to 0.3% per 5-second interval using timestamp
  const intervalsSinceEpoch = Math.floor(Date.now() / 5000)
  const driftSeed = seed + intervalsSinceEpoch
  const driftPercent = ((driftSeed % 60) - 30) / 10000 // -0.3% to +0.3%
  const currentPrice = basePrice * (1 + driftPercent)
  
  const change = currentPrice * 0.012 * ((seed % 3) - 1) // -1.2%, 0%, or +1.2%
  const previousClose = currentPrice - change
  const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0
  
  return {
    symbol,
    currentPrice,
    change,
    changePercent,
    high: Math.max(currentPrice, previousClose) + currentPrice * 0.01,
    low: Math.min(currentPrice, previousClose) - currentPrice * 0.01,
    open: previousClose + change * 0.2,
    previousClose,
    timestamp: Date.now()
  }
}

// Helper: Generate deterministic fallback profile
const generateFallbackProfile = (symbol) => {
  const companyNames = {
    'AAPL': 'Apple Inc.',
    'GOOGL': 'Alphabet Inc.',
    'MSFT': 'Microsoft Corporation',
    'AMZN': 'Amazon.com Inc.',
    'TSLA': 'Tesla Inc.',
    'META': 'Meta Platforms Inc.',
    'NVDA': 'NVIDIA Corporation',
    'JPM': 'JPMorgan Chase & Co.',
    'V': 'Visa Inc.',
    'WMT': 'Walmart Inc.'
  }
  
  const seed = Array.from(symbol).reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const marketCap = (seed % 1000 + 500) * 1000000000 // 500B-1500B
  
  return {
    name: companyNames[symbol] || `${symbol} Corporation`,
    ticker: symbol,
    marketCapitalization: marketCap,
    shareOutstanding: marketCap / 150,
    exchange: 'NASDAQ',
    logo: '',
    weburl: '',
    finnhubIndustry: 'Technology'
  }
}

export const stockApi = {
  // Get stock quote (current price)
  async getQuote(symbol) {
    const cacheKey = `quote_${symbol}`
    const cached = getCached(cacheKey)
    if (cached) return cached
    
    // Skip Finnhub fetch if using demo key - go straight to deterministic fallback
    const shouldFetch = API_KEY && API_KEY !== 'demo'
    
    if (!shouldFetch) {
      const quote = generateFallbackQuote(symbol)
      setCache(cacheKey, quote)
      return quote
    }
    
    try {
      const response = await fetch(
        `${BASE_URL}/quote?symbol=${symbol}&token=${API_KEY}`
      )
      if (!response.ok) throw new Error('Failed to fetch quote')
      const data = await response.json()
      
      // Transform to standardized format
      const quote = {
        symbol,
        currentPrice: data.c,
        change: data.d,
        changePercent: data.dp,
        high: data.h,
        low: data.l,
        open: data.o,
        previousClose: data.pc,
        timestamp: Date.now()
      }
      
      setCache(cacheKey, quote)
      return quote
    } catch (error) {
      console.error('Error fetching quote:', error)
      return generateFallbackQuote(symbol)
    }
  },

  // Get company profile
  async getCompanyProfile(symbol) {
    const cacheKey = `profile_${symbol}`
    const cached = getCached(cacheKey)
    if (cached) return cached
    
    // Skip Finnhub fetch if using demo key
    const shouldFetch = API_KEY && API_KEY !== 'demo'
    
    if (!shouldFetch) {
      const profile = generateFallbackProfile(symbol)
      setCache(cacheKey, profile)
      return profile
    }
    
    try {
      const response = await fetch(
        `${BASE_URL}/stock/profile2?symbol=${symbol}&token=${API_KEY}`
      )
      if (!response.ok) throw new Error('Failed to fetch profile')
      const data = await response.json()
      
      setCache(cacheKey, data)
      return data
    } catch (error) {
      console.error('Error fetching profile:', error)
      return generateFallbackProfile(symbol)
    }
  },

  // Get stock news from backend API
  async getNews(symbol, limit = 5, cursor = null) {
    const cursorKey = cursor === null ? 'first' : String(cursor)
    const cacheKey = `news_${symbol}_${limit}_${cursorKey}`
    const cached = getCached(cacheKey)
    if (cached) return cached

    try {
      const query = new URLSearchParams({ limit: String(limit) })
      if (cursor !== null && cursor !== undefined) {
        query.set('cursor', String(cursor))
      }

      const response = await fetch(
        `${BACKEND_BASE_URL}/stocks/${encodeURIComponent(symbol)}/news?${query.toString()}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch stock news')
      }

      const result = await response.json()
      const payload = {
        news: result?.data?.news || [],
        nextCursor: result?.data?.nextCursor ?? null,
        hasMore: Boolean(result?.data?.hasMore),
      }
      setCache(cacheKey, payload)
      return payload
    } catch (error) {
      console.error('Error fetching stock news:', error)
      throw error
    }
  },

  // Get historical price data from backend so the server can
  // decide between Finnhub candles and demo fallback history.
  async getHistory(symbol, period = '1m') {
    const cacheKey = `history_${symbol}_${period}`
    const cached = getCached(cacheKey)
    if (cached) return cached

    try {
      const response = await fetch(
        `${BACKEND_BASE_URL}/stocks/${encodeURIComponent(symbol)}/history?period=${encodeURIComponent(period)}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch stock history')
      }

      const result = await response.json()
      const history = result?.data?.history || []
      setCache(cacheKey, history)
      return history
    } catch (error) {
      console.error('Error fetching stock history:', error)
      throw error
    }
  },

  // Search for stocks
  async searchStocks(query) {
    if (!query || query.length < 1) return []
    
    try {
      const response = await fetch(
        `${BASE_URL}/search?q=${query}&token=${API_KEY}`
      )
      if (!response.ok) throw new Error('Failed to search stocks')
      const data = await response.json()
      
      // Filter for US stocks only
      return data.result
        .filter(stock => stock.type === 'Common Stock')
        .slice(0, 10)
        .map(stock => ({
          symbol: stock.symbol,
          description: stock.description
        }))
    } catch (error) {
      console.error('Error searching stocks:', error)
      // Return common stocks for demo
      const commonStocks = [
        { symbol: 'AAPL', description: 'Apple Inc' },
        { symbol: 'GOOGL', description: 'Alphabet Inc Class A' },
        { symbol: 'MSFT', description: 'Microsoft Corporation' },
        { symbol: 'AMZN', description: 'Amazon.com Inc' },
        { symbol: 'TSLA', description: 'Tesla Inc' },
        { symbol: 'META', description: 'Meta Platforms Inc' },
        { symbol: 'NVDA', description: 'NVIDIA Corporation' },
        { symbol: 'JPM', description: 'JPMorgan Chase & Co' },
        { symbol: 'V', description: 'Visa Inc' },
        { symbol: 'WMT', description: 'Walmart Inc' }
      ]
      return commonStocks.filter(stock => 
        stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
        stock.description.toLowerCase().includes(query.toLowerCase())
      )
    }
  },

}
