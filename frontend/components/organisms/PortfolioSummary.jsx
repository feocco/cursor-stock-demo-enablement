import { usePortfolio } from '../../context/PortfolioContext'
import { useMultipleQuotes } from '../../hooks/useStockData'
import { 
  formatCurrency, 
  formatPercentage, 
  calculatePortfolioValue, 
  calculateTotalPnL 
} from '../../utils/calculations'
import Skeleton from '../atoms/Skeleton'

const PortfolioSummary = () => {
  const { cash, holdings } = usePortfolio()
  const symbols = holdings.map(h => h.symbol)
  const { quotes, loading } = useMultipleQuotes(symbols)

  const currentPrices = {}
  Object.keys(quotes).forEach(symbol => {
    currentPrices[symbol] = quotes[symbol]?.currentPrice || 0
  })

  const portfolioValue = calculatePortfolioValue(holdings, currentPrices)
  const totalPnL = calculateTotalPnL(holdings, currentPrices)
  const totalValue = cash + portfolioValue
  const costBasis = portfolioValue - totalPnL
  const pnlPercent = costBasis > 0 ? (totalPnL / costBasis) * 100 : 0

  const isPositive = totalPnL >= 0
  const isLoading = loading && holdings.length > 0

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-800 dark:bg-gray-800 light:bg-white border border-gray-700 dark:border-gray-700 light:border-gray-200 rounded-lg p-6">
            <Skeleton className="w-24 mb-3" />
            <Skeleton className="w-32 h-9 mb-1" />
            {i === 3 && <Skeleton className="w-20 h-5" />}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-gray-800 dark:bg-gray-800 light:bg-white border border-gray-700 dark:border-gray-700 light:border-gray-200 rounded-lg p-6">
        <div className="text-gray-400 dark:text-gray-400 light:text-gray-600 text-sm mb-2">Total Value</div>
        <div className="text-white dark:text-white light:text-gray-900 text-3xl font-bold">
          {formatCurrency(totalValue)}
        </div>
      </div>

      <div className="bg-gray-800 dark:bg-gray-800 light:bg-white border border-gray-700 dark:border-gray-700 light:border-gray-200 rounded-lg p-6">
        <div className="text-gray-400 dark:text-gray-400 light:text-gray-600 text-sm mb-2">Portfolio Value</div>
        <div className="text-white dark:text-white light:text-gray-900 text-3xl font-bold">
          {formatCurrency(portfolioValue)}
        </div>
      </div>

      <div className="bg-gray-800 dark:bg-gray-800 light:bg-white border border-gray-700 dark:border-gray-700 light:border-gray-200 rounded-lg p-6">
        <div className="text-gray-400 dark:text-gray-400 light:text-gray-600 text-sm mb-2">Cash Balance</div>
        <div className="text-white dark:text-white light:text-gray-900 text-3xl font-bold">
          {formatCurrency(cash)}
        </div>
      </div>

      <div className="bg-gray-800 dark:bg-gray-800 light:bg-white border border-gray-700 dark:border-gray-700 light:border-gray-200 rounded-lg p-6">
        <div className="text-gray-400 dark:text-gray-400 light:text-gray-600 text-sm mb-2">Total P&L</div>
        <div className={`text-3xl font-bold ${isPositive ? 'text-gain' : 'text-loss'}`}>
          {formatCurrency(totalPnL)}
        </div>
        <div className={`text-sm ${isPositive ? 'text-gain' : 'text-loss'}`}>
          {formatPercentage(pnlPercent)}
        </div>
      </div>
    </div>
  )
}

export default PortfolioSummary
