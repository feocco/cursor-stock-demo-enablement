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

export const stockApi = {
  // Get stock quote (current price)
  async getQuote(symbol) {
    const cacheKey = `quote_${symbol}`
    const cached = getCached(cacheKey)
    if (cached) return cached

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
      // Return mock data for demo with consistent change/changePercent signs
      const currentPrice = 150 + Math.random() * 50
      const change = (Math.random() - 0.5) * 10
      const previousClose = currentPrice - change
      const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0
      
      return {
        symbol,
        currentPrice,
        change,
        changePercent,
        high: Math.max(currentPrice, previousClose) + Math.random() * 5,
        low: Math.min(currentPrice, previousClose) - Math.random() * 5,
        open: previousClose + (Math.random() - 0.5) * 2,
        previousClose,
        timestamp: Date.now()
      }
    }
  },

  // Get company profile
  async getCompanyProfile(symbol) {
    const cacheKey = `profile_${symbol}`
    const cached = getCached(cacheKey)
    if (cached) return cached

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
      return {
        name: symbol,
        ticker: symbol,
        marketCapitalization: 0,
        shareOutstanding: 0,
        exchange: 'NASDAQ'
      }
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
