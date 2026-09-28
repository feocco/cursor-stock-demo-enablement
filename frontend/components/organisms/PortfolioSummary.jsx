import { usePortfolio } from '../../context/PortfolioContext'
import { 
  formatCurrency, 
  formatPercentage, 
  calculatePortfolioValue, 
  calculateTotalPnL 
} from '../../utils/calculations'
import Card from '../atoms/Card'
import Badge from '../atoms/Badge'
import Skeleton from '../atoms/Skeleton'

const PortfolioSummary = ({ quotes = {}, quotesLoading = false }) => {
  const { cash, holdings } = usePortfolio()

  const currentPrices = {}
  Object.keys(quotes).forEach(symbol => {
    currentPrices[symbol] = quotes[symbol]?.currentPrice || 0
  })

  const portfolioValue = calculatePortfolioValue(holdings, currentPrices)
  const totalValue = cash + portfolioValue
  const startingCapital = 100000
  const totalPnL = totalValue - startingCapital
  const pnlPercent = (totalPnL / startingCapital) * 100

  const isPositive = totalPnL > 0
  const isNegative = totalPnL < 0
  const isZero = totalPnL === 0
  const isLoading = quotesLoading && holdings.length > 0

  if (isLoading) {
    return (
      <div>
        <Card className="mb-6">
          <Skeleton className="w-40 h-10 mb-2" />
          <Skeleton className="w-24 h-6" />
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <Skeleton className="w-24 mb-3" />
              <Skeleton className="w-32 h-8" />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <Card className="mb-6 bg-gradient-to-br from-surface to-surface-raised">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="text-text-muted text-xs uppercase tracking-wide mb-2">Total Portfolio Value</div>
            <div className="flex items-baseline gap-3 mb-3">
              <div className="text-text text-5xl font-bold tracking-tight tabular-nums">
                {formatCurrency(totalValue)}
              </div>
              <Badge 
                variant={isZero ? 'muted' : isPositive ? 'gain' : 'loss'} 
                showArrow={!isZero}
                size="md"
              >
                {formatCurrency(totalPnL)} ({formatPercentage(pnlPercent)})
              </Badge>
            </div>
            <div className="flex gap-6 text-sm">
              <div>
                <span className="text-text-muted">Holdings:</span>{' '}
                <span className="text-text font-semibold tabular-nums">{formatCurrency(portfolioValue)}</span>
              </div>
              <div>
                <span className="text-text-muted">Cash:</span>{' '}
                <span className="text-text font-semibold tabular-nums">{formatCurrency(cash)}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default PortfolioSummary
