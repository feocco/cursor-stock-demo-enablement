import { useNavigate } from 'react-router-dom'
import { usePortfolio } from '../context/PortfolioContext'
import { formatCurrency, formatNumber } from '../utils/calculations'
import Badge from '../components/atoms/Badge'

const Transactions = () => {
  const navigate = useNavigate()
  const { transactions } = usePortfolio()

  if (transactions.length === 0) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-text mb-8">Transaction History</h1>
        <div className="bg-surface border border-border rounded-xl p-8">
          <div className="text-center text-text-muted">
            <p className="text-xl mb-2">No transactions yet</p>
            <p className="text-sm">Your trading history will appear here</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold text-text mb-8">Transaction History</h1>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        {/* Desktop table view */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-raised">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Symbol
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-text-muted uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-text-muted uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-text-muted uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {transactions.map((transaction) => {
                const transactionType = transaction.type?.toUpperCase() || ''
                const isBuy = transactionType === 'BUY'
                const date = new Date(transaction.timestamp).toLocaleString()

                return (
                  <tr 
                    key={transaction.id}
                    onClick={() => navigate(`/stock/${transaction.symbol}`)}
                    className="hover:bg-surface-raised cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">
                      {date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={isBuy ? 'gain' : 'loss'} size="sm">
                        {transactionType || transaction.type}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-accent">
                        {transaction.symbol}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-text">
                      {formatNumber(transaction.quantity)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-text">
                      {formatCurrency(transaction.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-text">
                      {formatCurrency(transaction.total)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile card view */}
        <div className="sm:hidden divide-y divide-border">
          {transactions.map((transaction) => {
            const transactionType = transaction.type?.toUpperCase() || ''
            const isBuy = transactionType === 'BUY'
            const date = new Date(transaction.timestamp).toLocaleString()

            return (
              <div
                key={transaction.id}
                onClick={() => navigate(`/stock/${transaction.symbol}`)}
                className="p-4 hover:bg-surface-raised cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="text-lg font-semibold text-accent">
                    {transaction.symbol}
                  </div>
                  <Badge variant={isBuy ? 'gain' : 'loss'} size="sm">
                    {transactionType || transaction.type}
                  </Badge>
                </div>
                <div className="text-xs text-text-muted mb-3">
                  {date}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-text-muted text-xs">Quantity</div>
                    <div className="text-text font-medium">{formatNumber(transaction.quantity)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-text-muted text-xs">Price</div>
                    <div className="text-text font-medium">{formatCurrency(transaction.price)}</div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border flex justify-between items-center">
                  <div className="text-text-muted text-xs">Total</div>
                  <div className="text-text font-semibold">{formatCurrency(transaction.total)}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Transactions
