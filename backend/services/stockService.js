import axios from 'axios';
import { getRedisClient } from '../config/redis.js';
import logger from '../utils/logger.js';
import { AppError, NotFoundError } from '../utils/errors.js';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const DEFAULT_NEWS_LIMIT = 5;
const DEFAULT_STOCK_API_PROVIDER = 'auto';

// Cache TTLs (in seconds)
const CACHE_TTL = {
  QUOTE: 300, // 5 minutes
  SEARCH: 3600, // 1 hour
  HISTORY: 86400, // 24 hours
  NEWS: 900, // 15 minutes
};

const POSITIVE_SENTIMENT_KEYWORDS = [
  'up',
  'gain',
  'gains',
  'rise',
  'rises',
  'surge',
  'surges',
  'beat',
  'beats',
  'strong',
  'growth',
  'profit',
  'bullish',
  'upgrade',
  'upgrades',
  'upbeat',
  'soar',
  'soars',
  'rally',
  'rallies',
  'outperform',
  'outperforms',
];

const NEGATIVE_SENTIMENT_KEYWORDS = [
  'down',
  'drop',
  'drops',
  'fall',
  'falls',
  'decline',
  'declines',
  'miss',
  'misses',
  'weak',
  'loss',
  'bearish',
  'downgrade',
  'downgrades',
  'warning',
  'warnings',
  'slip',
  'slips',
  'pressure',
  'cut',
  'cuts',
  'lawsuit',
  'lawsuits',
  'plunge',
  'plunges',
  'tumble',
  'tumbles',
  'underperform',
  'underperforms',
  'weaken',
  'weakens',
];

const getCacheKey = (type, symbol) => `stock:${type}:v2:${symbol}`;

// Alpha Vantage API client
const alphaVantageClient = axios.create({
  baseURL: 'https://www.alphavantage.co/query',
  timeout: 10000,
});

const getAlphaVantageApiKey = () => process.env.STOCK_API_KEY;

const getFinnhubApiKey = () => process.env.FINNHUB_API_KEY || process.env.VITE_FINNHUB_API_KEY;

const hasRealApiKey = (apiKey) => Boolean(apiKey && apiKey !== 'demo');

export const resolveStockApiConfig = () => {
  const configuredProvider = (process.env.STOCK_API_PROVIDER || DEFAULT_STOCK_API_PROVIDER).toLowerCase();
  const alphaVantageApiKey = getAlphaVantageApiKey();
  const finnhubApiKey = getFinnhubApiKey();

  if (configuredProvider === 'mock') {
    return { provider: 'mock', apiKey: null };
  }

  if (configuredProvider === 'finnhub' && hasRealApiKey(finnhubApiKey)) {
    return { provider: 'finnhub', apiKey: finnhubApiKey };
  }

  if (configuredProvider === 'alphavantage' && hasRealApiKey(alphaVantageApiKey)) {
    return { provider: 'alphavantage', apiKey: alphaVantageApiKey };
  }

  if (hasRealApiKey(finnhubApiKey)) {
    return { provider: 'finnhub', apiKey: finnhubApiKey };
  }

  if (hasRealApiKey(alphaVantageApiKey)) {
    return { provider: 'alphavantage', apiKey: alphaVantageApiKey };
  }

  return { provider: 'mock', apiKey: null };
};

const fetchFromAlphaVantage = async (params, apiKey) => {
  try {
    const response = await alphaVantageClient.get('', {
      params: {
        ...params,
        apikey: apiKey,
      },
    });

    if (response.data['Error Message'] || response.data['Note']) {
      throw new Error(response.data['Error Message'] || response.data['Note']);
    }

    return response.data;
  } catch (error) {
    logger.error('Alpha Vantage API Error:', error);
    throw error;
  }
};

// Mock data for development/testing when API key is not available
const fetchFromFinnhub = async (path, params, apiKey) => {
  try {
    const response = await axios.get(`${FINNHUB_BASE_URL}/${path}`, {
      params: {
        ...params,
        token: apiKey,
      },
      timeout: 10000,
    });

    return response.data;
  } catch (error) {
    logger.error('Finnhub API Error:', error);
    throw error;
  }
};

const getMockStockData = (symbol) => ({
  'Global Quote': {
    '01. symbol': symbol,
    '02. open': '150.00',
    '03. high': '155.00',
    '04. low': '149.00',
    '05. price': '152.50',
    '06. volume': '1000000',
    '07. latest trading day': new Date().toISOString().split('T')[0],
    '08. previous close': '150.00',
    '09. change': '2.50',
    '10. change percent': '1.67%',
  },
});

const getMockSearchData = (query) => ({
  bestMatches: [
    {
      '1. symbol': query.toUpperCase(),
      '2. name': `${query.toUpperCase()} Inc.`,
      '3. type': 'Equity',
      '4. region': 'United States',
      '5. marketOpen': '09:30',
      '6. marketClose': '16:00',
      '7. timezone': 'UTC-5',
      '8. currency': 'USD',
      '9. matchScore': '1.0000',
    },
  ],
});

const getMockHistoryConfig = (period) => {
  const periodConfig = {
    '1d': { points: 7, stepMs: 60 * 60 * 1000 },
    '1w': { points: 7, stepMs: 24 * 60 * 60 * 1000 },
    '1m': { points: 30, stepMs: 24 * 60 * 60 * 1000 },
    '3m': { points: 90, stepMs: 24 * 60 * 60 * 1000 },
    '1y': { points: 52, stepMs: 7 * 24 * 60 * 60 * 1000 },
  };

  return periodConfig[period] || periodConfig['1m'];
};

const getMockHistoryData = (symbol, period) => {
  const { points, stepMs } = getMockHistoryConfig(period);
  const endTime = Date.now();
  const startTime = endTime - ((points - 1) * stepMs);
  
  // Calculate end price to match the deterministic quote price for this symbol
  const seed = Array.from(symbol).reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const basePrice = 100 + (seed % 200) // Same as frontend quote fallback
  const intervalsSinceEpoch = Math.floor(Date.now() / 5000)
  const driftSeed = seed + intervalsSinceEpoch
  const driftPercent = ((driftSeed % 60) - 30) / 10000
  const endPrice = basePrice * (1 + driftPercent)
  
  const startingPrice = endPrice * 0.95; // Start 5% below current price

  return Array.from({ length: points }, (_, index) => {
    const timestamp = startTime + (index * stepMs);
    const progress = index / Math.max(points - 1, 1);
    const trendComponent = (endPrice - startingPrice) * progress;
    const oscillation = Math.sin(index * 1.35) * (endPrice * 0.015);
    const open = startingPrice + trendComponent + oscillation;
    const close = index === points - 1 ? endPrice : open + Math.cos(index * 0.85) * (endPrice * 0.01);
    const high = Math.max(open, close) + endPrice * 0.008;
    const low = Math.min(open, close) - endPrice * 0.007;
    const volume = 900000 + (index * 27500);

    return {
      date: new Date(timestamp).toISOString(),
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume,
    };
  });
};

const getLatestTradingDay = () => new Date().toISOString().split('T')[0];

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toInteger = (value, fallback = 0) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const formatFinnhubQuote = (symbol, quote) => {
  const price = toNumber(quote?.c, NaN);
  if (!Number.isFinite(price) || price <= 0) {
    throw new NotFoundError(`Stock quote not found for symbol: ${symbol}`);
  }

  return {
    symbol: symbol.toUpperCase(),
    open: toNumber(quote?.o),
    high: toNumber(quote?.h),
    low: toNumber(quote?.l),
    price,
    volume: toInteger(quote?.v),
    latestTradingDay: getLatestTradingDay(),
    previousClose: toNumber(quote?.pc),
    change: toNumber(quote?.d),
    changePercent: toNumber(quote?.dp),
  };
};

const formatAlphaVantageQuote = (quote) => {
  if (!quote || !quote['05. price']) {
    throw new NotFoundError(`Stock quote not found for symbol: ${quote?.['01. symbol'] || 'unknown'}`);
  }

  return {
    symbol: quote['01. symbol'],
    open: parseFloat(quote['02. open']),
    high: parseFloat(quote['03. high']),
    low: parseFloat(quote['04. low']),
    price: parseFloat(quote['05. price']),
    volume: parseInt(quote['06. volume'], 10),
    latestTradingDay: quote['07. latest trading day'],
    previousClose: parseFloat(quote['08. previous close']),
    change: parseFloat(quote['09. change']),
    changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
  };
};

const formatFinnhubSearchResults = (results = []) => {
  return results
    .filter((match) => match?.symbol || match?.displaySymbol)
    .map((match) => ({
      '1. symbol': match.symbol || match.displaySymbol,
      '2. name': match.description || match.symbol || match.displaySymbol,
      '3. type': match.type || '',
      '4. region': match.region || '',
      '5. marketOpen': '',
      '6. marketClose': '',
      '7. timezone': '',
      '8. currency': '',
      '9. matchScore': '',
    }));
};

const getFinnhubHistoryParams = (period) => {
  const now = Math.floor(Date.now() / 1000);
  const day = 24 * 60 * 60;
  const periodToRange = {
    '1d': { from: now - day, resolution: '60' },
    '1w': { from: now - (7 * day), resolution: 'D' },
    '1m': { from: now - (30 * day), resolution: 'D' },
    '3m': { from: now - (90 * day), resolution: 'D' },
    '1y': { from: now - (365 * day), resolution: 'W' },
  };

  const { from, resolution } = periodToRange[period] || periodToRange['1m'];
  return {
    from,
    to: now,
    resolution,
  };
};

const formatFinnhubHistory = (data) => {
  if (data?.s !== 'ok' || !Array.isArray(data.t)) {
    throw new AppError('Finnhub history is unavailable for this symbol/plan', 502);
  }

  return data.t.map((timestamp, index) => ({
    date: new Date(timestamp * 1000).toISOString(),
    open: toNumber(data.o?.[index]),
    high: toNumber(data.h?.[index]),
    low: toNumber(data.l?.[index]),
    close: toNumber(data.c?.[index]),
    volume: toInteger(data.v?.[index]),
  }));
};

const sortHistoryChronologically = (history = []) => {
  return [...history].sort((left, right) => {
    const leftTime = new Date(left.date).getTime();
    const rightTime = new Date(right.date).getTime();
    return leftTime - rightTime;
  });
};

const getStockNewsProvider = () => process.env.STOCK_NEWS_PROVIDER || 'mock';

const getStockNewsApiKey = () => process.env.FINNHUB_API_KEY || process.env.VITE_FINNHUB_API_KEY;

const getMockStockNews = (symbol) => {
  const normalized = symbol.toUpperCase();
  const now = Date.now();
  const mockNewsRows = [
    {
      slug: 'guidance',
      source: 'Demo Wire',
      hoursAgo: 1,
      headline: `${normalized} extends gains as investors react to latest guidance`,
      summary: `${normalized} shares traded higher after management reiterated near-term outlook.`,
      sharedUrl: 'shared-market-briefing',
    },
    {
      slug: 'analyst-view',
      source: 'Market Desk',
      hoursAgo: 3,
      headline: `Analysts raise targets after ${normalized} posts strong growth outlook`,
      summary: `Several desks upgraded ${normalized} while pointing to improving revenue quality.`,
    },
    {
      slug: 'hiring-plan',
      source: 'Exchange Post',
      hoursAgo: 6,
      headline: `${normalized} hiring plan signals steady expansion`,
      summary: `Management said hiring remains measured, leaving guidance largely neutral.`,
    },
    {
      slug: 'margin-warning',
      source: 'Street Snapshot',
      hoursAgo: 10,
      headline: `${normalized} slips after supplier warning on margin pressure`,
      summary: `The update increased concern that costs could rise faster than expected this quarter.`,
    },
    {
      slug: 'product-update',
      source: 'Investor Daily',
      hoursAgo: 14,
      headline: `${normalized} announces product update focused on enterprise customers`,
      summary: 'The announcement highlights incremental roadmap improvements for key segments.',
    },
    {
      slug: 'downgrade-note',
      source: 'Market Observer',
      hoursAgo: 18,
      headline: `${normalized} faces downgrade as demand outlook weakens`,
      summary: `One analyst cut estimates, citing a possible decline in near-term order strength.`,
    },
    {
      slug: 'sector-rebound',
      source: 'Ticker Journal',
      hoursAgo: 22,
      headline: `${normalized} joins sector rebound in late trading`,
      summary: 'Peer names rose after a broad market rally and better-than-expected macro data.',
    },
    {
      slug: 'week-ahead',
      source: 'Morning Bell',
      hoursAgo: 27,
      headline: `What to watch for ${normalized} in the next trading week`,
      summary: 'Traders are focused on volume trends, macro signals, and upcoming catalysts.',
    },
    {
      slug: 'profit-take',
      source: 'Closing Tape',
      hoursAgo: 32,
      headline: `${normalized} edges down as traders take profit`,
      summary: 'Selling pressure appeared after a recent run-up, but volume stayed near average.',
    },
  ];

  return mockNewsRows.map((row, index) => {
    const publishedAt = new Date(now - row.hoursAgo * 60 * 60 * 1000).toISOString();
    return {
      id: `${normalized}-${Math.floor(new Date(publishedAt).getTime() / 1000)}-${index}`,
      headline: row.headline,
      url: row.sharedUrl
        ? `https://example.com/news/${row.sharedUrl}`
        : `https://example.com/news/${normalized.toLowerCase()}-${row.slug}`,
      source: row.source,
      publishedAt,
      summary: row.summary,
      image: null,
    };
  });
};

const classifyNewsSentiment = (headline = '', summary = '') => {
  const text = `${headline} ${summary}`.toLowerCase();
  let sentimentScore = 0;

  // Tokenize on word boundaries to avoid substring false positives
  const words = text.split(/[^a-z]+/).filter(Boolean);
  const wordSet = new Set(words);

  // Check multi-word negative phrases first (higher priority)
  const negativePhrases = [
    'edges down',
    'edged down',
  ];

  negativePhrases.forEach((phrase) => {
    if (text.includes(phrase)) {
      sentimentScore -= 1;
    }
  });

  // Check single-word keywords (whole word matches only)
  POSITIVE_SENTIMENT_KEYWORDS.forEach((keyword) => {
    if (wordSet.has(keyword)) {
      sentimentScore += 1;
    }
  });

  NEGATIVE_SENTIMENT_KEYWORDS.forEach((keyword) => {
    if (wordSet.has(keyword)) {
      sentimentScore -= 1;
    }
  });

  if (sentimentScore > 0) {
    return 'positive';
  }

  if (sentimentScore < 0) {
    return 'negative';
  }

  return 'neutral';
};

// Export for testing
export { classifyNewsSentiment };

const normalizeNewsArticles = (symbol, articles) => {
  return articles.map((article, index) => {
    const publishedEpochSeconds = Number(article.datetime || article.publishedAt || 0);
    const publishedAt = Number.isFinite(publishedEpochSeconds) && publishedEpochSeconds > 0
      ? new Date(publishedEpochSeconds * 1000).toISOString()
      : new Date().toISOString();

    return {
      id: article.id || `${symbol}-${Math.floor(new Date(publishedAt).getTime() / 1000)}-${index}`,
      headline: article.headline || 'Untitled article',
      url: article.url || '',
      source: article.source || 'Unknown source',
      publishedAt,
      summary: article.summary || '',
      image: article.image || null,
      sentiment: classifyNewsSentiment(article.headline, article.summary),
    };
  });
};

export const searchStocks = async (query) => {
  const cacheKey = getCacheKey('search', query.toLowerCase());
  const redis = getRedisClient();

  // Try cache first
  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.warn('Redis cache read error:', error);
    }
  }

  try {
    const { provider, apiKey } = resolveStockApiConfig();
    let results;

    if (provider === 'mock') {
      // Mock data for development
      logger.info('Using mock data for stock search');
      results = getMockSearchData(query).bestMatches;
    } else if (provider === 'finnhub') {
      const data = await fetchFromFinnhub('search', { q: query }, apiKey);
      results = formatFinnhubSearchResults(data?.result || []);
    } else {
      const data = await fetchFromAlphaVantage({
        function: 'SYMBOL_SEARCH',
        keywords: query,
      }, apiKey);
      results = data.bestMatches || [];
    }

    // Cache results
    if (redis && results.length > 0) {
      try {
        await redis.setEx(cacheKey, CACHE_TTL.SEARCH, JSON.stringify(results));
      } catch (error) {
        logger.warn('Redis cache write error:', error);
      }
    }

    return results;
  } catch (error) {
    logger.error('Stock search error:', error);
    throw new NotFoundError('Failed to search stocks');
  }
};

export const getStockQuote = async (symbol) => {
  const cacheKey = getCacheKey('quote', symbol.toUpperCase());
  const redis = getRedisClient();

  // Try cache first
  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.warn('Redis cache read error:', error);
    }
  }

  try {
    const normalizedSymbol = symbol.toUpperCase();
    const { provider, apiKey } = resolveStockApiConfig();
    let formattedQuote;

    if (provider === 'mock') {
      // Mock data for development
      logger.info('Using mock data for stock quote');
      formattedQuote = formatAlphaVantageQuote(getMockStockData(normalizedSymbol)['Global Quote']);
    } else if (provider === 'finnhub') {
      const data = await fetchFromFinnhub('quote', { symbol: normalizedSymbol }, apiKey);
      formattedQuote = formatFinnhubQuote(normalizedSymbol, data);
    } else {
      const data = await fetchFromAlphaVantage({
        function: 'GLOBAL_QUOTE',
        symbol: normalizedSymbol,
      }, apiKey);
      formattedQuote = formatAlphaVantageQuote(data['Global Quote']);
    }

    // Cache result
    if (redis) {
      try {
        await redis.setEx(cacheKey, CACHE_TTL.QUOTE, JSON.stringify(formattedQuote));
      } catch (error) {
        logger.warn('Redis cache write error:', error);
      }
    }

    return formattedQuote;
  } catch (error) {
    logger.error('Get stock quote error:', error);
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new NotFoundError(`Failed to get stock quote for symbol: ${symbol}`);
  }
};

export const getStockHistory = async (symbol, period = '1m') => {
  const cacheKey = getCacheKey('history', `${symbol.toUpperCase()}:${period}`);
  const redis = getRedisClient();

  // Try cache first
  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.warn('Redis cache read error:', error);
    }
  }

  try {
    const normalizedSymbol = symbol.toUpperCase();
    const { provider, apiKey } = resolveStockApiConfig();

    // Map period to Alpha Vantage function
    const functionMap = {
      '1d': 'TIME_SERIES_INTRADAY',
      '1w': 'TIME_SERIES_DAILY',
      '1m': 'TIME_SERIES_DAILY',
      '3m': 'TIME_SERIES_DAILY',
      '1y': 'TIME_SERIES_DAILY',
    };

    const functionName = functionMap[period] || 'TIME_SERIES_DAILY';
    let history;

    if (provider === 'mock') {
      // Mock historical data
      logger.info('Using mock data for stock history');
      history = getMockHistoryData(normalizedSymbol, period);
    } else if (provider === 'finnhub') {
      try {
        const params = getFinnhubHistoryParams(period);
        const data = await fetchFromFinnhub('stock/candle', {
          symbol: normalizedSymbol,
          ...params,
        }, apiKey);
        history = formatFinnhubHistory(data);
      } catch (error) {
        logger.warn(`Falling back to mock stock history for ${normalizedSymbol}:`, error);
        history = getMockHistoryData(normalizedSymbol, period);
      }
    } else {
      const data = await fetchFromAlphaVantage({
        function: functionName,
        symbol: normalizedSymbol,
        ...(functionName === 'TIME_SERIES_INTRADAY' && { interval: '60min' }),
        outputsize: period === '1y' ? 'full' : 'compact',
      }, apiKey);

      const timeSeriesKey = Object.keys(data).find((key) => key.includes('Time Series'));
      if (!timeSeriesKey || !data[timeSeriesKey]) {
        throw new NotFoundError(`Historical data not found for symbol: ${symbol}`);
      }

      history = Object.entries(data[timeSeriesKey]).map(([date, values]) => ({
        date: new Date(date).toISOString(),
        open: parseFloat(values['1. open'] || values['1. open']),
        high: parseFloat(values['2. high'] || values['2. high']),
        low: parseFloat(values['3. low'] || values['3. low']),
        close: parseFloat(values['4. close'] || values['4. close']),
        volume: parseInt(values['5. volume'] || values['5. volume'], 10),
      }));
    }

    history = sortHistoryChronologically(history);

    // Cache result
    if (redis) {
      try {
        await redis.setEx(cacheKey, CACHE_TTL.HISTORY, JSON.stringify(history));
      } catch (error) {
        logger.warn('Redis cache write error:', error);
      }
    }

    return history;
  } catch (error) {
    logger.error('Get stock history error:', error);
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new NotFoundError(`Failed to get historical data for symbol: ${symbol}`);
  }
};

export const getStockNews = async (symbol, { limit = DEFAULT_NEWS_LIMIT, cursor = 0 } = {}) => {
  const normalizedSymbol = symbol.toUpperCase();
  const parsedLimit = Number(limit) || DEFAULT_NEWS_LIMIT;
  const parsedCursor = Number(cursor) || 0;
  const cacheKey = getCacheKey('news', normalizedSymbol);
  const redis = getRedisClient();
  let allNews = null;

  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        allNews = JSON.parse(cached);
      }
    } catch (error) {
      logger.warn('Redis cache read error:', error);
    }
  }

  try {
    if (!allNews) {
      let news = [];
      const provider = getStockNewsProvider();

      if (provider === 'mock') {
        news = getMockStockNews(normalizedSymbol);
      } else if (provider === 'finnhub') {
        const apiKey = getStockNewsApiKey();
        if (!apiKey || apiKey === 'demo') {
          throw new AppError('Stock news provider is not configured', 500);
        }

        const today = new Date();
        const fromDate = new Date(today);
        fromDate.setDate(fromDate.getDate() - 7);

        const response = await axios.get(`${FINNHUB_BASE_URL}/company-news`, {
          params: {
            symbol: normalizedSymbol,
            from: fromDate.toISOString().split('T')[0],
            to: today.toISOString().split('T')[0],
            token: apiKey,
          },
          timeout: 10000,
        });

        if (!Array.isArray(response.data)) {
          throw new AppError('Unexpected stock news provider response', 500);
        }

        news = normalizeNewsArticles(normalizedSymbol, response.data);
      } else {
        throw new AppError(`Unsupported stock news provider: ${provider}`, 500);
      }

      allNews = news
        .map((article) => ({
          ...article,
          sentiment: classifyNewsSentiment(article.headline, article.summary),
        }))
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

      if (redis) {
        try {
          await redis.setEx(cacheKey, CACHE_TTL.NEWS, JSON.stringify(allNews));
        } catch (error) {
          logger.warn('Redis cache write error:', error);
        }
      }
    }

    const paginatedNews = allNews.slice(parsedCursor, parsedCursor + parsedLimit);
    const nextCursorValue = parsedCursor + parsedLimit;
    const hasMore = nextCursorValue < allNews.length;
    const nextCursor = hasMore ? String(nextCursorValue) : null;

    return {
      news: paginatedNews,
      nextCursor,
      hasMore,
    };
  } catch (error) {
    logger.error(`Get stock news error for ${normalizedSymbol}:`, error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to fetch stock news', 500);
  }
};

export const getAllStockNews = async (symbol) => {
  const normalizedSymbol = symbol.toUpperCase();
  const cacheKey = getCacheKey('news', normalizedSymbol);
  const redis = getRedisClient();

  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.warn('Redis cache read error:', error);
    }
  }

  const fullFeed = await getStockNews(normalizedSymbol, { limit: 1000, cursor: 0 });
  return fullFeed.news;
};

export const getTrendingStocks = async () => {
  // Return popular stocks (can be enhanced with actual trending logic)
  const popularSymbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'JPM'];
  const quotes = await Promise.all(
    popularSymbols.map((symbol) => getStockQuote(symbol).catch(() => null))
  );

  return quotes.filter((quote) => quote !== null);
};
