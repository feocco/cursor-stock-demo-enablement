import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Sun, Moon, TrendingUp } from 'lucide-react'
import { usePortfolio } from '../../context/PortfolioContext'
import SearchBar from '../molecules/SearchBar'
import { formatCurrency } from '../../utils/calculations'
import { useTheme } from '../../hooks/useTheme'
import MarketStatus from '../atoms/MarketStatus'

const Header = () => {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  
  const portfolio = usePortfolio()
  const cash = portfolio?.cash ?? 0

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/transactions', label: 'Transactions' },
  ]

  return (
    <header className="bg-surface border-b border-border px-4 md:px-6 py-3 backdrop-blur-sm bg-surface/80 sticky top-0 z-30">
      {/* Desktop Header */}
      <div className="hidden lg:flex items-center justify-between gap-6">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 group">
            <TrendingUp className="w-6 h-6 text-accent transition-transform group-hover:scale-110 duration-150" />
            <span className="text-xl font-bold text-text">StockSim</span>
          </Link>
          
          <nav className="flex gap-1">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-150 motion-reduce:transition-none ${
                  location.pathname === item.path
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-text-muted hover:text-text hover:bg-surface-raised'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <SearchBar />

          <MarketStatus />
          
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-surface-raised transition-all duration-150 motion-reduce:transition-none"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
          
          <div className="bg-surface-raised border border-border rounded-lg px-4 py-2">
            <div className="text-xs text-text-muted">Cash Balance</div>
            <div className="text-lg font-bold text-text tabular-nums">
              {formatCurrency(cash)}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between mb-4">
          <Link to="/" className="flex items-center gap-2 group">
            <TrendingUp className="w-5 h-5 text-accent transition-transform group-hover:scale-110 duration-150" />
            <span className="text-lg font-bold text-text">StockSim</span>
          </Link>
          
          <div className="flex items-center gap-3">
            <MarketStatus compact />
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-surface-raised transition-all duration-150"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
            
            <div className="bg-surface-raised border border-border rounded-lg px-3 py-1.5">
              <div className="text-xs text-text-muted">Cash</div>
              <div className="text-sm font-bold text-text tabular-nums">
                {formatCurrency(cash)}
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-text-muted hover:text-text p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        <SearchBar />

        {mobileMenuOpen && (
          <nav className="mt-4 flex flex-col gap-2">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-150 ${
                  location.pathname === item.path
                    ? 'bg-accent text-white'
                    : 'text-text-muted hover:text-text hover:bg-surface-raised'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  )
}

export default Header
