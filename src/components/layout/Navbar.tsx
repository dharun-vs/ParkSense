import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import { Bell, LogOut, User as UserIcon, Shield, Menu } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { isSupabaseConfigured } from '@/lib/supabase'

import { ParkSenseLogo } from '@/components/ui/ParkSenseLogo'

interface NavbarProps {
  onToggleSidebar?: () => void
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const navigate = useNavigate()
  const { profile, user, signOut, isAdmin } = useAuth()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-charcoal-200/80 bg-white/95 px-4 sm:px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 text-charcoal-600 rounded-lg lg:hidden hover:bg-charcoal-100 focus:outline-none focus:ring-2 focus:ring-[#1263F1]"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile Logo */}
        <Link to="/dashboard" className="flex items-center gap-2 lg:hidden">
          <ParkSenseLogo variant="compact" size="sm" />
          <span className="text-base font-extrabold tracking-tight text-[#08264B]">
            ParkSense
          </span>
        </Link>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3 sm:gap-4">
        {!isSupabaseConfigured && (
          <div className="hidden sm:flex items-center">
            <Badge variant="amber" size="sm">
              Demo / Unconfigured DB
            </Badge>
          </div>
        )}

        {isAdmin && (
          <Badge variant="emerald" size="sm" icon={<Shield className="w-3 h-3" />}>
            Admin Mode
          </Badge>
        )}

        <div className="h-4 w-px bg-charcoal-200 hidden sm:block" />

        {user ? (
          <div className="flex items-center gap-3">
            <Link
              to="/profile"
              className="flex items-center gap-2 text-sm font-medium text-charcoal-700 hover:text-emerald-600 transition-colors p-1 rounded-lg"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-semibold text-xs border border-emerald-200">
                {profile?.display_name ? profile.display_name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="hidden md:inline-block font-medium">
                {profile?.display_name || user.email?.split('@')[0]}
              </span>
            </Link>

            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await signOut()
                navigate('/login', { replace: true })
              }}
              title="Sign Out"
              aria-label="Sign Out"
              className="text-charcoal-500 hover:text-red-600"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="primary" size="sm">
                Get Started
              </Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}
