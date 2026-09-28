import { useNavigate } from 'react-router-dom'
import { usePortfolio } from '../context/PortfolioContext'
import { formatCurrency, formatNumber } from '../utils/calculations'

const Transactions = () => {
  const navigate = useNavigate()
  const { transactions } = usePortfolio()

  if (transactions.length === 0) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white dark:text-white light:text-gray-900 mb-8">Transaction History</h1>
        <div className="bg-gray-800 dark:bg-gray-800 light:bg-white border border-gray-700 dark:border-gray-700 light:border-gray-200 rounded-lg p-8">
          <div className="text-center text-gray-400 dark:text-gray-400 light:text-gray-600">
            <p className="text-xl mb-2">No transactions yet</p>
            <p className="text-sm">Your trading history will appear here</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold text-white dark:text-white light:text-gray-900 mb-8">Transaction History</h1>

      <div className="bg-gray-800 dark:bg-gray-800 light:bg-white border border-gray-700 dark:border-gray-700 light:border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900 dark:bg-gray-900 light:bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 dark:text-gray-400 light:text-gray-600 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 dark:text-gray-400 light:text-gray-600 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 dark:text-gray-400 light:text-gray-600 uppercase tracking-wider">
                  Symbol
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 dark:text-gray-400 light:text-gray-600 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 dark:text-gray-400 light:text-gray-600 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 dark:text-gray-400 light:text-gray-600 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700 dark:divide-gray-700 light:divide-gray-200">
              {transactions.map((transaction) => {
                const transactionType = transaction.type?.toUpperCase() || ''
                const isBuy = transactionType === 'BUY'
                const date = new Date(transaction.timestamp).toLocaleString()

                return (
                  <tr 
                    key={transaction.id}
                    onClick={() => navigate(`/stock/${transaction.symbol}`)}
                    className="hover:bg-gray-700 dark:hover:bg-gray-700 light:hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 dark:text-gray-300 light:text-gray-700">
                      {date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        isBuy 
                          ? 'bg-green-900 text-green-200' 
                          : 'bg-red-900 text-red-200'
                      }`}>
                        {transactionType || transaction.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-blue-400 dark:text-blue-400 light:text-blue-600">
                        {transaction.symbol}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-white dark:text-white light:text-gray-900">
                      {formatNumber(transaction.quantity)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-white dark:text-white light:text-gray-900">
                      {formatCurrency(transaction.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-white dark:text-white light:text-gray-900">
                      {formatCurrency(transaction.total)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Transactions
