import { useState } from 'react'
import { Menu } from 'lucide-react'
import Header from './Header'
import Sidebar from './Sidebar'

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* Mobile Sidebar Toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden fixed bottom-4 right-4 z-40 bg-accent text-white p-3 rounded-full shadow-lg hover:bg-accent-hover transition-all duration-150 motion-reduce:transition-none"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <>
            <div 
              className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
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
      <footer className="bg-surface border-t border-border py-4 px-6">
        <div className="flex items-center justify-between text-sm text-text-muted">
          <span>Stock Trading Demo</span>
          <span className="hidden sm:inline">Market data is simulated for demonstration purposes</span>
        </div>
      </footer>
    </div>
  )
}

export default Layout
