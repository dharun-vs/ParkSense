import React, { useEffect, useState, useCallback } from 'react'
import { fetchAllBookings, cancelBooking, completeBooking } from '@/features/bookings/bookingService'
import type { Booking, BookingStatus } from '@/types/database'
import {
  formatDateTime,
  BOOKING_STATUS_BADGE,
  BOOKING_STATUS_LABELS,
} from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ConfirmDialog } from '@/components/ui/Modal'
import { Layers, RefreshCw, Check, XCircle, Search, Filter } from 'lucide-react'

export const AdminBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Cancel dialog
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [actionType, setActionType] = useState<'cancel' | 'complete' | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const loadBookings = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await fetchAllBookings()
      setBookings(data)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadBookings()
  }, [loadBookings])

  const handleConfirmAction = async () => {
    if (!selectedBooking || !actionType) return
    try {
      setIsProcessing(true)
      if (actionType === 'cancel') {
        await cancelBooking(selectedBooking.id)
      } else if (actionType === 'complete') {
        await completeBooking(selectedBooking.id)
      }
      setSelectedBooking(null)
      setActionType(null)
      loadBookings()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const filteredBookings = bookings.filter((b) => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const slotLabel = b.parking_slot?.label?.toLowerCase() || ''
      const user = b.profile?.display_name?.toLowerCase() || ''
      const plate = b.vehicle_plate?.toLowerCase() || ''
      if (!slotLabel.includes(q) && !user.includes(q) && !plate.includes(q)) {
        return false
      }
    }
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-charcoal-200/80">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 tracking-tight">
              Facility Reservation Management
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-charcoal-500 mt-1">
            Supervise user reservations, inspect vehicle records, and resolve booking conflicts.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadBookings}
          isLoading={isLoading}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Refresh Bookings
        </Button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-charcoal-200/80 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-80">
          <Input
            placeholder="Search driver, slot, or license plate..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="flex items-center gap-1.5 bg-charcoal-100/70 p-1 rounded-xl text-xs font-semibold">
          {[
            { id: 'all', label: 'All Status' },
            { id: 'confirmed', label: 'Confirmed' },
            { id: 'completed', label: 'Completed' },
            { id: 'cancelled', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                statusFilter === tab.id
                  ? 'bg-white text-charcoal-900 shadow-xs font-bold'
                  : 'text-charcoal-600 hover:text-charcoal-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-2xl border border-charcoal-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-charcoal-50 border-b border-charcoal-200 text-charcoal-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3">Slot</th>
                <th className="px-5 py-3">Driver Name</th>
                <th className="px-5 py-3">Start Time</th>
                <th className="px-5 py-3">End Time</th>
                <th className="px-5 py-3">Vehicle Plate</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Admin Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-100 text-charcoal-700">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-charcoal-400">
                    No matching bookings found.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-charcoal-50/60 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-charcoal-900">
                      Space {b.parking_slot?.label || '—'}
                    </td>
                    <td className="px-5 py-3.5 font-medium">
                      {b.profile?.display_name || 'Driver'}
                    </td>
                    <td className="px-5 py-3.5 text-charcoal-600">
                      {formatDateTime(b.start_time)}
                    </td>
                    <td className="px-5 py-3.5 text-charcoal-600">
                      {formatDateTime(b.end_time)}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[11px]">
                      {b.vehicle_plate || '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={BOOKING_STATUS_BADGE[b.status]}>
                        {BOOKING_STATUS_LABELS[b.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {b.status === 'confirmed' && (
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedBooking(b)
                              setActionType('complete')
                            }}
                            className="text-emerald-700 border-emerald-200 hover:bg-emerald-50 text-[11px] py-1"
                            leftIcon={<Check className="w-3.5 h-3.5 text-emerald-600" />}
                          >
                            Mark Completed
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedBooking(b)
                              setActionType('cancel')
                            }}
                            className="text-red-700 border-red-200 hover:bg-red-50 text-[11px] py-1"
                            leftIcon={<XCircle className="w-3.5 h-3.5 text-red-600" />}
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(selectedBooking && actionType)}
        onClose={() => {
          setSelectedBooking(null)
          setActionType(null)
        }}
        onConfirm={handleConfirmAction}
        title={actionType === 'cancel' ? 'Cancel Reservation' : 'Complete Reservation'}
        message={
          actionType === 'cancel'
            ? `Are you sure you want to cancel reservation for Space ${selectedBooking?.parking_slot?.label}? The user will be notified and slot vacated.`
            : `Mark reservation for Space ${selectedBooking?.parking_slot?.label} as completed?`
        }
        confirmLabel={actionType === 'cancel' ? 'Cancel Reservation' : 'Complete Reservation'}
        isDanger={actionType === 'cancel'}
        isLoading={isProcessing}
      />
    </div>
  )
}
