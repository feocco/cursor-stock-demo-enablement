import { useNavigate } from 'react-router-dom'
import { usePortfolio } from '../../context/PortfolioContext'
import { useMultipleQuotes } from '../../hooks/useStockData'
import { 
  formatCurrency, 
  formatPercentage, 
  formatNumber,
  calculateHoldingPnL,
  calculatePnLPercentage 
} from '../../utils/calculations'
import Skeleton from '../atoms/Skeleton'

const HoldingsTable = () => {
  const navigate = useNavigate()
  const { holdings } = usePortfolio()
  const symbols = holdings.map(h => h.symbol)
  const { quotes, loading } = useMultipleQuotes(symbols)

  const totals = holdings.reduce((acc, holding) => {
    const quote = quotes[holding.symbol]
    const currentPrice = quote?.currentPrice || holding.avgPrice
    const rowCostBasis = parseFloat((holding.quantity * holding.avgPrice).toFixed(2))
    const rowMarketValue = parseFloat((holding.quantity * currentPrice).toFixed(2))

    return {
      costBasis: acc.costBasis + rowCostBasis,
      marketValue: acc.marketValue + rowMarketValue,
    }
  }, { costBasis: 0, marketValue: 0 })

  const totalPnL = totals.marketValue - totals.costBasis
  const totalsArePositive = totalPnL >= 0

  if (holdings.length === 0) {
    return (
      <div className="bg-gray-800 dark:bg-gray-800 light:bg-white border border-gray-700 dark:border-gray-700 light:border-gray-200 rounded-lg p-8">
        <div className="text-center text-gray-400 dark:text-gray-400 light:text-gray-600">
          <p className="text-xl mb-2">No holdings yet</p>
          <p className="text-sm">Search for stocks to start trading</p>
        </div>
      </div>
    )
  }

  const isInitialLoading = loading && Object.keys(quotes).length === 0

  return (
    <div className="bg-gray-800 dark:bg-gray-800 light:bg-white border border-gray-700 dark:border-gray-700 light:border-gray-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-900 dark:bg-gray-900 light:bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 dark:text-gray-400 light:text-gray-600 uppercase tracking-wider">
                Symbol
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 dark:text-gray-400 light:text-gray-600 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 dark:text-gray-400 light:text-gray-600 uppercase tracking-wider">
                Avg Price
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 dark:text-gray-400 light:text-gray-600 uppercase tracking-wider">
                Current Price
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 dark:text-gray-400 light:text-gray-600 uppercase tracking-wider">
                Market Value
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 dark:text-gray-400 light:text-gray-600 uppercase tracking-wider">
                P&L
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 dark:text-gray-400 light:text-gray-600 uppercase tracking-wider">
                P&L %
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700 dark:divide-gray-700 light:divide-gray-200">
            {isInitialLoading ? (
              [...Array(3)].map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4"><Skeleton className="w-16" /></td>
                  <td className="px-6 py-4"><Skeleton className="w-20 ml-auto" /></td>
                  <td className="px-6 py-4"><Skeleton className="w-24 ml-auto" /></td>
                  <td className="px-6 py-4"><Skeleton className="w-24 ml-auto" /></td>
                  <td className="px-6 py-4"><Skeleton className="w-28 ml-auto" /></td>
                  <td className="px-6 py-4"><Skeleton className="w-24 ml-auto" /></td>
                  <td className="px-6 py-4"><Skeleton className="w-20 ml-auto" /></td>
                </tr>
              ))
            ) : (
              holdings.map((holding) => {
                const quote = quotes[holding.symbol]
                const currentPrice = quote?.currentPrice || holding.avgPrice
                const marketValue = holding.quantity * currentPrice
                const pnl = calculateHoldingPnL(holding, currentPrice)
                const pnlPercent = calculatePnLPercentage(holding, currentPrice)
                const isPositive = pnl >= 0

                return (
                <tr 
                  key={holding.symbol}
                  onClick={() => navigate(`/stock/${holding.symbol}`)}
                  className="hover:bg-gray-700 dark:hover:bg-gray-700 light:hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-blue-400 dark:text-blue-400 light:text-blue-600">
                      {holding.symbol}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-white dark:text-white light:text-gray-900">
                    {formatNumber(holding.quantity)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-white dark:text-white light:text-gray-900">
                    {formatCurrency(holding.avgPrice)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-white dark:text-white light:text-gray-900">
                    {loading ? (
                      <div className="h-4 w-16 bg-gray-600 dark:bg-gray-600 light:bg-gray-200 rounded animate-pulse ml-auto"></div>
                    ) : (
                      formatCurrency(currentPrice)
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-white dark:text-white light:text-gray-900">
                    {formatCurrency(marketValue)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-semibold ${isPositive ? 'text-gain' : 'text-loss'}`}>
                    {formatCurrency(pnl)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-semibold ${isPositive ? 'text-gain' : 'text-loss'}`}>
                    {formatPercentage(pnlPercent)}
                  </td>
                </tr>
                )
              })
            )}
          </tbody>
          <tfoot className="bg-gray-900 dark:bg-gray-900 light:bg-gray-50">
            <tr>
              <td className="px-6 py-4 text-sm font-semibold text-gray-300 dark:text-gray-300 light:text-gray-700" colSpan={4}>
                Total
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-white dark:text-white light:text-gray-900">
                {formatCurrency(totals.marketValue)}
              </td>
              <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-semibold ${totalsArePositive ? 'text-gain' : 'text-loss'}`}>
                {formatCurrency(totalPnL)}
              </td>
              <td className="px-6 py-4"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

export default HoldingsTable
