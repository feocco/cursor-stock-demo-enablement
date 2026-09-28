import { formatCurrency, formatPercentage } from '../../utils/calculations'

const PriceDisplay = ({ price, change, changePercent, size = 'md', showChange = true }) => {
  const isPositive = change >= 0
  const colorClass = isPositive ? 'text-gain' : 'text-loss'
  
  const sizes = {
    sm: 'text-base',
    md: 'text-2xl',
    lg: 'text-4xl',
  }
  
  const changeSize = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }
  
  return (
    <div className="flex flex-col">
      <div className={`font-bold ${sizes[size]}`}>
        {formatCurrency(price)}
      </div>
      {showChange && (
        <div className={`${colorClass} ${changeSize[size]} font-semibold flex items-center gap-1`}>
          <span>{isPositive ? '▲' : '▼'}</span>
          <span>{formatCurrency(change)}</span>
          <span>({formatPercentage(changePercent)})</span>
        </div>
      )}
    </div>
  )
}

export default PriceDisplay
