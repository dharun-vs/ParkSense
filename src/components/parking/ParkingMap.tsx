import React, { useState, useMemo } from 'react'
import type { ParkingSlot, OccupancyStatus } from '@/types/database'
import { TopDownLotVisualizer } from './TopDownLotVisualizer'
import { ParkingSlotCard } from './ParkingSlotCard'
import { BayInspectorDrawer } from './BayInspectorDrawer'
import { BookingModal } from './BookingModal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import {
  Search,
  Layers,
  CheckCircle2,
  Car,
  Clock,
  LayoutGrid,
  Map,
  Filter,
  Sparkles,
} from 'lucide-react'
import { calcOccupancyStats } from '@/lib/utils'

interface ParkingMapProps {
  slots: ParkingSlot[]
  isLoading?: boolean
  isAdmin?: boolean
  onUpdateStatus?: (slotId: string, status: OccupancyStatus) => Promise<void>
  onRefresh?: () => void
}

export const ParkingMap: React.FC<ParkingMapProps> = ({
  slots,
  isLoading,
  isAdmin = false,
  onUpdateStatus,
  onRefresh,
}) => {
  const [viewMode, setViewMode] = useState<'blueprint' | 'grid'>('blueprint')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedZone, setSelectedZone] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const [activeSlot, setActiveSlot] = useState<ParkingSlot | null>(slots[0] || null)
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  // Compute stats
  const stats = useMemo(() => calcOccupancyStats(slots), [slots])

  // Filter slots for list view
  const filteredSlots = useMemo(() => {
    return slots.filter((slot) => {
      if (searchQuery.trim() && !slot.label.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      if (selectedZone !== 'all' && slot.zone !== selectedZone) {
        return false
      }
      if (statusFilter !== 'all') {
        const effectiveStatus = !slot.is_active ? 'maintenance' : slot.occupancy_status
        if (effectiveStatus !== statusFilter) return false
      }
      return true
    })
  }, [slots, searchQuery, selectedZone, statusFilter])

  const handleSelectSlot = (slot: ParkingSlot) => {
    setActiveSlot(slot)
  }

  const handleStartBooking = (slot: ParkingSlot) => {
    setActiveSlot(slot)
    setIsBookingOpen(true)
  }

  const handleAdminUpdateStatus = async (slotId: string, status: OccupancyStatus) => {
    if (!onUpdateStatus) return
    try {
      setIsUpdatingStatus(true)
      await onUpdateStatus(slotId, status)
      if (activeSlot && activeSlot.id === slotId) {
        setActiveSlot((prev) => (prev ? { ...prev, occupancy_status: status } : null))
      }
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Restrained, Professional Facility Status Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-charcoal-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-charcoal-400 uppercase tracking-wider block">
              Total Managed
            </span>
            <span className="text-xl font-black text-charcoal-900 font-mono">{stats.total} Bays</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-charcoal-100 flex items-center justify-center text-charcoal-600">
            <Layers className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
              Available
            </span>
            <span className="text-xl font-black text-emerald-700 font-mono">{stats.available} Bays</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-red-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider block">
              Occupied
            </span>
            <span className="text-xl font-black text-red-700 font-mono">{stats.occupied} Bays</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-700">
            <Car className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-blue-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
              Reserved
            </span>
            <span className="text-xl font-black text-blue-700 font-mono">{stats.reserved} Bays</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-charcoal-200/90 shadow-xs flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <span className="text-[10px] font-bold text-charcoal-500 uppercase tracking-wider block">
              Occupancy Rate
            </span>
            <span className="text-xl font-black text-charcoal-900 font-mono">{stats.occupancyPercent}%</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center justify-center">
            LIVE
          </div>
        </div>
      </div>

      {/* Control bar: View Switcher, Search & Filters */}
      <div className="bg-white p-3.5 rounded-xl border border-charcoal-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-charcoal-100 p-1 rounded-lg text-xs font-semibold w-full md:w-auto">
          <button
            type="button"
            onClick={() => setViewMode('blueprint')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              viewMode === 'blueprint'
                ? 'bg-white text-charcoal-900 shadow-xs font-bold'
                : 'text-charcoal-600 hover:text-charcoal-900'
            }`}
          >
            <Map className="w-3.5 h-3.5 text-emerald-600" />
            <span>Top-Down Lot Blueprint</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-white text-charcoal-900 shadow-xs font-bold'
                : 'text-charcoal-600 hover:text-charcoal-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-charcoal-500" />
            <span>Stall Card Grid</span>
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="w-full sm:w-56">
            <Input
              placeholder="Search bay number (A01)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-3.5 h-3.5" />}
            />
          </div>

          {/* Status filters */}
          <div className="flex items-center gap-1 bg-charcoal-100/80 p-1 rounded-lg text-xs">
            {['all', 'available', 'occupied', 'reserved'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2 py-1 rounded capitalize font-medium transition-colors cursor-pointer ${
                  statusFilter === st ? 'bg-white shadow-xs text-charcoal-900 font-bold' : 'text-charcoal-600'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main View Area */}
      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center text-charcoal-400 gap-2">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Loading parking facility blueprint...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main Visualization Canvas (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            {viewMode === 'blueprint' ? (
              <TopDownLotVisualizer
                slots={slots}
                selectedSlot={activeSlot}
                onSelectSlot={handleSelectSlot}
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredSlots.map((slot) => (
                  <ParkingSlotCard
                    key={slot.id}
                    slot={slot}
                    isSelected={activeSlot?.id === slot.id}
                    onClick={() => handleSelectSlot(slot)}
                  />
                ))}
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-charcoal-500 px-1 font-mono">
              <span>FACILITY ID: PRK-NORTH-01</span>
              <span>SIMULATED DEMO TELEMETRY ACTIVE</span>
            </div>
          </div>

          {/* Side Bay Inspector Drawer (1 col) */}
          <div className="lg:col-span-1 sticky top-20">
            {activeSlot ? (
              <BayInspectorDrawer
                slot={activeSlot}
                onClose={() => setActiveSlot(null)}
                onReserve={handleStartBooking}
                isAdmin={isAdmin}
                onUpdateStatus={handleAdminUpdateStatus}
                isUpdatingStatus={isUpdatingStatus}
              />
            ) : (
              <div className="bg-white rounded-2xl border border-charcoal-200 p-8 text-center space-y-2">
                <Map className="w-8 h-8 text-charcoal-300 mx-auto" />
                <h3 className="font-bold text-charcoal-800 text-sm">Select Any Parking Bay</h3>
                <p className="text-xs text-charcoal-500">
                  Click on any numbered stall in the top-down layout to inspect details, check EV availability, or reserve.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Booking Form Modal */}
      <BookingModal
        slot={activeSlot}
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        onSuccess={() => {
          if (onRefresh) onRefresh()
        }}
      />
    </div>
  )
}
