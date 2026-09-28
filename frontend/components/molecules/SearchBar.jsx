import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStockSearch } from '../../hooks/useStockData'

const SearchBar = () => {
  const [query, setQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const { results, search } = useStockSearch()
  const navigate = useNavigate()
  const searchRef = useRef(null)

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query) {
        search(query)
        setShowResults(true)
      } else {
        setShowResults(false)
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [query, search])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectStock = (symbol) => {
    navigate(`/stock/${symbol}`)
    setQuery('')
    setShowResults(false)
  }

  return (
    <div className="relative w-full max-w-md" ref={searchRef}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search stocks..."
          className="w-full px-4 py-2 pl-10 bg-surface-raised border border-border rounded-xl text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all duration-150"
        />
        <svg
          className="absolute left-3 top-2.5 h-5 w-5 text-text-muted"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-surface border border-border rounded-xl shadow-xl max-h-96 overflow-y-auto">
          {results.map((stock) => (
            <button
              key={stock.symbol}
              onClick={() => handleSelectStock(stock.symbol)}
              className="w-full px-4 py-3 text-left hover:bg-surface-raised transition-colors duration-150 border-b border-border last:border-b-0"
            >
              <div className="font-semibold text-text">{stock.symbol}</div>
              <div className="text-sm text-text-muted">{stock.description}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default SearchBar
