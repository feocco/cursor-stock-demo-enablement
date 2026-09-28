import { AlertCondition, deleteAlert } from '../../utils/priceAlerts'
import { formatCurrency } from '../../utils/calculations'
import Button from '../atoms/Button'

const PriceAlertsList = ({ alerts, onAlertDeleted }) => {
  const handleDelete = (alertId) => {
    deleteAlert(alertId)
    if (onAlertDeleted) {
      onAlertDeleted(alertId)
    }
  }

  if (alerts.length === 0) {
    return (
      <div className="text-center py-6 text-text-muted">
        <p className="text-sm">No active alerts</p>
        <p className="text-xs mt-1">Create an alert to get notified when price targets are reached</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => {
        const isAbove = alert.condition === AlertCondition.ABOVE
        const conditionText = isAbove ? 'above' : 'below'
        const conditionColor = isAbove ? 'text-gain' : 'text-loss'
        const conditionIcon = isAbove ? '▲' : '▼'

        return (
          <div
            key={alert.id}
            className="flex items-center justify-between p-4 bg-surface-raised border border-border rounded-xl hover:border-border/60 transition-all duration-150"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-accent">{alert.symbol}</span>
                <span className={`text-sm ${conditionColor}`}>
                  {conditionIcon} {conditionText} {formatCurrency(alert.targetPrice)}
                </span>
              </div>
              <p className="text-xs text-text-muted">
                Created {new Date(alert.createdAt).toLocaleString()}
              </p>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleDelete(alert.id)}
            >
              Delete
            </Button>
          </div>
        )
      })}
    </div>
  )
}

export default PriceAlertsList
