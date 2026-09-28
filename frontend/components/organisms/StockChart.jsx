import { useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useStockHistory } from '../../hooks/useStockData'
import Button from '../atoms/Button'
import { formatCurrency } from '../../utils/calculations'

const timeRanges = [
  { label: '1D', period: '1d' },
  { label: '1W', period: '1w' },
  { label: '1M', period: '1m' },
  { label: '3M', period: '3m' },
  { label: '1Y', period: '1y' },
]

const formatAxisLabel = (dateValue, period) => {
  if (Number.isNaN(dateValue.getTime())) {
    return ''
  }

  if (period === '1d') {
    return dateValue.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  if (period === '1y') {
    return dateValue.toLocaleDateString('en-US', {
      month: 'short',
      year: '2-digit',
    })
  }

  return dateValue.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

const formatTooltipLabel = (dateValue, period) => {
  if (Number.isNaN(dateValue.getTime())) {
    return 'Unknown date'
  }

  if (period === '1d') {
    return dateValue.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return dateValue.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const StockChart = ({ symbol }) => {
  const [selectedRange, setSelectedRange] = useState('1m')
  const { history, loading, error, refresh } = useStockHistory(symbol, selectedRange)

  const chartData = useMemo(() => {
    return history
      .map((candle) => {
        const timestamp = new Date(candle.date)
        if (Number.isNaN(timestamp.getTime())) {
          return null
        }

        return {
          timestamp: timestamp.getTime(),
          label: formatAxisLabel(timestamp, selectedRange),
          tooltipLabel: formatTooltipLabel(timestamp, selectedRange),
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume,
        }
      })
      .filter(Boolean)
  }, [history, selectedRange])

  if (loading) {
    return (
      <div className="bg-surface border border-border rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-surface-raised rounded w-32 mb-4"></div>
          <div className="h-96 bg-surface-raised rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-surface border border-border rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-semibold text-text">Price Chart</h2>
            <p className="text-sm text-text-muted">
              Historical prices come from the backend and may fall back to demo history when provider candles are unavailable.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {timeRanges.map((range) => (
              <Button
                key={range.label}
                variant={selectedRange === range.period ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedRange(range.period)}
              >
                {range.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="h-96 flex flex-col items-center justify-center text-center">
          <p className="text-red-400 mb-4">Unable to load historical price data.</p>
          <Button variant="outline" size="sm" onClick={refresh}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-semibold text-text">Price Chart</h2>
            <p className="text-sm text-text-muted">
              Historical prices come from the backend and may fall back to demo history when provider candles are unavailable.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {timeRanges.map((range) => (
              <Button
                key={range.label}
                variant={selectedRange === range.period ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedRange(range.period)}
              >
                {range.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="h-96 flex items-center justify-center text-text-muted">
          No chart data available
        </div>
      </div>
    )
  }

  const firstPrice = chartData[0]?.close || 0
  const lastPrice = chartData[chartData.length - 1]?.close || 0
  const isPositive = lastPrice >= firstPrice
  const lineColor = isPositive ? '#10b981' : '#ef4444'

  return (
    <div className="bg-surface border border-border rounded-lg p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-text">Price Chart</h2>
          <p className="text-sm text-text-muted">
            Historical prices come from the backend and may fall back to demo history when provider candles are unavailable.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {timeRanges.map((range) => (
            <Button
              key={range.label}
              variant={selectedRange === range.period ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedRange(range.period)}
            >
              {range.label}
            </Button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="label"
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af' }}
            minTickGap={24}
          />
          <YAxis
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af' }}
            domain={['auto', 'auto']}
            width={92}
            tickFormatter={(value) => formatCurrency(value)}
          />
          <Tooltip
            labelFormatter={(_, payload) => payload?.[0]?.payload?.tooltipLabel || ''}
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#fff',
            }}
            formatter={(value, name) => [formatCurrency(Number(value)), name === 'close' ? 'Close' : name]}
          />
          <Line
            type="monotone"
            dataKey="close"
            stroke={lineColor}
            strokeWidth={2}
            dot={false}
            animationDuration={300}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default StockChart
