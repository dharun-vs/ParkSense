import React, { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import { fetchAllSlots, subscribeToParkingChanges } from '@/features/parking/parkingService'
import { getActiveSession, checkOut } from '@/features/parking/sessionService'
import { fetchMyBookings } from '@/features/bookings/bookingService'
import type { ParkingSlot, ParkingSession, Booking } from '@/types/database'
import { FACILITY_FLOORS } from '@/types/database'
import { calcOccupancyStats, formatRelative, formatDateTime } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import {
  CheckCircle2,
  Car,
  Layers,
  MapPin,
  LogOut,
  Compass,
  Shield,
  ArrowRight,
  AlertCircle,
  CalendarCheck,
  Clock,
  Wrench,
} from 'lucide-react'

export const DashboardPage: React.FC = () => {
  const { user, profile, isAdmin } = useAuth()
  const navigate = useNavigate()

  const [slots, setSlots] = useState<ParkingSlot[]>([])
  const [activeSession, setActiveSession] = useState<ParkingSession | null>(null)
  const [upcomingBooking, setUpcomingBooking] = useState<Booking | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [checkoutMsg, setCheckoutMsg] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!user) return
    try {
      setError(null)
      const [slotsData, sessionData, myBookings] = await Promise.all([
        fetchAllSlots().catch(() => []),
        getActiveSession(user.id).catch(() => null),
        fetchMyBookings().catch(() => []),
      ])
      setSlots(slotsData)
      setActiveSession(sessionData)

      // Find earliest upcoming confirmed reservation that hasn't expired
      const now = Date.now()
      const upcoming = myBookings
        .filter((b) => b.status === 'confirmed' && new Date(b.end_time).getTime() > now)
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())[0] || null

      setUpcomingBooking(upcoming)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load dashboard data.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadData()
    const unsubscribe = subscribeToParkingChanges(loadData)
    return () => unsubscribe()
  }, [loadData])

  const handleCheckOut = async () => {
    if (!activeSession) return
    setIsCheckingOut(true)
    setCheckoutMsg(null)
    try {
      await checkOut(activeSession.id)
      setCheckoutMsg(`Checked out from Bay ${activeSession.parking_slot?.label ?? ''}. Thank you!`)
      setActiveSession(null)
      await loadData()
    } catch (err) {
      setCheckoutMsg(err instanceof Error ? err.message : 'Check-out failed.')
    } finally {
      setIsCheckingOut(false)
    }
  }

  const stats = calcOccupancyStats(slots)
  const sessionSlot = activeSession?.parking_slot
  const sessionFloor = FACILITY_FLOORS.find((f) => f.id === sessionSlot?.floor)
  const occupancyPct = stats.total > 0 ? Math.round(((stats.total - stats.available) / stats.total) * 100) : 0
  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Alex'

  return (
    <div className="space-y-6">
      {/* Header matching reference: "Good morning, Alex / Here's what's happening with your parking" */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-[#165DFB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-full inline-flex items-center border border-[#BFDBFE]">
              Dashboard
            </h2>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1B3D] tracking-tight">
            Good morning, {displayName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Here's what's happening with your parking · Welcome back, <strong className="text-[#0B1B3D]">Demo Driver</strong>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/parking">
            <Button variant="primary" size="sm" className="bg-[#165DFB] hover:bg-[#1249c7] text-white" leftIcon={<Compass className="w-4 h-4" />}>
              View Parking
            </Button>
          </Link>
          {isAdmin && (
            <Link to="/admin">
              <Button variant="outline" size="sm" leftIcon={<Shield className="w-4 h-4 text-[#0B1B3D]" />}>
                Admin
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Error Feedback */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{error}</span>
          <button onClick={loadData} className="ml-auto font-semibold underline">Retry</button>
        </div>
      )}

      {/* Checkout feedback */}
      {checkoutMsg && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
          <span>{checkoutMsg}</span>
        </div>
      )}

      {/* 5 KPI Metric Cards Matching Reference Design */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Bays */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#F0F4FC] text-[#165DFB] flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Total Bays
            </span>
            <span className="text-2xl font-black font-mono text-[#0B1B3D] mt-0.5 block">
              {stats.total || 28}
            </span>
          </div>
        </div>

        {/* Available */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Available
            </span>
            <span className="text-2xl font-black font-mono text-[#16A34A] mt-0.5 block">
              {stats.available}
            </span>
          </div>
        </div>

        {/* Occupied */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center shrink-0">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Occupied
            </span>
            <span className="text-2xl font-black font-mono text-[#DC2626] mt-0.5 block">
              {stats.occupied}
            </span>
          </div>
        </div>

        {/* Out of Service */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#FEFCE8] text-[#EAB308] flex items-center justify-center shrink-0">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Out of Service
            </span>
            <span className="text-2xl font-black font-mono text-[#CA8A04] mt-0.5 block">
              {stats.maintenance}
            </span>
          </div>
        </div>

        {/* Donut Gauge: Occupancy */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Occupancy
            </span>
            <span className="text-2xl font-black font-mono text-[#0B1B3D] mt-0.5 block">
              {occupancyPct}%
            </span>
          </div>
          {/* Circular SVG Donut */}
          <div className="relative w-12 h-12 flex items-center justify-center">
            <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-100"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-[#10B981]"
                strokeDasharray={`${occupancyPct}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-[10px] font-bold text-[#0B1B3D]">{occupancyPct}%</span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Section Matching Reference Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left Column: Your Active Session */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between space-y-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-[#0B1B3D]">Your Active Session</h2>
            {activeSession ? (
              <span className="bg-[#ECFDF5] text-[#10B981] border border-[#A7F3D0] text-xs font-bold px-3 py-0.5 rounded-full">
                Checked In
              </span>
            ) : (
              <span className="bg-slate-100 text-slate-500 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                No Active Session
              </span>
            )}
          </div>

          {activeSession ? (
            <div className="space-y-5">
              <div className="flex items-center gap-4 bg-[#F8FAFC] p-4 rounded-xl border border-slate-200">
                <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] text-[#165DFB] flex items-center justify-center shrink-0">
                  <Car className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black font-mono text-[#0B1B3D]">
                    Bay {sessionSlot?.label ?? activeSession.parking_slot_id}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {sessionFloor?.label ?? 'Ground Floor'} · Zone {sessionSlot?.zone ?? 'A'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-medium block">Check-in Time</span>
                  <span className="font-bold text-[#0B1B3D] text-sm mt-0.5 block">
                    {new Date(activeSession.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Duration</span>
                  <span className="font-bold text-[#0B1B3D] text-sm mt-0.5 block">
                    {formatRelative(activeSession.checked_in_at)}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  size="md"
                  className="flex-1 border-slate-300 text-[#0B1B3D] hover:bg-slate-50"
                  leftIcon={<MapPin className="w-4 h-4 text-[#165DFB]" />}
                  onClick={() =>
                    navigate('/parking', {
                      state: {
                        findMyCar: true,
                        floorId: sessionSlot?.floor,
                        slotId: activeSession.parking_slot_id,
                      },
                    })
                  }
                >
                  Find My Car
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  className="flex-1 bg-[#165DFB] hover:bg-[#1249c7] text-white"
                  leftIcon={<LogOut className="w-4 h-4" />}
                  isLoading={isCheckingOut}
                  onClick={handleCheckOut}
                >
                  Check Out
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#165DFB] flex items-center justify-center">
                <Car className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-[#0B1B3D] text-sm">No active parking session</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  {stats.available} bays are currently available. Choose a floor to view real-time slots and check in upon arrival.
                </p>
              </div>
              <Link to="/parking" className="pt-2">
                <Button variant="primary" size="sm" className="bg-[#165DFB] hover:bg-[#1249c7] text-white">
                  Find & Check In to Bay
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Right Column: Floor Overview matching reference */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-[#0B1B3D]">Floor Overview</h2>
              <span className="text-[11px] text-slate-400">Campus Parking — Floor Availability</span>
            </div>
            <Link to="/parking" className="text-xs font-semibold text-[#165DFB] hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {FACILITY_FLOORS.map((floor) => {
              const fSlots = slots.filter((s) => s.floor === floor.id)
              const fActive = fSlots.filter((s) => s.is_active)
              const fAvail = fActive.filter((s) => s.occupancy_status === 'available').length
              const fOccupied = fActive.filter((s) => s.occupancy_status === 'occupied').length
              const occPct = fSlots.length > 0 ? Math.round((fOccupied / fSlots.length) * 100) : 0

              return (
                <div key={floor.id} className="p-3.5 rounded-xl bg-[#F8FAFC] border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#0B1B3D]">{floor.label} ({floor.zone})</span>
                    <span className="font-bold text-slate-600 font-mono text-[11px]">{occPct}%</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{fSlots.length} bays · <strong className="text-[#16A34A]">{fAvail} available</strong></span>
                  </div>

                  {/* Horizontal progress bar */}
                  <div className="h-2 rounded-full bg-slate-200 overflow-hidden flex">
                    <div
                      className="h-full bg-[#16A34A] transition-all"
                      style={{ width: `${(fAvail / fSlots.length) * 100}%` }}
                      title={`${fAvail} Available`}
                    />
                    <div
                      className="h-full bg-[#DC2626] transition-all"
                      style={{ width: `${occPct}%` }}
                      title={`${fOccupied} Occupied`}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
