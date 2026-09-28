import { useEffect, useMemo, useState } from 'react'
import { api } from '../../utils/api'
import Button from '../atoms/Button'

const DEFAULT_LIMIT = 5
const EXPANDED_LIMIT = 20

const SENTIMENT_OPTIONS = [
  { label: 'All sentiments', value: '' },
  { label: 'Positive', value: 'positive' },
  { label: 'Neutral', value: 'neutral' },
  { label: 'Negative', value: 'negative' },
]

const SORT_OPTIONS = [
  { label: 'Newest first', value: 'publishedAt:desc' },
  { label: 'Oldest first', value: 'publishedAt:asc' },
]

const getSentimentChipClasses = (sentiment) => {
  if (sentiment === 'positive') {
    return 'bg-gain/20 text-gain border border-gain/30'
  }
  if (sentiment === 'negative') {
    return 'bg-loss/20 text-loss border border-loss/30'
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

const WatchlistNewsPanel = ({ watchlistId, symbols = [], isWatchlistReady = false }) => {
  const [articles, setArticles] = useState([])
  const [nextCursor, setNextCursor] = useState(null)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [loadMoreError, setLoadMoreError] = useState(null)
  const [symbolFilter, setSymbolFilter] = useState('')
  const [sentimentFilter, setSentimentFilter] = useState('')
  const [sortOrder, setSortOrder] = useState('publishedAt:desc')
  const [showAll, setShowAll] = useState(false)

  const symbolOptions = useMemo(
    () => [{ label: 'All symbols', value: '' }, ...symbols.map((symbol) => ({ label: symbol, value: symbol }))],
    [symbols]
  )

  useEffect(() => {
    if (!isWatchlistReady || !watchlistId) {
      return
    }

    const fetchInitialFeed = async () => {
      setLoading(true)
      setError(null)
      setLoadMoreError(null)
      setShowAll(false)
      try {
        const limit = showAll ? EXPANDED_LIMIT : DEFAULT_LIMIT
        const payload = await api.getWatchlistNews(watchlistId, {
          limit,
          symbol: symbolFilter || undefined,
          sentiment: sentimentFilter || undefined,
          sort: sortOrder,
        })
        setArticles(payload.news || [])
        setNextCursor(payload.nextCursor ?? null)
        setHasMore(Boolean(payload.hasMore))
      } catch (err) {
        setArticles([])
        setNextCursor(null)
        setHasMore(false)
        setError(err.message || 'Failed to load watchlist news')
      } finally {
        setLoading(false)
      }
    }

    fetchInitialFeed()
  }, [watchlistId, symbolFilter, sentimentFilter, sortOrder, isWatchlistReady, showAll])

  const handleLoadMore = async () => {
    if (!watchlistId || !hasMore || nextCursor === null || loadingMore) {
      return
    }

    setLoadingMore(true)
    setLoadMoreError(null)
    try {
      const payload = await api.getWatchlistNews(watchlistId, {
        limit: DEFAULT_LIMIT,
        cursor: nextCursor,
        symbol: symbolFilter || undefined,
        sentiment: sentimentFilter || undefined,
        sort: sortOrder,
      })
      setArticles((existingArticles) => [...existingArticles, ...(payload.news || [])])
      setNextCursor(payload.nextCursor ?? null)
      setHasMore(Boolean(payload.hasMore))
    } catch (err) {
      setLoadMoreError(err.message || 'Failed to load more watchlist news')
    } finally {
      setLoadingMore(false)
    }
  }

  if (!isWatchlistReady) {
    return (
      <div className="bg-surface border border-border rounded-xl p-4">
        <div className="text-sm text-text-muted">Loading news...</div>
      </div>
    )
  }

  if (!symbols.length) {
    return (
      <div className="bg-surface border border-border rounded-xl p-4">
        <div className="text-sm text-text-muted">Add symbols to your watchlist to see news.</div>
      </div>
    )
  }

  if (!watchlistId) {
    return (
      <div className="bg-surface border border-border rounded-xl p-4">
        <div className="text-sm text-text-muted">Unable to sync news right now.</div>
      </div>
    )
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-4">

      <div className="flex flex-wrap gap-2 mb-4">
        <select
          value={symbolFilter}
          onChange={(event) => setSymbolFilter(event.target.value)}
          className="text-xs bg-surface-raised border border-border rounded-lg px-2 py-1.5 text-text"
          aria-label="Filter by symbol"
        >
          {symbolOptions.map((option) => (
            <option key={option.label} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={sentimentFilter}
          onChange={(event) => setSentimentFilter(event.target.value)}
          className="text-xs bg-surface-raised border border-border rounded-lg px-2 py-1.5 text-text"
          aria-label="Filter by sentiment"
        >
          {SENTIMENT_OPTIONS.map((option) => (
            <option key={option.label} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={sortOrder}
          onChange={(event) => setSortOrder(event.target.value)}
          className="text-xs bg-surface-raised border border-border rounded-lg px-2 py-1.5 text-text"
          aria-label="Sort order"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.label} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="animate-pulse border border-border rounded-xl p-3">
              <div className="h-4 bg-surface-raised rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-surface-raised rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-sm text-loss">{error}</div>
      ) : articles.length === 0 ? (
        <div className="text-sm text-text-muted">No watchlist news matches your selected filters.</div>
      ) : (
        <div className="space-y-3">
          {articles.map((article, index) => (
            <a
              key={`${article.symbol}-${article.id}-${index}`}
              href={article.url}
              target="_blank"
              rel="noreferrer"
              className="block border border-border hover:border-accent/50 rounded-xl p-3 transition-all duration-150"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="text-sm font-semibold text-text">{article.headline}</h3>
                <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${getSentimentChipClasses(article.sentiment)}`}>
                  {getSentimentLabel(article.sentiment)}
                </span>
              </div>
              <div className="text-xs text-text-muted">
                {article.symbol} · {article.source} · {formatPublishedTime(article.publishedAt)}
              </div>
            </a>
          ))}

          {loadMoreError && (
            <div className="text-sm text-loss">
              Could not load more watchlist news. Please try again.
            </div>
          )}

          {!showAll && articles.length >= DEFAULT_LIMIT && (
            <Button variant="ghost" onClick={() => setShowAll(true)} className="w-full">
              Show more
            </Button>
          )}

          {showAll && hasMore && (
            <Button variant="ghost" onClick={handleLoadMore} disabled={loadingMore} className="w-full">
              {loadingMore ? 'Loading more...' : 'Load more'}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export default WatchlistNewsPanel
