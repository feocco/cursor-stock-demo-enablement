import { useNavigate } from 'react-router-dom'
import { formatCurrency, formatPercentage } from '../../utils/calculations'

const StockCard = ({ symbol, quote, onRemove, variant = 'compact', showRemove = true }) => {
  const navigate = useNavigate()

  if (!quote) {
    return (
      <div className="bg-surface border border-border rounded-xl p-4 animate-pulse">
        <div className="h-6 bg-surface-raised rounded w-20 mb-2"></div>
        <div className="h-8 bg-surface-raised rounded w-32"></div>
      </div>
    )
  }

  const isPositive = quote.change > 0
  const isNeutral = quote.change === 0
  const changeColorClass = isPositive 
    ? 'text-gain bg-gain/10' 
    : isNeutral
    ? 'text-text-muted bg-surface-raised'
    : 'text-loss bg-loss/10'

  const isExpanded = variant === 'expanded'
  const priceSize = isExpanded ? 'text-xl' : 'text-base'
  const changeSize = isExpanded ? 'text-sm' : 'text-xs'

  return (
    <div className="bg-surface border border-border rounded-xl p-4 hover:border-accent/50 transition-all duration-150 group">
      <div className="flex justify-between items-start mb-2">
        <button
          onClick={() => navigate(`/stock/${symbol}`)}
          className="font-bold text-lg text-accent hover:text-accent-hover transition-colors"
        >
          {symbol}
        </button>
        {onRemove && showRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRemove(symbol)
            }}
            className="text-text-muted hover:text-loss opacity-0 group-hover:opacity-100 transition-opacity text-lg leading-none"
            aria-label={`Remove ${symbol} from watchlist`}
          >
            ✕
          </button>
        )}
      </div>
      
      <div className="space-y-2">
        <div className={`font-bold ${priceSize} text-text tabular-nums`}>
          {formatCurrency(quote.currentPrice)}
        </div>
        
        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded ${changeSize} font-semibold tabular-nums ${changeColorClass}`}>
          <span className="text-xs">{isPositive ? '▲' : isNeutral ? '—' : '▼'}</span>
          <span>{formatCurrency(quote.change)}</span>
          <span>({formatPercentage(quote.changePercent)})</span>
        </div>
      </div>
    </div>
  )
}

export default StockCard
