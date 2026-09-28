import { useWatchlist } from '../../context/WatchlistContext'
import { useMultipleQuotes } from '../../hooks/useStockData'
import { useNavigate } from 'react-router-dom'
import { formatCurrency, formatPercentage } from '../../utils/calculations'
import Card from '../atoms/Card'
import Badge from '../atoms/Badge'
import Skeleton from '../atoms/Skeleton'

const WatchlistHighlights = () => {
  const { watchlist } = useWatchlist()
  const { quotes, loading, error } = useMultipleQuotes(watchlist)
  const navigate = useNavigate()

  if (watchlist.length === 0) {
    return (
      <Card padding="lg">
        <h2 className="text-xl font-semibold text-text mb-4">Watchlist Highlights</h2>
        <div className="text-center text-text-muted py-8">
          <p className="text-sm">No stocks in watchlist</p>
          <p className="text-xs mt-2">Add stocks to track their prices and changes</p>
        </div>
      </Card>
    )
  }

  if (loading && Object.keys(quotes).length === 0) {
    return (
      <Card>
        <h2 className="text-xl font-semibold text-text mb-4">Watchlist Highlights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(Math.min(watchlist.length, 4))].map((_, i) => (
            <Card key={i} variant="raised" padding="default">
              <Skeleton className="w-20 mb-3" />
              <Skeleton className="w-32 h-8 mb-2" />
              <Skeleton className="w-28 h-7" />
            </Card>
          ))}
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <h2 className="text-xl font-semibold text-text mb-4">Watchlist Highlights</h2>
        <div className="text-center text-loss py-4">
          <p className="text-sm">Error loading stock data: {error}</p>
        </div>
      </Card>
    )
  }

  const handleStockClick = (symbol) => {
    navigate(`/stock/${symbol}`)
  }

  return (
    <Card>
      <h2 className="text-xl font-semibold text-text mb-4">Watchlist Highlights</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {watchlist.map(symbol => {
          const quote = quotes[symbol]
          
          if (!quote) {
            return (
              <Card
                key={symbol}
                variant="raised"
                padding="default"
              >
                <Skeleton className="w-20 mb-2" />
                <Skeleton className="w-32 h-8" />
              </Card>
            )
          }

          const isPositive = quote.change > 0
          const isNegative = quote.change < 0
          const isZero = quote.change === 0

          return (
            <Card
              key={symbol}
              variant="raised"
              padding="default"
              hover={true}
              onClick={() => handleStockClick(symbol)}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-lg text-accent">
                  {symbol}
                </h3>
              </div>
              
              <div className="space-y-2">
                <div className="text-2xl font-bold text-text tabular-nums">
                  {formatCurrency(quote.currentPrice)}
                </div>
                
                <Badge 
                  variant={isZero ? 'muted' : isPositive ? 'gain' : 'loss'} 
                  showArrow={!isZero}
                  size="sm"
                >
                  {formatCurrency(quote.change)} ({formatPercentage(quote.changePercent)})
                </Badge>
              </div>
            </Card>
          )
        })}
      </div>
    </Card>
  )
}

export default WatchlistHighlights

