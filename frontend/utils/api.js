// API utility for backend calls
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
const DEBUG_API_LOGS = import.meta.env.DEV && import.meta.env.VITE_DEBUG_API === 'true';

/**
 * Get auth token from localStorage
 */
const getAuthToken = () => {
  return localStorage.getItem('auth_token');
};

/**
 * Set auth token in localStorage
 */
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
};

/**
 * Ensure authentication is ready
 */
let authPromise = null;
let lastAuthError = null;
let lastAuthAttempt = 0;
const RATE_LIMIT_COOLDOWN = 60000; // 1 minute cooldown after rate limit

const ensureAuth = async () => {
  const token = getAuthToken();
  if (token) {
    return token;
  }

  // If we recently hit rate limit, wait before retrying
  const timeSinceLastAttempt = Date.now() - lastAuthAttempt;
  if (lastAuthError && lastAuthError.includes('429') && timeSinceLastAttempt < RATE_LIMIT_COOLDOWN) {
    const waitTime = Math.ceil((RATE_LIMIT_COOLDOWN - timeSinceLastAttempt) / 1000);
    if (DEBUG_API_LOGS) {
      console.warn(`[API] Rate limited, waiting ${waitTime} seconds before retry...`);
    }
    throw new Error(`Rate limited. Please wait ${waitTime} seconds and try again.`);
  }

  // If auth is already in progress, wait for it
  if (authPromise) {
    await authPromise;
    return getAuthToken();
  }

  // Start auth process
  authPromise = (async () => {
    try {
      lastAuthAttempt = Date.now();
      const result = await fetch(`${API_BASE_URL}/auth/default`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (result.ok) {
        const data = await result.json();
        if (data.success && data.data.token) {
          setAuthToken(data.data.token);
          lastAuthError = null; // Clear error on success
        }
      } else if (result.status === 429) {
        lastAuthError = '429';
        const errorText = await result.text();
        throw new Error(`Rate limited: ${errorText}`);
      }
  } catch (error) {
    if (DEBUG_API_LOGS) {
      console.error('[API] Auth initialization failed:', error);
    }
    if (error.message.includes('429') || error.message.includes('Rate limited')) {
      lastAuthError = '429';
    }
    throw error;
    } finally {
      authPromise = null;
    }
  })();

  await authPromise;
  return getAuthToken();
};

/**
 * Make authenticated API request
 */
const apiRequest = async (endpoint, options = {}) => {
  // Ensure we have auth token before making request
  // If auth fails, try to continue anyway (might have cached token)
  try {
    await ensureAuth();
  } catch (authError) {
    if (DEBUG_API_LOGS) {
      console.warn('[API] Auth check failed, continuing with existing token if available:', authError.message);
    }
    // Continue anyway - might have a valid token from before
  }
  
  const token = getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (networkError) {
    if (DEBUG_API_LOGS) {
      console.error('[API] Network error:', networkError);
    }
    throw new Error(`Network error: ${networkError.message}. Is the backend server running on ${API_BASE_URL}?`);
  }

  // Handle 401 by re-authenticating and retrying once
  if (response.status === 401) {
    if (DEBUG_API_LOGS) {
      console.warn('[API] Got 401, re-authenticating...');
    }
    // Clear invalid token
    localStorage.removeItem('auth_token');
    // Re-authenticate
    await ensureAuth();
    
    // Retry the request with new token
    const newToken = getAuthToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });
    }
  }

  if (!response.ok) {
    const errorText = await response.text();
    if (DEBUG_API_LOGS) {
      console.error('[API] Error response:', errorText);
    }
    let error;
    try {
      error = JSON.parse(errorText);
    } catch {
      error = { error: errorText || 'Request failed' };
    }
    throw new Error(error.error || error.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  return data;
};

export const api = {
  // Auth endpoints
  async getDefaultUser() {
    // Don't use apiRequest here to avoid circular dependency
    const response = await fetch(`${API_BASE_URL}/auth/default`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Auth failed: ${errorText}`);
    }
    
    const result = await response.json();
    if (result.success && result.data.token) {
      setAuthToken(result.data.token);
    }
    return result.data;
  },

  // Portfolio endpoints
  async getPortfolio() {
    const result = await apiRequest('/portfolio');
    return result.data.portfolio;
  },

  async buyStock(symbol, quantity, price) {
    const result = await apiRequest('/portfolio/buy', {
      method: 'POST',
      body: JSON.stringify({ symbol, quantity, price }),
    });
    return result.data.portfolio;
  },

  async sellStock(symbol, quantity, price) {
    const result = await apiRequest('/portfolio/sell', {
      method: 'POST',
      body: JSON.stringify({ symbol, quantity, price }),
    });
    return result.data.portfolio;
  },

  async migratePortfolio(portfolioData) {
    const result = await apiRequest('/portfolio/migrate', {
      method: 'POST',
      body: JSON.stringify({ portfolioData }),
    });
    return result.data;
  },

  async resetPortfolio() {
    const result = await apiRequest('/portfolio/reset', {
      method: 'POST',
    });
    return result.data.portfolio;
  },

  async analyzePortfolio(holdings) {
    const result = await apiRequest('/portfolio/analyze', {
      method: 'POST',
      body: JSON.stringify({ holdings }),
    });
    return result;
  },

  // Watchlist endpoints
  async getWatchlists() {
    const result = await apiRequest('/watchlists');
    return result.data.watchlists;
  },

  async getWatchlist(watchlistId) {
    const result = await apiRequest(`/watchlists/${watchlistId}`);
    return result.data.watchlist;
  },

  async createWatchlist(name) {
    const result = await apiRequest('/watchlists', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    return result.data.watchlist;
  },

  async addStockToWatchlist(watchlistId, symbol) {
    const result = await apiRequest(`/watchlists/${watchlistId}/stocks`, {
      method: 'POST',
      body: JSON.stringify({ symbol }),
    });
    return result.data.item;
  },

  async removeStockFromWatchlist(watchlistId, symbol) {
    const result = await apiRequest(`/watchlists/${watchlistId}/stocks/${symbol}`, {
      method: 'DELETE',
    });
    return result;
  },

  async getWatchlistNews(watchlistId, { limit = 20, cursor = null, symbol, sentiment, sort } = {}) {
    const params = new URLSearchParams({ limit: String(limit) });

    if (cursor !== null && cursor !== undefined) {
      params.set('cursor', String(cursor));
    }
    if (symbol) {
      params.set('symbol', symbol);
    }
    if (sentiment) {
      params.set('sentiment', sentiment);
    }
    if (sort) {
      params.set('sort', sort);
    }

    const result = await apiRequest(`/watchlists/${watchlistId}/news?${params.toString()}`);
    return result.data;
  },

  async getPriceAlerts() {
    const result = await apiRequest('/alerts');
    return result.data.alerts;
  },

  async createPriceAlert(symbol, condition, targetPrice) {
    const result = await apiRequest('/alerts', {
      method: 'POST',
      body: JSON.stringify({ symbol, condition, targetPrice }),
    });
    return result.data.alert;
  },

  async deletePriceAlert(alertId) {
    return apiRequest(`/alerts/${alertId}`, {
      method: 'DELETE',
    });
  },

  async markPriceAlertTriggered(alertId) {
    const result = await apiRequest(`/alerts/${alertId}`, {
      method: 'PATCH',
      body: JSON.stringify({ triggered: true }),
    });
    return result.data.alert;
  },
};
