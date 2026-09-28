import { useNavigate } from 'react-router-dom'
import { formatCurrency, formatPercentage } from '../../utils/calculations'

const StockCard = ({ symbol, quote, onRemove, variant = 'compact', showRemove = true }) => {
  const navigate = useNavigate()

  if (!quote) {
    return (
      <div className="bg-gray-800 dark:bg-gray-800 light:bg-gray-50 border border-gray-700 dark:border-gray-700 light:border-gray-200 rounded-lg p-4 animate-pulse">
        <div className="h-6 bg-gray-700 dark:bg-gray-700 light:bg-gray-200 rounded w-20 mb-2"></div>
        <div className="h-8 bg-gray-700 dark:bg-gray-700 light:bg-gray-200 rounded w-32"></div>
      </div>
    )
  }

  const isPositive = quote.change >= 0
  const isNeutral = quote.change === 0
  const changeColorClass = isPositive 
    ? 'text-green-500 bg-green-500/10' 
    : isNeutral
    ? 'text-gray-400 bg-gray-500/10'
    : 'text-red-500 bg-red-500/10'

  const isExpanded = variant === 'expanded'
  const priceSize = isExpanded ? 'text-xl' : 'text-base'
  const changeSize = isExpanded ? 'text-sm' : 'text-xs'

  return (
    <div className="bg-gray-800 dark:bg-gray-800 light:bg-white border border-gray-700 dark:border-gray-700 light:border-gray-200 rounded-lg p-4 hover:border-gray-600 dark:hover:border-gray-600 light:hover:border-gray-300 transition-colors group">
      <div className="flex justify-between items-start mb-2">
        <button
          onClick={() => navigate(`/stock/${symbol}`)}
          className="font-bold text-lg text-blue-400 dark:text-blue-400 light:text-blue-600 hover:text-blue-300 dark:hover:text-blue-300 light:hover:text-blue-700 transition-colors"
        >
          {symbol}
        </button>
        {onRemove && showRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRemove(symbol)
            }}
            className="text-gray-500 dark:text-gray-500 light:text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-lg leading-none"
            aria-label={`Remove ${symbol} from watchlist`}
          >
            ✕
          </button>
        )}
      </div>
      
      <div className="space-y-2">
        <div className={`font-bold ${priceSize} text-white dark:text-white light:text-gray-900`}>
          {formatCurrency(quote.currentPrice)}
        </div>
        
        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded ${changeSize} font-semibold ${changeColorClass}`}>
          <span className="text-xs">{isPositive ? '▲' : isNeutral ? '—' : '▼'}</span>
          <span>{formatCurrency(Math.abs(quote.change))}</span>
          <span>({formatPercentage(quote.changePercent)})</span>
        </div>
      </div>
    </div>
  )
}

export default StockCard
