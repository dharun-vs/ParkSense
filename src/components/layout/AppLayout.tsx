import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'
import { isSupabaseConfigured } from '@/lib/supabase'
import { AlertCircle, ExternalLink } from 'lucide-react'

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-charcoal-50/60 font-sans text-charcoal-900">
      {/* Desktop & Mobile Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main column */}
      <div className="flex flex-1 flex-col min-w-0">
        <Navbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

        {/* Global configuration notice if Supabase keys not set */}
        {!isSupabaseConfigured && (
          <div className="bg-amber-50 border-b border-amber-200/80 px-4 py-2.5 sm:px-6 text-amber-900 text-xs sm:text-sm flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Database Setup Notice:</strong> Supabase credentials are not detected in <code className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-950 font-mono text-xs">.env</code>. See setup instructions in README.md.
              </span>
            </div>
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-amber-800 hover:text-amber-950 underline text-xs"
            >
              Open Supabase Console <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Dynamic page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
