import { useState } from 'react'
import { usePortfolio } from '../../context/PortfolioContext'
import Button from '../atoms/Button'
import TradeModal from '../molecules/TradeModal'
import { formatCurrency, formatNumber } from '../../utils/calculations'

const TradingPanel = ({ symbol, currentPrice }) => {
  const { cash, getHolding, buyStock, sellStock } = usePortfolio()
  const [tradeType, setTradeType] = useState(null)
  const [notification, setNotification] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const holding = getHolding(symbol)
  const availableShares = holding?.quantity || 0

  const handleTrade = async (quantity, executionPrice) => {
    setIsProcessing(true)
    let notificationTimer = null
    
    try {
      // Execute trade at the locked price from the modal
      const result = tradeType === 'BUY'
        ? await buyStock(symbol, quantity, executionPrice)
        : await sellStock(symbol, quantity, executionPrice)

      if (result.success) {
        const shareText = quantity === 1 ? '1 share' : `${formatNumber(quantity)} shares`;
        setNotification({
          type: 'success',
          message: `Successfully ${tradeType === 'BUY' ? 'bought' : 'sold'} ${shareText} of ${symbol}`
        })
        // Keep notification visible for 5s
        notificationTimer = setTimeout(() => setNotification(null), 5000)
      } else {
        setNotification({
          type: 'error',
          message: result.error
        })
        // Keep error visible for 5s
        notificationTimer = setTimeout(() => setNotification(null), 5000)
      }

      setTradeType(null)
    } finally {
      // Re-enable buttons after 300ms to prevent double-click bleed-through
      setTimeout(() => {
        setIsProcessing(false)
      }, 300)
    }
  }

  return (
    <div className="bg-surface border border-border rounded-lg p-6">
      <h2 className="text-xl font-semibold text-text mb-6">Trade {symbol}</h2>

      {notification && (
        <div className={`mb-4 p-4 rounded-lg ${
          notification.type === 'success' 
            ? 'bg-green-900 border border-green-700 text-green-100' 
            : 'bg-red-900 border border-red-700 text-red-100'
        }`}>
          {notification.message}
        </div>
      )}

      <div className="space-y-4 mb-6">
        <div className="bg-surface-raised rounded-lg p-4">
          <div className="text-text-muted text-sm mb-1">Available Cash</div>
          <div className="text-text text-lg font-semibold">
            {formatCurrency(cash)}
          </div>
        </div>

        <div className="bg-surface-raised rounded-lg p-4">
          <div className="text-text-muted text-sm mb-1">Your Holdings</div>
          <div className="text-text text-lg font-semibold">
            {holding ? (
              <>
                {formatNumber(holding.quantity)} {holding.quantity === 1 ? 'share' : 'shares'}
                <div className="text-sm text-text-muted mt-1">
                  Avg Price: {formatCurrency(holding.avgPrice)}
                </div>
              </>
            ) : (
              'None'
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Button
          variant="success"
          onClick={() => setTradeType('BUY')}
          className="w-full"
          disabled={cash < currentPrice || isProcessing}
        >
          Buy {symbol}
        </Button>
        <Button
          variant="danger"
          onClick={() => setTradeType('SELL')}
          className="w-full"
          disabled={!holding || holding.quantity === 0 || isProcessing}
        >
          Sell {symbol}
        </Button>
      </div>

      <TradeModal
        isOpen={tradeType !== null}
        onClose={() => setTradeType(null)}
        type={tradeType}
        symbol={symbol}
        currentPrice={currentPrice}
        onConfirm={handleTrade}
        availableShares={availableShares}
        availableCash={cash}
      />
    </div>
  )
}

export default TradingPanel
