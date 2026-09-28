import { usePortfolio } from '../context/PortfolioContext'
import { useWatchlist } from '../context/WatchlistContext'
import PortfolioSummary from '../components/organisms/PortfolioSummary'
import HoldingsTable from '../components/organisms/HoldingsTable'
import WatchlistHighlights from '../components/organisms/WatchlistHighlights'
import WatchlistNewsPanel from '../components/organisms/WatchlistNewsPanel'
import PortfolioCommentary from '../components/organisms/PortfolioCommentary'
import Button from '../components/atoms/Button'

const Dashboard = () => {
  const { resetPortfolio } = usePortfolio()
  const { watchlist, activeWatchlistId, isReady } = useWatchlist()

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset your portfolio? This will delete all holdings and transactions and reset your cash to $100,000.')) {
      await resetPortfolio()
    }
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text mb-1">Portfolio</h1>
          <p className="text-text-muted text-xs">Last updated: {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleReset}>
          Reset
        </Button>
      </div>

      <div className="space-y-8">
        <PortfolioSummary />
        
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs uppercase tracking-wide text-text-muted font-medium">Watchlist</span>
            <div className="h-px flex-1 bg-border"></div>
          </div>
          <WatchlistHighlights />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs uppercase tracking-wide text-text-muted font-medium">Your Holdings</span>
              <div className="h-px flex-1 bg-border"></div>
            </div>
            <HoldingsTable />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs uppercase tracking-wide text-text-muted font-medium">News</span>
              <div className="h-px flex-1 bg-border"></div>
            </div>
            <WatchlistNewsPanel
              watchlistId={activeWatchlistId}
              symbols={watchlist}
              isWatchlistReady={isReady}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs uppercase tracking-wide text-text-muted font-medium">AI Analysis</span>
            <div className="h-px flex-1 bg-border"></div>
          </div>
          <PortfolioCommentary />
        </div>
      </div>
    </div>
  )
}

export default Dashboard
