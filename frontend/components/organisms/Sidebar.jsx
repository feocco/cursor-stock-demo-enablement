import { useMemo } from 'react'
import { useWatchlist } from '../../context/WatchlistContext'
import { useMultipleQuotes } from '../../hooks/useStockData'
import StockCard from '../molecules/StockCard'

const Sidebar = () => {
  const { watchlist, removeFromWatchlist } = useWatchlist()
  const { quotes, loading } = useMultipleQuotes(watchlist)

  // Find top mover (biggest absolute change percentage)
  const topMover = useMemo(() => {
    if (!watchlist.length || loading) return null
    
    let topSymbol = null
    let maxChange = 0
    
    watchlist.forEach(symbol => {
      const quote = quotes[symbol]
      if (quote) {
        const absChange = Math.abs(quote.changePercent)
        if (absChange > maxChange) {
          maxChange = absChange
          topSymbol = symbol
        }
      }
    })
    
    return topSymbol
  }, [watchlist, quotes, loading])

  // Sort stocks by change percentage (biggest movers first)
  const sortedWatchlist = useMemo(() => {
    if (!watchlist.length) return []
    
    return [...watchlist].sort((a, b) => {
      const quoteA = quotes[a]
      const quoteB = quotes[b]
      
      if (!quoteA && !quoteB) return 0
      if (!quoteA) return 1
      if (!quoteB) return -1
      
      // Sort by absolute change percentage (descending)
      return Math.abs(quoteB.changePercent) - Math.abs(quoteA.changePercent)
    })
  }, [watchlist, quotes])

  return (
    <div className="w-80 bg-gray-900 dark:bg-gray-900 light:bg-white border-r border-gray-700 dark:border-gray-700 light:border-gray-200 p-4 overflow-y-auto">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-white dark:text-white light:text-gray-900">Watchlist</h2>
        {watchlist.length > 0 && (
          <p className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600 mt-1">
            {watchlist.length} {watchlist.length === 1 ? 'stock' : 'stocks'}
          </p>
        )}
      </div>
      
      {watchlist.length === 0 ? (
        <div className="text-center text-gray-400 dark:text-gray-400 light:text-gray-600 py-8">
          <p className="text-sm">No stocks in watchlist</p>
          <p className="text-xs mt-2">Add stocks to track prices</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedWatchlist.map((symbol, index) => {
            const isTopMover = symbol === topMover && index === 0
            return (
              <div key={symbol} className="relative">
                {isTopMover && (
                  <div className="absolute -top-2 -right-2 z-10">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                      🔥 Top Mover
                    </span>
                  </div>
                )}
                <StockCard
                  symbol={symbol}
                  quote={quotes[symbol]}
                  onRemove={removeFromWatchlist}
                  variant="compact"
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Sidebar
