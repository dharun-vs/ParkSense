import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import { getAllSessions } from '@/features/parking/sessionService'
import { fetchMyBookings } from '@/features/bookings/bookingService'
import { fetchRecentEvents, subscribeToEventChanges } from '@/features/analytics/analyticsService'
import type { ParkingSession, Booking, ParkingEvent } from '@/types/database'
import { formatDateTime, formatRelative, BOOKING_STATUS_BADGE, BOOKING_STATUS_LABELS } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import {
  History,
  Car,
  CalendarCheck,
  Clock,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Activity,
  Layers,
} from 'lucide-react'

export const ActivityPage: React.FC = () => {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<ParkingSession[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [events, setEvents] = useState<ParkingEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterType, setFilterType] = useState<'all' | 'sessions' | 'reservations'>('all')

  const loadActivity = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const [allSessions, myBookings, allEvents] = await Promise.all([
        getAllSessions().catch(() => []),
        fetchMyBookings().catch(() => []),
        fetchRecentEvents(50).catch(() => []),
      ])

      // Filter sessions for this user
      const userSessions = allSessions.filter((s) => s.user_id === user.id)
      setSessions(userSessions)
      setBookings(myBookings)

      // Filter events where actor is user or related to user's bookings/sessions
      const userEvents = allEvents.filter((ev) => ev.actor_id === user.id)
      setEvents(userEvents)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadActivity()
    const unsubscribe = subscribeToEventChanges(loadActivity)
    return () => unsubscribe()
  }, [loadActivity])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-charcoal-200">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#1263F1]" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#15243A] tracking-tight">
              My Activity
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#66758A] mt-1">
            Complete audit trail of your check-in sessions, departures, and space reservations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadActivity}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
          <Link to="/parking">
            <Button variant="primary" size="sm" className="bg-[#1263F1] hover:bg-[#0e52ca] text-white">
              View Parking
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-charcoal-200/80 w-fit text-xs font-semibold">
        {[
          { id: 'all', label: 'All History', count: sessions.length + bookings.length },
          { id: 'sessions', label: 'Parking Sessions', count: sessions.length },
          { id: 'reservations', label: 'Reservations', count: bookings.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id as 'all' | 'sessions' | 'reservations')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              filterType === tab.id
                ? 'bg-[#08264B] text-white shadow-xs'
                : 'text-[#66758A] hover:text-[#15243A] hover:bg-slate-100'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                filterType === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-charcoal-400 gap-2">
          <div className="w-8 h-8 border-2 border-[#1263F1] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Loading activity logs...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Parking Sessions Section */}
          {(filterType === 'all' || filterType === 'sessions') && (
            <div className="bg-white rounded-2xl border border-charcoal-200 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-[#1263F1]" />
                  <h2 className="text-sm font-bold text-[#15243A]">Check-in & Check-out Sessions</h2>
                </div>
                <span className="text-xs text-[#66758A]">{sessions.length} recorded</span>
              </div>

              {sessions.length === 0 ? (
                <p className="text-xs text-[#66758A] py-4 text-center italic">
                  No parking sessions found. Check in to a bay to start recording physical sessions.
                </p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {sessions.map((sess) => {
                    const isActive = !sess.checked_out_at
                    return (
                      <div key={sess.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                              isActive ? 'bg-blue-100 text-[#1263F1]' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <Car className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#15243A] text-sm">
                                Bay {sess.parking_slot?.label ?? sess.parking_slot_id}
                              </span>
                              {isActive ? (
                                <span className="text-[10px] bg-blue-100 text-[#1263F1] font-bold px-2 py-0.5 rounded-full">
                                  Currently Parked
                                </span>
                              ) : (
                                <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full">
                                  Completed Session
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#66758A] mt-0.5">
                              Floor {sess.parking_slot?.floor ?? '—'} · Zone {sess.parking_slot?.zone ?? '—'}
                              {sess.vehicle_plate && ` · Plate: ${sess.vehicle_plate}`}
                            </p>
                          </div>
                        </div>

                        <div className="text-xs text-right sm:border-l sm:border-slate-100 sm:pl-4 space-y-0.5">
                          <div className="text-[#15243A]">
                            <span className="text-[#66758A]">In: </span>
                            {formatDateTime(sess.checked_in_at)}
                          </div>
                          {sess.checked_out_at ? (
                            <div className="text-[#66758A]">
                              <span>Out: </span>
                              {formatDateTime(sess.checked_out_at)}
                            </div>
                          ) : (
                            <div className="text-blue-600 font-medium">
                              Session Ongoing
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Reservations History Section */}
          {(filterType === 'all' || filterType === 'reservations') && (
            <div className="bg-white rounded-2xl border border-charcoal-200 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-[#16A765]" />
                  <h2 className="text-sm font-bold text-[#15243A]">Advance Space Reservations</h2>
                </div>
                <span className="text-xs text-[#66758A]">{bookings.length} recorded</span>
              </div>

              {bookings.length === 0 ? (
                <p className="text-xs text-[#66758A] py-4 text-center italic">
                  No reservations recorded yet.
                </p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {bookings.map((b) => (
                    <div key={b.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#16A765] flex items-center justify-center shrink-0">
                          <CalendarCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#15243A] text-sm">
                              Bay {b.parking_slot?.label ?? b.parking_slot_id}
                            </span>
                            <span className={BOOKING_STATUS_BADGE[b.status]}>
                              {BOOKING_STATUS_LABELS[b.status]}
                            </span>
                          </div>
                          <p className="text-xs text-[#66758A] mt-0.5">
                            Created {formatRelative(b.created_at)}
                            {b.vehicle_plate && ` · Plate: ${b.vehicle_plate}`}
                          </p>
                        </div>
                      </div>

                      <div className="text-xs text-right sm:border-l sm:border-slate-100 sm:pl-4 space-y-0.5">
                        <div className="text-[#15243A]">
                          <span className="text-[#66758A]">Window: </span>
                          {formatDateTime(b.start_time)}
                        </div>
                        <div className="text-[#66758A]">
                          → {formatDateTime(b.end_time)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
