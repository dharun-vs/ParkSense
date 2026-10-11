import React, { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchMyBookings, cancelBooking } from '@/features/bookings/bookingService'
import { checkIn } from '@/features/parking/sessionService'
import { useAuth } from '@/features/auth/AuthContext'
import { supabase } from '@/lib/supabase'
import type { Booking } from '@/types/database'
import { getReservationLifecycle } from '@/types/database'
import {
  formatDateTime,
  isBookingCancellable,
  RESERVATION_LIFECYCLE_BADGE,
  RESERVATION_LIFECYCLE_LABELS,
} from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/Modal'
import {
  CalendarCheck,
  Clock,
  Car,
  AlertCircle,
  RefreshCw,
  XCircle,
  CheckCircle2,
  LogIn,
  Layers,
} from 'lucide-react'

export const BookingsPage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterLifecycle, setFilterLifecycle] = useState<string>('all')

  // Cancel dialog state
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)

  // Direct check-in state
  const [isCheckingIn, setIsCheckingIn] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  const loadBookings = useCallback(async () => {
    if (!user) return
    try {
      setIsLoading(true)
      setError(null)
      const data = await fetchMyBookings()
      setBookings(data)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve reservations.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadBookings()

    const channel = supabase
      .channel('my_bookings_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          loadBookings()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadBookings])

  const handleOpenCancel = (booking: Booking) => {
    setBookingToCancel(booking)
    setCancelModalOpen(true)
  }

  const handleConfirmCancel = async () => {
    if (!bookingToCancel) return
    try {
      setIsCancelling(true)
      await cancelBooking(bookingToCancel.id)
      setActionSuccess(`Reservation for Bay ${bookingToCancel.parking_slot?.label} cancelled.`)
      setCancelModalOpen(false)
      setBookingToCancel(null)
      await loadBookings()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Could not cancel reservation.')
    } finally {
      setIsCancelling(false)
    }
  }

  const handleCheckInNow = async (booking: Booking) => {
    try {
      setIsCheckingIn(booking.id)
      await checkIn({
        parking_slot_id: booking.parking_slot_id,
        vehicle_plate: booking.vehicle_plate || undefined,
      })
      navigate('/dashboard')
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Check-in failed.')
    } finally {
      setIsCheckingIn(null)
    }
  }

  const filteredBookings = bookings.filter((b) => {
    const lifecycle = getReservationLifecycle(b)
    if (filterLifecycle === 'all') return true
    if (filterLifecycle === 'upcoming_active') return lifecycle === 'upcoming' || lifecycle === 'active_now'
    if (filterLifecycle === 'completed') return lifecycle === 'completed'
    if (filterLifecycle === 'cancelled_expired') return lifecycle === 'cancelled' || lifecycle === 'expired'
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-charcoal-200">
        <div>
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-[#1263F1]" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#15243A] tracking-tight">
              Reservations
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#66758A] mt-1">
            Manage advance parking bay reservations across Campus Parking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadBookings}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
          <Link to="/parking">
            <Button variant="primary" size="sm" className="bg-[#1263F1] hover:bg-[#0e52ca] text-white">
              Reserve a Bay
            </Button>
          </Link>
        </div>
      </div>

      {actionSuccess && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#16A765] shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-slate-500 hover:text-slate-800 font-bold text-xs">
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-xs text-red-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={loadBookings} className="font-semibold underline">
            Retry
          </button>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-charcoal-200/80 w-fit text-xs font-semibold">
        {[
          { id: 'all', label: 'All', count: bookings.length },
          {
            id: 'upcoming_active',
            label: 'Upcoming & Due',
            count: bookings.filter((b) => {
              const l = getReservationLifecycle(b)
              return l === 'upcoming' || l === 'active_now'
            }).length,
          },
          {
            id: 'completed',
            label: 'Completed',
            count: bookings.filter((b) => getReservationLifecycle(b) === 'completed').length,
          },
          {
            id: 'cancelled_expired',
            label: 'Past & Cancelled',
            count: bookings.filter((b) => {
              const l = getReservationLifecycle(b)
              return l === 'cancelled' || l === 'expired'
            }).length,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterLifecycle(tab.id)}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              filterLifecycle === tab.id
                ? 'bg-[#08264B] text-white shadow-xs'
                : 'text-[#66758A] hover:text-[#15243A] hover:bg-slate-100'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                filterLifecycle === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-charcoal-400 gap-2">
          <div className="w-8 h-8 border-2 border-[#1263F1] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Loading your reservations...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-charcoal-200/80 p-12 text-center space-y-3">
          <Clock className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-[#15243A]">No Reservations Found</h3>
          <p className="text-xs text-[#66758A] max-w-sm mx-auto">
            {filterLifecycle === 'all'
              ? 'You have not reserved any parking bays yet. Choose a floor and select an available bay to book in advance.'
              : `You have no reservations under this filter tab.`}
          </p>
          <Link to="/parking" className="inline-block mt-2">
            <Button variant="primary" size="sm" className="bg-[#1263F1] hover:bg-[#0e52ca] text-white">
              Reserve a Bay
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBookings.map((b) => {
            const lifecycle = getReservationLifecycle(b)
            const canCancel = isBookingCancellable(b) && (lifecycle === 'upcoming' || lifecycle === 'active_now')
            const isDueNow = lifecycle === 'active_now' && b.status === 'confirmed'

            return (
              <div
                key={b.id}
                className="bg-white rounded-2xl border border-charcoal-200/80 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xl text-[#15243A]">
                      Bay {b.parking_slot?.label || '—'}
                    </span>
                    <span className={RESERVATION_LIFECYCLE_BADGE[lifecycle]}>
                      {RESERVATION_LIFECYCLE_LABELS[lifecycle]}
                    </span>
                  </div>

                  <p className="text-xs text-[#66758A] mt-0.5">
                    Floor {b.parking_slot?.floor || '—'} · Zone {b.parking_slot?.zone || 'A'} · {b.parking_slot?.slot_type?.toUpperCase() || 'STANDARD'}
                  </p>

                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-charcoal-700">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{formatDateTime(b.start_time)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-charcoal-500">
                      <span className="w-3.5 text-center text-slate-400">→</span>
                      <span>{formatDateTime(b.end_time)}</span>
                    </div>

                    {b.vehicle_plate && (
                      <div className="flex items-center gap-2 text-charcoal-700 pt-1">
                        <Car className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono font-medium">{b.vehicle_plate}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-charcoal-100 flex items-center justify-between gap-2">
                  <Link to={`/bookings/${b.id}`} className="text-xs font-semibold text-[#1263F1] hover:underline">
                    View Details
                  </Link>

                  <div className="flex items-center gap-2">
                    {isDueNow && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleCheckInNow(b)}
                        isLoading={isCheckingIn === b.id}
                        className="bg-[#16A765] hover:bg-[#138e56] text-white text-xs px-2.5 py-1"
                        leftIcon={<LogIn className="w-3.5 h-3.5" />}
                      >
                        Check In Now
                      </Button>
                    )}

                    {canCancel && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenCancel(b)}
                        className="text-red-600 border-red-200 hover:bg-red-50 text-xs px-2.5 py-1"
                        leftIcon={<XCircle className="w-3.5 h-3.5" />}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleConfirmCancel}
        title="Cancel Parking Reservation"
        message={`Are you sure you want to cancel your reservation for Space ${bookingToCancel?.parking_slot?.label}? The bay will immediately become available for other campus drivers.`}
        confirmLabel="Yes, Cancel Reservation"
        isDanger={true}
        isLoading={isCancelling}
      />
    </div>
  )
}
