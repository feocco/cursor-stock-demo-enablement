import { useState, useEffect } from 'react'
import Button from '../atoms/Button'
import Input from '../atoms/Input'
import { formatCurrency, formatNumber } from '../../utils/calculations'

const parseQuantity = (value) => {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const TradeModal = ({ 
  isOpen, 
  onClose, 
  type, 
  symbol, 
  currentPrice, 
  onConfirm,
  availableShares = 0,
  availableCash = 0
}) => {
  const [quantity, setQuantity] = useState('')
  const [error, setError] = useState('')
  const [lockedPrice, setLockedPrice] = useState(null)

  // Lock the price only when modal first opens, ignore subsequent currentPrice changes
  useEffect(() => {
    if (isOpen && !lockedPrice && currentPrice) {
      setLockedPrice(currentPrice)
    } else if (!isOpen && lockedPrice) {
      // Reset when modal closes
      setLockedPrice(null)
    }
  }, [isOpen, currentPrice, lockedPrice])

  if (!isOpen) return null

  const isBuy = type === 'BUY'
  const priceToUse = lockedPrice || currentPrice
  const quantityNum = parseQuantity(quantity)
  const total = Math.max(0, quantityNum * priceToUse) // Never show negative total

  const handleQuantityChange = (e) => {
    const value = e.target.value
    setQuantity(value)
    setError('')

    if (value.trim() === '') {
      return
    }

    const num = parseQuantity(value)
    if (num <= 0) {
      setError('Quantity must be greater than 0')
      return
    }

    if (isBuy) {
      if (num * priceToUse > availableCash) {
        setError('Insufficient funds')
      }
    } else {
      if (num > availableShares) {
        setError('Insufficient shares')
      }
    }
  }

  const handleQuickAmount = (percentage) => {
    let amount
    if (isBuy) {
      const maxShares = availableCash / priceToUse
      amount = (maxShares * percentage).toFixed(6)
    } else {
      amount = (availableShares * percentage).toFixed(6)
    }
    
    const cleanAmount = parseFloat(amount).toString()
    setQuantity(cleanAmount)
    
    const num = parseQuantity(cleanAmount)
    if (isBuy && num * priceToUse > availableCash) {
      setError('Insufficient funds')
    } else if (!isBuy && num > availableShares) {
      setError('Insufficient shares')
    } else {
      setError('')
    }
  }

  const handleConfirm = () => {
    if (error || !quantity || quantityNum <= 0) return

    // Pass both quantity and locked price so trade executes at the confirmed price
    onConfirm(quantityNum, priceToUse)
    setQuantity('')
    setError('')
  }

  const handleClose = () => {
    setQuantity('')
    setError('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-text">
            {isBuy ? 'Buy' : 'Sell'} {symbol}
          </h2>
          <button
            onClick={handleClose}
            className="text-text-muted hover:text-text text-2xl transition-colors"
          >
            ×
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-surface-raised rounded-lg p-4">
            <div className="text-text-muted text-sm mb-1">Current Price</div>
            <div className="text-text text-xl font-bold tabular-nums">
              {formatCurrency(priceToUse)}
            </div>
          </div>

          {!isBuy && (
            <div className="bg-surface-raised rounded-lg p-4">
              <div className="text-text-muted text-sm mb-1">Available Shares</div>
              <div className="text-text text-xl font-bold tabular-nums">{formatNumber(availableShares)}</div>
            </div>
          )}

          {isBuy && (
            <div className="bg-surface-raised rounded-lg p-4">
              <div className="text-text-muted text-sm mb-1">Available Cash</div>
              <div className="text-text text-xl font-bold tabular-nums">
                {formatCurrency(availableCash)}
              </div>
            </div>
          )}

          <div>
            <Input
              type="number"
              label="Quantity"
              value={quantity}
              onChange={handleQuantityChange}
              placeholder="Enter shares"
              min="0.01"
              step="0.01"
              error={error}
            />
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => handleQuickAmount(0.25)}
                className="flex-1 px-3 py-1.5 text-sm bg-surface-raised hover:bg-border/30 text-text border border-border rounded-lg transition-all duration-150"
              >
                25%
              </button>
              <button
                type="button"
                onClick={() => handleQuickAmount(0.5)}
                className="flex-1 px-3 py-1.5 text-sm bg-surface-raised hover:bg-border/30 text-text border border-border rounded-lg transition-all duration-150"
              >
                50%
              </button>
              <button
                type="button"
                onClick={() => handleQuickAmount(1.0)}
                className="flex-1 px-3 py-1.5 text-sm bg-surface-raised hover:bg-border/30 text-text border border-border rounded-lg transition-all duration-150"
              >
                Max
              </button>
            </div>
          </div>

          <div className="bg-surface-raised rounded-lg p-4">
            <div className="text-text-muted text-sm mb-1">Total</div>
            <div className="text-text text-xl font-bold tabular-nums">
              {formatCurrency(total)}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant={isBuy ? 'success' : 'danger'}
            onClick={handleConfirm}
            disabled={!!error || !quantity || quantityNum <= 0}
            className="flex-1"
          >
            Confirm {isBuy ? 'Buy' : 'Sell'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default TradeModal
