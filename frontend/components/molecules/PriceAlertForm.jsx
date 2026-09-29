import { useRef, useState } from 'react'
import Button from '../atoms/Button'
import { AlertCondition, createAlert } from '../../utils/priceAlerts'
import { formatCurrency } from '../../utils/calculations'

const PriceAlertForm = ({ symbol, currentPrice, onAlertCreated }) => {
  const [condition, setCondition] = useState(AlertCondition.ABOVE)
  const [targetPrice, setTargetPrice] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submittingRef.current) {
      return
    }
    setError('')

    const price = parseFloat(targetPrice)

    if (!price || price <= 0) {
      setError('Please enter a valid price')
      return
    }

    if (condition === AlertCondition.ABOVE && price <= currentPrice) {
      setError(`Target price must be above current price (${formatCurrency(currentPrice)})`)
      return
    }

    if (condition === AlertCondition.BELOW && price >= currentPrice) {
      setError(`Target price must be below current price (${formatCurrency(currentPrice)})`)
      return
    }

    submittingRef.current = true
    setSubmitting(true)
    try {
      const alert = await createAlert(symbol, condition, price)
      setTargetPrice('')

      if (onAlertCreated) {
        await onAlertCreated(alert)
      }
    } catch (err) {
      setError(err.message || 'Failed to create alert')
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-muted mb-2">
          Alert Condition
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setCondition(AlertCondition.ABOVE)}
            className={`flex-1 px-4 py-2 rounded-xl border transition-all duration-150 font-medium ${
              condition === AlertCondition.ABOVE
                ? 'bg-gain border-gain text-white shadow-sm'
                : 'bg-surface-raised border-border text-text hover:border-border/60'
            }`}
          >
            Above
          </button>
          <button
            type="button"
            onClick={() => setCondition(AlertCondition.BELOW)}
            className={`flex-1 px-4 py-2 rounded-xl border transition-all duration-150 font-medium ${
              condition === AlertCondition.BELOW
                ? 'bg-loss border-loss text-white shadow-sm'
                : 'bg-surface-raised border-border text-text hover:border-border/60'
            }`}
          >
            Below
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="targetPrice" className="block text-sm font-medium text-text-muted mb-2">
          Target Price
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted">
            $
          </span>
          <input
            id="targetPrice"
            type="number"
            step="0.01"
            min="0.01"
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
            placeholder="0.00"
            className="w-full pl-8 pr-4 py-2 bg-surface-raised border border-border rounded-xl text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-transparent transition-all duration-150"
          />
        </div>
        <p className="mt-1 text-xs text-text-muted">
          Current price: {formatCurrency(currentPrice)}
        </p>
      </div>

      {error && (
        <div className="p-3 bg-loss/10 border border-loss/20 rounded-xl">
          <p className="text-sm text-loss">{error}</p>
        </div>
      )}

      <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
        {submitting ? 'Creating...' : 'Create Alert'}
      </Button>
    </form>
  )
}

export default PriceAlertForm
