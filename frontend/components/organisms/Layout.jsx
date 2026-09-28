import { useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-900 dark:bg-gray-900 light:bg-gray-50 flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* Mobile Sidebar Toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden fixed bottom-4 right-4 z-40 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <>
            <div 
              className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="lg:hidden fixed right-0 top-0 h-full z-50">
              <Sidebar />
            </div>
          </>
        )}

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
      
      {/* Footer */}
      <footer className="bg-gray-800 dark:bg-gray-800 light:bg-white border-t border-gray-700 dark:border-gray-700 light:border-gray-200 py-4 px-6">
        <div className="flex items-center justify-between text-sm text-gray-400 dark:text-gray-400 light:text-gray-600">
          <span>Stock Trading Demo</span>
          <span>Market data is simulated for demonstration purposes</span>
        </div>
      </footer>
    </div>
  )
}

export default Layout
