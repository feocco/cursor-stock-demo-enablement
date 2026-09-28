import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useStockQuote, useStockProfile, useStockNews } from '../hooks/useStockData'
import { useWatchlist } from '../context/WatchlistContext'
import { usePriceAlerts } from '../hooks/usePriceAlerts'
import PriceDisplay from '../components/atoms/PriceDisplay'
import Button from '../components/atoms/Button'
import TradingPanel from '../components/organisms/TradingPanel'
import StockChart from '../components/organisms/StockChart'
import PriceAlertForm from '../components/molecules/PriceAlertForm'
import PriceAlertsList from '../components/molecules/PriceAlertsList'
import { formatCurrency, formatPercentage } from '../utils/calculations'
import { getAlertsForSymbol } from '../utils/priceAlerts'

const StockDetail = () => {
  const { symbol } = useParams()
  const upperSymbol = symbol?.toUpperCase()
  const { quote, loading: quoteLoading } = useStockQuote(upperSymbol)
  const { profile, loading: profileLoading } = useStockProfile(upperSymbol)
  const {
    news,
    loading: newsLoading,
    loadingMore: newsLoadingMore,
    error: newsError,
    loadMoreError: newsLoadMoreError,
    hasMore: newsHasMore,
    loadMore: loadMoreNews,
  } = useStockNews(upperSymbol, 5)
  const { isInWatchlist, toggleWatchlist, isReady: watchlistReady, loading: watchlistLoading } = useWatchlist()
  
  const [symbolAlerts, setSymbolAlerts] = useState(() => getAlertsForSymbol(upperSymbol))
  const quotes = quote ? { [upperSymbol]: quote } : {}
  const { permissionStatus, requestPermission, refreshAlerts } = usePriceAlerts(quotes)

  const inWatchlist = isInWatchlist(upperSymbol)

  const handleAlertCreated = () => {
    refreshAlerts()
    setSymbolAlerts(getAlertsForSymbol(upperSymbol))
  }

  const handleAlertDeleted = () => {
    setSymbolAlerts(getAlertsForSymbol(upperSymbol))
  }

  const getSentimentChipClasses = (sentiment) => {
    if (sentiment === 'positive') {
      return 'bg-gain/10 text-gain border border-gain/20'
    }

    if (sentiment === 'negative') {
      return 'bg-loss/10 text-loss border border-loss/20'
    }

    return 'bg-surface-raised text-text-muted border border-border'
  }

  const getSentimentLabel = (sentiment) => {
    if (sentiment === 'positive') return 'Positive'
    if (sentiment === 'negative') return 'Negative'
    return 'Neutral'
  }

  const formatPublishedTime = (publishedAt) => {
    const timestamp = new Date(publishedAt)
    if (Number.isNaN(timestamp.getTime())) {
      return 'Unknown time'
    }

    return timestamp.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  if (quoteLoading || profileLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-surface-raised rounded w-48 mb-4"></div>
          <div className="h-12 bg-surface-raised rounded w-64 mb-8"></div>
          <div className="h-96 bg-surface-raised rounded"></div>
        </div>
      </div>
    )
  }

  if (!quote) {
    return (
      <div className="p-6">
        <div className="text-center text-text-muted">
          Failed to load stock data
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-text mb-2">{upperSymbol}</h1>
            {profile && <p className="text-xl text-text-muted">{profile.name}</p>}
          </div>
          <Button
            variant={inWatchlist ? 'secondary' : 'outline'}
            onClick={() => {
              if (watchlistReady && !watchlistLoading) {
                toggleWatchlist(upperSymbol)
              }
            }}
            title={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
          >
            {watchlistLoading ? 'Loading...' : inWatchlist ? '★ In Watchlist' : '☆ Add to Watchlist'}
          </Button>
        </div>
        <PriceDisplay
          price={quote.currentPrice}
          change={quote.change}
          changePercent={quote.changePercent}
          size="lg"
        />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="text-text-muted text-sm mb-1">Open</div>
          <div className="text-text font-semibold">{formatCurrency(quote.open)}</div>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="text-text-muted text-sm mb-1">High</div>
          <div className="text-text font-semibold">{formatCurrency(quote.high)}</div>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="text-text-muted text-sm mb-1">Low</div>
          <div className="text-text font-semibold">{formatCurrency(quote.low)}</div>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="text-text-muted text-sm mb-1">Prev Close</div>
          <div className="text-text font-semibold">{formatCurrency(quote.previousClose)}</div>
        </div>
      </div>

      {/* Price Summary and Trading Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-text mb-6">Price Summary</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Current Price</span>
                <span className="text-text font-semibold text-lg">{formatCurrency(quote.currentPrice)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Previous Close</span>
                <span className="text-text">{formatCurrency(quote.previousClose)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Day's Range</span>
                <span className="text-text">{formatCurrency(quote.low)} - {formatCurrency(quote.high)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Change</span>
                <span className={`font-semibold ${quote.change >= 0 ? 'text-gain' : 'text-loss'}`}>
                  {formatCurrency(quote.change)} ({formatPercentage(quote.changePercent)})
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <StockChart symbol={upperSymbol} />
          </div>

          <div className="bg-surface border border-border rounded-lg p-6 mt-6">
            <h2 className="text-xl font-semibold text-text mb-4">News</h2>

            {newsLoading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="animate-pulse border border-border rounded-lg p-4">
                    <div className="h-4 bg-surface-raised rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-surface-raised rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : newsError ? (
              <div className="text-sm text-red-400">Unable to load news right now.</div>
            ) : news.length === 0 ? (
              <div className="text-sm text-text-muted">No recent news available.</div>
            ) : (
              <div className="space-y-3">
                {news.map((article) => (
                  <a
                    key={article.id}
                    href={article.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block border border-border hover:border-border/60 rounded-lg p-4 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="text-sm font-semibold text-text">{article.headline}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${getSentimentChipClasses(article.sentiment)}`}>
                        {getSentimentLabel(article.sentiment)}
                      </span>
                    </div>
                    <div className="text-xs text-text-muted">
                      {article.source} · {formatPublishedTime(article.publishedAt)}
                    </div>
                  </a>
                ))}

                {newsLoadMoreError && (
                  <div className="text-sm text-red-400">
                    Could not load more news. Please try again.
                  </div>
                )}

                {newsHasMore && (
                  <Button
                    variant="outline"
                    onClick={loadMoreNews}
                    disabled={newsLoadingMore}
                  >
                    {newsLoadingMore ? 'Loading more...' : 'Load more'}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="space-y-6">
          <TradingPanel symbol={upperSymbol} currentPrice={quote.currentPrice} />
          
          <div className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-text mb-4">Price Alerts</h2>
            
            {permissionStatus === 'denied' && (
              <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  Browser notifications are blocked. Enable them in your browser settings to receive alerts.
                </p>
              </div>
            )}
            
            {permissionStatus === 'default' && (
              <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-400 mb-2">
                  Enable notifications to get alerted when price targets are reached.
                </p>
                <Button variant="primary" size="sm" onClick={requestPermission}>
                  Enable Notifications
                </Button>
              </div>
            )}
            
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Create New Alert</h3>
              <PriceAlertForm
                symbol={upperSymbol}
                currentPrice={quote.currentPrice}
                onAlertCreated={handleAlertCreated}
              />
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-3">Active Alerts</h3>
              <PriceAlertsList
                alerts={symbolAlerts}
                onAlertDeleted={handleAlertDeleted}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StockDetail
