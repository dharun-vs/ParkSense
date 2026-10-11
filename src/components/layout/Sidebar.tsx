import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import { ParkSenseLogo } from '@/components/ui/ParkSenseLogo'
import {
  LayoutDashboard,
  Compass,
  CalendarCheck,
  History,
  User,
  ShieldCheck,
  SlidersHorizontal,
  BarChart3,
  Layers,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { isAdmin } = useAuth()

  const userNav = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Parking', path: '/parking', icon: Compass },
    { label: 'Reservations', path: '/bookings', icon: CalendarCheck },
    { label: 'My Activity', path: '/activity', icon: History },
    { label: 'Profile', path: '/profile', icon: User },
  ]

  const adminNav = [
    { label: 'Facility Overview', path: '/admin', icon: ShieldCheck },
    { label: 'Bay Simulator & Inventory', path: '/admin/parking', icon: SlidersHorizontal },
    { label: 'All Reservations', path: '/admin/bookings', icon: Layers },
    { label: 'Facility Analytics', path: '/admin/analytics', icon: BarChart3 },
  ]

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-charcoal-900/50 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r border-[#162B50] bg-[#0B1B3D] text-white transition-transform duration-200 ease-in-out lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand header */}
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
          <NavLink to="/dashboard" className="flex items-center group" onClick={onClose}>
            <ParkSenseLogo variant="full" theme="dark" size="sm" showTagline={true} />
          </NavLink>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 rounded-lg lg:hidden hover:bg-white/10"
            aria-label="Close Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
          <div>
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Customer Portal
            </div>
            <nav className="space-y-1">
              {userNav.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all',
                      isActive
                        ? 'bg-[#165DFB] text-white font-semibold shadow-sm'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    )
                  }
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          {isAdmin && (
            <div>
              <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center justify-between">
                <span>Admin Operations</span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[9px] px-1.5 py-0.2 rounded font-mono font-bold border border-emerald-400/30">
                  ADMIN
                </span>
              </div>
              <nav className="space-y-1">
                {adminNav.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all',
                        isActive
                          ? 'bg-[#165DFB] text-white font-semibold shadow-sm'
                          : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      )
                    }
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </nav>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="border-t border-white/10 p-4">
          <div className="rounded-xl bg-white/5 p-3 text-xs text-slate-300 border border-white/10">
            <p className="font-bold text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              Campus Facility
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">ParkSense Operational Engine v2.0</p>
          </div>
        </div>
      </aside>
    </>
  )
}
