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

  const getSymbolColor = (symbol) => {
    const colors = [
      'bg-blue-500/10 text-blue-500',
      'bg-purple-500/10 text-purple-500',
      'bg-green-500/10 text-green-500',
      'bg-orange-500/10 text-orange-500',
      'bg-pink-500/10 text-pink-500',
    ]
    const index = symbol.charCodeAt(0) % colors.length
    return colors[index]
  }

  if (holdings.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-8">
        <div className="text-center text-text-muted">
          <p className="text-xl mb-2">No holdings yet</p>
          <p className="text-sm">Search for stocks to start trading</p>
        </div>
      </div>
    )
  }

  const isInitialLoading = loading && Object.keys(quotes).length === 0

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-surface-raised">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                Symbol
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">
                Avg Price
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">
                Current Price
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">
                Market Value
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">
                P&L
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isInitialLoading ? (
              [...Array(3)].map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-3.5"><Skeleton className="w-16" /></td>
                  <td className="px-6 py-3.5"><Skeleton className="w-20 ml-auto" /></td>
                  <td className="px-6 py-3.5"><Skeleton className="w-24 ml-auto" /></td>
                  <td className="px-6 py-3.5"><Skeleton className="w-24 ml-auto" /></td>
                  <td className="px-6 py-3.5"><Skeleton className="w-28 ml-auto" /></td>
                  <td className="px-6 py-3.5"><Skeleton className="w-24 ml-auto" /></td>
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
                  className="hover:bg-surface-raised cursor-pointer transition-colors duration-150 motion-reduce:transition-none"
                >
                  <td className="px-6 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${getSymbolColor(holding.symbol)}`}>
                        {holding.symbol.substring(0, 2)}
                      </div>
                      <div className="text-sm font-semibold text-accent">
                        {holding.symbol}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap text-right text-sm text-text tabular-nums">
                    {formatNumber(holding.quantity)}
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap text-right text-sm text-text tabular-nums">
                    {formatCurrency(holding.avgPrice)}
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap text-right text-sm text-text tabular-nums">
                    {loading ? (
                      <div className="h-4 w-16 bg-surface-raised rounded animate-pulse ml-auto"></div>
                    ) : (
                      formatCurrency(currentPrice)
                    )}
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap text-right text-sm font-semibold text-text tabular-nums">
                    {formatCurrency(marketValue)}
                  </td>
                  <td className={`px-6 py-3.5 whitespace-nowrap text-right text-sm font-semibold tabular-nums ${isPositive ? 'text-gain' : 'text-loss'}`}>
                    <div>{formatCurrency(pnl)}</div>
                    <div className="text-xs">{formatPercentage(pnlPercent)}</div>
                  </td>
                </tr>
                )
              })
            )}
          </tbody>
          <tfoot className="bg-surface-raised border-t-2 border-border">
            <tr>
              <td className="px-6 py-3.5 text-sm font-semibold text-text" colSpan={4}>
                Total
              </td>
              <td className="px-6 py-3.5 whitespace-nowrap text-right text-sm font-semibold text-text tabular-nums">
                {formatCurrency(totals.marketValue)}
              </td>
              <td className={`px-6 py-3.5 whitespace-nowrap text-right text-sm font-semibold tabular-nums ${totalsArePositive ? 'text-gain' : 'text-loss'}`}>
                {formatCurrency(totalPnL)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

export default HoldingsTable
