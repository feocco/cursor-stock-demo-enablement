import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { usePortfolio } from '../../context/PortfolioContext'
import SearchBar from '../molecules/SearchBar'
import { formatCurrency } from '../../utils/calculations'
import { useTheme } from '../../hooks/useTheme'

const Header = () => {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  
  // Get cash from portfolio - will be 0 if not ready yet
  const portfolio = usePortfolio()
  const cash = portfolio?.cash ?? 0

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/transactions', label: 'Transactions' },
  ]

  return (
    <header className="bg-gray-900 dark:bg-gray-900 light:bg-white border-b border-gray-700 dark:border-gray-700 light:border-gray-200 px-4 md:px-6 py-4">
      {/* Desktop Header */}
      <div className="hidden lg:flex items-center justify-between gap-6">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="text-2xl font-bold text-white dark:text-white light:text-gray-900">📈 StockSim</div>
          </Link>
          
          <nav className="flex gap-1">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 dark:text-gray-400 light:text-gray-600 hover:text-white dark:hover:text-white light:hover:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-800 light:hover:bg-gray-100'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-6">
          <SearchBar />
          
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-gray-400 dark:text-gray-400 light:text-gray-600 hover:text-white dark:hover:text-white light:hover:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-800 light:hover:bg-gray-100 transition-colors"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
          
          <div className="bg-gray-800 dark:bg-gray-800 light:bg-gray-50 border border-gray-700 dark:border-gray-700 light:border-gray-200 rounded-lg px-4 py-2">
            <div className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600">Cash Balance</div>
            <div className="text-lg font-bold text-white dark:text-white light:text-gray-900">
              {formatCurrency(cash)}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between mb-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="text-xl font-bold text-white dark:text-white light:text-gray-900">📈 StockSim</div>
          </Link>
          
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-400 dark:text-gray-400 light:text-gray-600 hover:text-white dark:hover:text-white light:hover:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-800 light:hover:bg-gray-100 transition-colors"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            
            <div className="bg-gray-800 dark:bg-gray-800 light:bg-gray-50 border border-gray-700 dark:border-gray-700 light:border-gray-200 rounded-lg px-3 py-1.5">
              <div className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600">Cash</div>
              <div className="text-sm font-bold text-white dark:text-white light:text-gray-900">
                {formatCurrency(cash)}
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-400 dark:text-gray-400 light:text-gray-600 hover:text-white dark:hover:text-white light:hover:text-gray-900 p-2"
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
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 dark:text-gray-400 light:text-gray-600 hover:text-white dark:hover:text-white light:hover:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-800 light:hover:bg-gray-100'
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
