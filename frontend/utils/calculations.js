// Portfolio calculation utilities

export const calculatePortfolioValue = (holdings, currentPrices) => {
  return holdings.reduce((total, holding) => {
    const currentPrice = currentPrices[holding.symbol] || holding.avgPrice
    return total + (holding.quantity * currentPrice)
  }, 0)
}

export const calculateTotalPnL = (holdings, currentPrices) => {
  return holdings.reduce((total, holding) => {
    const currentPrice = currentPrices[holding.symbol] || holding.avgPrice
    const currentValue = holding.quantity * currentPrice
    const costBasis = holding.quantity * holding.avgPrice
    return total + (currentValue - costBasis)
  }, 0)
}

export const calculateHoldingPnL = (holding, currentPrice) => {
  const currentValue = holding.quantity * currentPrice
  const costBasis = holding.quantity * holding.avgPrice
  return currentValue - costBasis
}

export const calculatePnLPercentage = (holding, currentPrice) => {
  if (holding.avgPrice === 0) return 0
  return ((currentPrice - holding.avgPrice) / holding.avgPrice) * 100
}

export const formatCurrency = (value) => {
  const absValue = Math.abs(value)
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(absValue)
  return value >= 0 ? formatted : `-${formatted}`
}

export const formatPercentage = (value) => {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

export const formatNumber = (value) => {
  return new Intl.NumberFormat('en-US').format(value)
}

