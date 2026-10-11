import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAllSlots, subscribeToParkingChanges } from '@/features/parking/parkingService'
import { fetchAllBookings } from '@/features/bookings/bookingService'
import { fetchRecentEvents } from '@/features/analytics/analyticsService'
import type { ParkingSlot, Booking, ParkingEvent } from '@/types/database'
import { FACILITY_FLOORS } from '@/types/database'
import { calcOccupancyStats, formatDateTime, BOOKING_STATUS_BADGE, BOOKING_STATUS_LABELS } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  ShieldCheck,
  SlidersHorizontal,
  Layers,
  BarChart3,
  Car,
  CheckCircle2,
  Clock,
  Activity,
  ArrowRight,
  Sparkles,
} from 'lucide-react'

export const AdminDashboardPage: React.FC = () => {
  const [slots, setSlots] = useState<ParkingSlot[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [events, setEvents] = useState<ParkingEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true)
        const [s, b, e] = await Promise.all([
          fetchAllSlots().catch(() => []),
          fetchAllBookings().catch(() => []),
          fetchRecentEvents(10).catch(() => []),
        ])
        setSlots(s)
        setBookings(b)
        setEvents(e)
      } finally {
        setIsLoading(false)
      }
    }
    load()
    const unsubscribe = subscribeToParkingChanges(load)
    return () => unsubscribe()
  }, [])

  const stats = calcOccupancyStats(slots)

  return (
    <div className="space-y-8">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-charcoal-200/80">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 tracking-tight">
              Administrator Control Center
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-charcoal-500 mt-1">
            Facility overview, occupancy simulators, and real-time operations monitoring.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/admin/parking">
            <Button variant="primary" size="sm" leftIcon={<SlidersHorizontal className="w-3.5 h-3.5" />}>
              Open Simulator & Slots
            </Button>
          </Link>
          <Link to="/admin/analytics">
            <Button variant="outline" size="sm" leftIcon={<BarChart3 className="w-3.5 h-3.5" />}>
              Analytics
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-charcoal-200/80 shadow-xs">
          <span className="text-xs font-semibold text-charcoal-400 uppercase tracking-wider block">Total Slots</span>
          <span className="text-2xl font-black text-charcoal-900 mt-2 block">{stats.total}</span>
          <span className="text-[11px] text-charcoal-400">All managed bays</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs">
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block">Available</span>
          <span className="text-2xl font-black text-emerald-700 mt-2 block">{stats.available}</span>
          <span className="text-[11px] text-emerald-600">Vacant for drivers</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-red-200 shadow-xs">
          <span className="text-xs font-semibold text-red-700 uppercase tracking-wider block">Occupied</span>
          <span className="text-2xl font-black text-red-700 mt-2 block">{stats.occupied}</span>
          <span className="text-[11px] text-red-600">Vehicles present</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-xs">
          <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider block">Reserved</span>
          <span className="text-2xl font-black text-blue-700 mt-2 block">{stats.reserved}</span>
          <span className="text-[11px] text-blue-600">Confirmed bookings</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-charcoal-200/80 shadow-xs col-span-2 md:col-span-4 lg:col-span-1">
          <span className="text-xs font-semibold text-charcoal-400 uppercase tracking-wider block">System Bookings</span>
          <span className="text-2xl font-black text-charcoal-900 mt-2 block">{bookings.length}</span>
          <span className="text-[11px] text-charcoal-400">Lifetime total</span>
        </div>
      </div>

      {/* Simulator Shortcut Banner matching clean brand design */}
      <div className="rounded-2xl bg-[#0B1B3D] text-white p-6 shadow-2xs border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="bg-[#10B981]/20 text-[#10B981] text-xs px-2.5 py-0.5 rounded-full font-bold border border-[#10B981]/30">
              Interactive Hardware Simulator
            </span>
          </div>
          <h3 className="text-lg font-bold text-white">Simulate Vehicle Arrival & Departure</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Trigger real-time telemetry to simulate vehicle arrivals or departures. Changes synchronize instantly across customer dashboards and active reservations.
          </p>
        </div>
        <Link to="/admin/parking" className="shrink-0">
          <Button variant="primary" size="md" className="bg-[#165DFB] hover:bg-[#1249c7] text-white font-bold">
            Launch Simulator
          </Button>
        </Link>
      </div>

      {/* Campus Parking Floor Status */}
      <div className="bg-white rounded-2xl border border-charcoal-200/80 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-charcoal-900">Campus Parking — Floor Status</h2>
            <p className="text-xs text-charcoal-500">Live operational breakdown by level</p>
          </div>
          <Link to="/admin/parking">
            <Button variant="ghost" size="sm" className="text-xs text-emerald-700">
              Manage Bays <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {FACILITY_FLOORS.map((floor) => {
            const fSlots = slots.filter((s) => s.floor === floor.id && s.is_active)
            const fAvail = fSlots.filter((s) => s.occupancy_status === 'available').length
            const fOccupied = fSlots.filter((s) => s.occupancy_status === 'occupied').length
            const fReserved = fSlots.filter((s) => s.occupancy_status === 'reserved').length
            const total = fSlots.length
            const occPct = total > 0 ? Math.round(((fOccupied + fReserved) / total) * 100) : 0

            return (
              <div key={floor.id} className="p-4 rounded-xl border border-charcoal-100 bg-charcoal-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-charcoal-900">{floor.label}</span>
                  <span className="text-[11px] font-mono text-charcoal-500 font-semibold">{floor.bayRange}</span>
                </div>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-emerald-700 font-bold">{fAvail} Available</span>
                  <span className="text-charcoal-500">{fOccupied} Occupied</span>
                </div>
                <div className="h-2 rounded-full bg-charcoal-200 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${100 - occPct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent Bookings & Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent System Bookings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <CardTitle>Recent Facility Bookings</CardTitle>
            </div>
            <Link to="/admin/bookings" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 underline">
              View All
            </Link>
          </CardHeader>
          <CardContent>
            {bookings.length === 0 ? (
              <p className="py-6 text-center text-xs text-charcoal-400">No bookings recorded yet.</p>
            ) : (
              <div className="divide-y divide-charcoal-100">
                {bookings.slice(0, 5).map((b) => (
                  <div key={b.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-bold text-charcoal-900">
                        Slot {b.parking_slot?.label || '—'}
                      </span>
                      <span className="text-charcoal-500 block">
                        {b.profile?.display_name || 'Driver'} • {formatDateTime(b.start_time)}
                      </span>
                    </div>
                    <span className={BOOKING_STATUS_BADGE[b.status]}>
                      {BOOKING_STATUS_LABELS[b.status]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Audit Log / Event Feed */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <CardTitle>System Activity & Audit Log</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="py-6 text-center text-xs text-charcoal-400">No events recorded yet.</p>
            ) : (
              <div className="space-y-3 text-xs">
                {events.slice(0, 6).map((ev) => (
                  <div key={ev.id} className="flex items-start gap-2.5 pb-2.5 border-b border-charcoal-100 last:border-b-0">
                    <div className="w-2 h-2 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold text-charcoal-800 capitalize">
                        {ev.event_type.replace(/_/g, ' ')}
                      </p>
                      <p className="text-[11px] text-charcoal-500">
                        {ev.actor?.display_name ? `By ${ev.actor.display_name}` : 'Automated system'}
                        {ev.parking_slot?.label && ` on Slot ${ev.parking_slot.label}`}
                      </p>
                    </div>
                    <span className="text-[10px] text-charcoal-400 shrink-0">
                      {formatDateTime(ev.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
