import React, { useEffect, useState, useCallback, useMemo } from 'react'
import {
  fetchAllSlots,
  createSlot,
  updateSlot,
  simulateOccupancyChange,
  subscribeToParkingChanges,
} from '@/features/parking/parkingService'
import type { ParkingSlot, OccupancyStatus } from '@/types/database'
import { TopDownLotVisualizer } from '@/components/parking/TopDownLotVisualizer'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal, ConfirmDialog } from '@/components/ui/Modal'
import {
  SlidersHorizontal,
  Plus,
  Car,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Edit,
  Power,
  RefreshCw,
  Sparkles,
  Map,
  Table as TableIcon,
  Search,
} from 'lucide-react'
import { cn, OCCUPANCY_BADGE_CLASS, OCCUPANCY_LABELS } from '@/lib/utils'
import { getParkingStatusTheme } from '@/lib/statusColors'

export const AdminParkingPage: React.FC = () => {
  const [slots, setSlots] = useState<ParkingSlot[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'blueprint' | 'table'>('table')
  const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null)

  // Filters matching reference Screen 5
  const [floorFilter, setFloorFilter] = useState<'all' | 'ground' | 'level1' | 'level2'>('all')
  const [zoneFilter, setZoneFilter] = useState<'all' | 'A' | 'B' | 'C'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Simulation state
  const [simulatingSlotId, setSimulatingSlotId] = useState<string | null>(null)
  const [simulatingAction, setSimulatingAction] = useState<string | null>(null)

  // Slot Create/Edit modal state
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false)
  const [editingSlot, setEditingSlot] = useState<ParkingSlot | null>(null)
  const [formLabel, setFormLabel] = useState('')
  const [formFloor, setFormFloor] = useState<'ground' | 'level1' | 'level2'>('ground')
  const [formZone, setFormZone] = useState('A')
  const [formType, setFormType] = useState('standard')
  const [formNotes, setFormNotes] = useState('')
  const [formIsActive, setFormIsActive] = useState(true)
  const [isSavingSlot, setIsSavingSlot] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  // Toggle active confirmation
  const [toggleSlot, setToggleSlot] = useState<ParkingSlot | null>(null)
  const [isToggling, setIsToggling] = useState(false)

  const loadSlots = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoading(true)
      const data = await fetchAllSlots()
      setSlots(data)
      if (data.length > 0 && !selectedSlot) {
        setSelectedSlot(data[0])
      }
    } finally {
      setIsLoading(false)
    }
  }, [selectedSlot])

  useEffect(() => {
    loadSlots()
    const unsubscribe = subscribeToParkingChanges(() => {
      loadSlots(true)
    })
    return () => unsubscribe()
  }, [loadSlots])

  const filteredSlots = useMemo(() => {
    return slots.filter((slot) => {
      if (floorFilter !== 'all' && slot.floor !== floorFilter) return false
      if (zoneFilter !== 'all' && slot.zone !== zoneFilter) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        return slot.label.toLowerCase().includes(q) || slot.zone.toLowerCase().includes(q)
      }
      return true
    })
  }, [slots, floorFilter, zoneFilter, searchQuery])

  // Simulator action: generic status transition
  const handleUpdateStatus = async (slot: ParkingSlot, newStatus: OccupancyStatus) => {
    try {
      setSimulatingSlotId(slot.id)
      await simulateOccupancyChange(slot.id, newStatus)
      const updated: ParkingSlot = {
        ...slot,
        occupancy_status: newStatus,
        is_active: newStatus !== 'maintenance',
      }
      setSlots((prev) => prev.map((s) => (s.id === slot.id ? updated : s)))
      if (selectedSlot?.id === slot.id) {
        setSelectedSlot(updated)
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Status change failed')
    } finally {
      setSimulatingSlotId(null)
    }
  }

  // Simulator actions: Vehicle Arrival & Vehicle Departure
  const handleSimulateArrival = async (slot: ParkingSlot) => {
    try {
      setSimulatingSlotId(slot.id)
      setSimulatingAction('arrival')
      await simulateOccupancyChange(slot.id, 'occupied')
      const updated: ParkingSlot = {
        ...slot,
        occupancy_status: 'occupied',
        is_active: true,
      }
      setSlots((prev) => prev.map((s) => (s.id === slot.id ? updated : s)))
      if (selectedSlot?.id === slot.id) {
        setSelectedSlot(updated)
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Simulation failed')
    } finally {
      setSimulatingSlotId(null)
      setSimulatingAction(null)
    }
  }

  const handleSimulateDeparture = async (slot: ParkingSlot) => {
    try {
      setSimulatingSlotId(slot.id)
      setSimulatingAction('departure')
      await simulateOccupancyChange(slot.id, 'available')
      const updated: ParkingSlot = {
        ...slot,
        occupancy_status: 'available',
        is_active: true,
      }
      setSlots((prev) => prev.map((s) => (s.id === slot.id ? updated : s)))
      if (selectedSlot?.id === slot.id) {
        setSelectedSlot(updated)
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Simulation failed')
    } finally {
      setSimulatingSlotId(null)
      setSimulatingAction(null)
    }
  }

  const handleOpenCreate = () => {
    setEditingSlot(null)
    setFormLabel('')
    setFormFloor('ground')
    setFormZone('A')
    setFormType('standard')
    setFormNotes('')
    setFormIsActive(true)
    setModalError(null)
    setIsSlotModalOpen(true)
  }

  const handleOpenEdit = (slot: ParkingSlot) => {
    setEditingSlot(slot)
    setFormLabel(slot.label)
    setFormFloor(slot.floor)
    setFormZone(slot.zone)
    setFormType(slot.slot_type)
    setFormNotes(slot.notes || '')
    setFormIsActive(slot.is_active)
    setModalError(null)
    setIsSlotModalOpen(true)
  }

  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault()
    setModalError(null)

    if (!formLabel.trim() || !formZone.trim()) {
      setModalError('Label and Zone are required.')
      return
    }

    try {
      setIsSavingSlot(true)
      if (editingSlot) {
        await updateSlot(editingSlot.id, {
          label: formLabel.trim().toUpperCase(),
          zone: formZone.trim().toUpperCase(),
          floor: formFloor,
          slot_type: formType,
          is_active: formIsActive,
          notes: formNotes.trim() || undefined,
        })
      } else {
        await createSlot({
          label: formLabel.trim().toUpperCase(),
          zone: formZone.trim().toUpperCase(),
          floor: formFloor,
          slot_type: formType,
          is_active: formIsActive,
          notes: formNotes.trim() || undefined,
        })
      }
      setIsSlotModalOpen(false)
      loadSlots()
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : 'Failed to save bay')
    } finally {
      setIsSavingSlot(false)
    }
  }

  const handleConfirmToggleActive = async () => {
    if (!toggleSlot) return
    try {
      setIsToggling(true)
      await updateSlot(toggleSlot.id, { is_active: !toggleSlot.is_active })
      setToggleSlot(null)
      loadSlots()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Could not change bay status')
    } finally {
      setIsToggling(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-charcoal-200">
        <div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-[#165DFB]" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1B3D] tracking-tight">
              Parking Management <span className="text-slate-400 font-normal text-lg sm:text-xl">· Bay Management & Sensor Simulator</span>
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Monitor and manage all parking bays
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadSlots()}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add New Bay
          </Button>
        </div>
      </div>

      {/* Clearly labelled DEMO SIMULATOR Banner */}
      <div className="bg-emerald-50/80 border border-emerald-300 rounded-xl p-4 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-700" />
            <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
              Hardware Sensor Simulation Controls (Academic Evaluation Tool)
            </h3>
          </div>
          <span className="bg-emerald-600 text-white font-mono text-[10px] px-2 py-0.5 rounded font-bold">
            SIMULATOR ACTIVE
          </span>
        </div>
        <p className="text-xs text-emerald-800 leading-relaxed">
          In commercial installations, bays receive telemetry from ultrasonic or geomagnetic pavement sensors. For this academic project, trigger state changes using <strong>"Simulate Arrival"</strong> and <strong>"Simulate Departure"</strong> below to test real-time synchronization across connected screens.
        </p>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-charcoal-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('blueprint')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'blueprint'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-charcoal-600 hover:text-charcoal-900 hover:bg-charcoal-100'
          }`}
        >
          <Map className="w-3.5 h-3.5" />
          <span>Top-Down Lot Visualizer</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('table')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'table'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-charcoal-600 hover:text-charcoal-900 hover:bg-charcoal-100'
          }`}
        >
          <TableIcon className="w-3.5 h-3.5" />
          <span>Bay Inventory Table</span>
        </button>
      </div>

      {/* Blueprint Tab */}
      {activeTab === 'blueprint' && (
        <div className="space-y-4">
          <TopDownLotVisualizer
            slots={slots}
            selectedSlot={selectedSlot}
            onSelectSlot={(slot) => setSelectedSlot(slot)}
          />

          {selectedSlot && (
            <div className="bg-white rounded-xl border border-charcoal-200 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs text-charcoal-400 font-bold uppercase block">Selected Bay</span>
                <span className="text-lg font-black text-charcoal-900 font-mono">
                  Bay {selectedSlot.label} ({selectedSlot.floor === 'ground' ? 'Ground Floor' : selectedSlot.floor === 'level1' ? 'Level 1' : 'Level 2'} · Zone {selectedSlot.zone}) — {selectedSlot.occupancy_status.toUpperCase()}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold text-charcoal-400 uppercase tracking-wider mr-1">Simulate Status:</span>
                {(['available', 'occupied', 'reserved', 'maintenance'] as const).map((st) => {
                  const isCurrent = selectedSlot.occupancy_status === st
                  const theme = getParkingStatusTheme(st)
                  return (
                    <Button
                      key={st}
                      variant="outline"
                      size="sm"
                      disabled={simulatingSlotId === selectedSlot.id}
                      onClick={() => handleUpdateStatus(selectedSlot, st)}
                      className={cn(
                        'text-[11px] py-1 px-2.5 capitalize font-bold transition-all',
                        isCurrent
                          ? `${theme.dotBg} text-white border-transparent shadow-xs`
                          : `${theme.badgeBg} ${theme.badgeBorder} ${theme.badgeText} hover:opacity-90`
                      )}
                    >
                      {theme.shortLabel}
                    </Button>
                  )
                })}
                <div className="h-4 w-px bg-charcoal-200 mx-1" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenEdit(selectedSlot)}
                  className="text-xs text-charcoal-600"
                  leftIcon={<Edit className="w-3.5 h-3.5" />}
                >
                  Edit Bay
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Table Tab matching Reference Screen 5 */}
      {activeTab === 'table' && (
        <div className="space-y-4">
          {/* Reference Filter Toolbar matching Screen 5 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Floor filter dropdown */}
              <select
                value={floorFilter}
                onChange={(e) => setFloorFilter(e.target.value as any)}
                className="text-xs font-semibold text-[#0B1B3D] bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#165DFB]"
              >
                <option value="all">All Floors</option>
                <option value="ground">Ground Floor (A)</option>
                <option value="level1">Level 1 (B)</option>
                <option value="level2">Level 2 (C)</option>
              </select>

              {/* Zone filter dropdown */}
              <select
                value={zoneFilter}
                onChange={(e) => setZoneFilter(e.target.value as any)}
                className="text-xs font-semibold text-[#0B1B3D] bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#165DFB]"
              >
                <option value="all">All Zones</option>
                <option value="A">Zone A</option>
                <option value="B">Zone B</option>
                <option value="C">Zone C</option>
              </select>
            </div>

            {/* Search bays */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search bays..."
                className="w-full text-xs pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#165DFB]"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-5 py-3">Bay</th>
                    <th className="px-5 py-3">Floor</th>
                    <th className="px-5 py-3">Zone</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-center">Simulator</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredSlots.map((slot) => {
                    const effectiveStatus = !slot.is_active ? 'maintenance' : slot.occupancy_status
                    const isThisSimulating = simulatingSlotId === slot.id

                    return (
                      <tr key={slot.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-[#0B1B3D] text-sm font-mono">
                          {slot.label}
                        </td>
                        <td className="px-5 py-3.5 font-medium text-slate-700">
                          {slot.floor === 'ground' ? 'Ground (A)' : slot.floor === 'level1' ? 'Level 1 (B)' : 'Level 2 (C)'}
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 font-medium">
                          Zone {slot.zone}
                        </td>
                        <td className="px-5 py-3.5">
                          {(() => {
                            const theme = getParkingStatusTheme(effectiveStatus)
                            return (
                              <span
                                className={cn(
                                  'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border',
                                  theme.badgeClasses
                                )}
                                data-status={theme.key}
                              >
                                <span className={cn('w-1.5 h-1.5 rounded-full', theme.dotBg)} />
                                {theme.label}
                              </span>
                            )
                          })()}
                        </td>

                        {/* Sensor Simulator Buttons */}
                      <td className="px-5 py-3.5 text-center">
                        <div className="inline-flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isThisSimulating || effectiveStatus === 'occupied'}
                            isLoading={isThisSimulating && simulatingAction === 'arrival'}
                            onClick={() => handleSimulateArrival(slot)}
                            className="text-red-700 border-red-200 hover:bg-red-50 text-[11px] py-1"
                            leftIcon={<Car className="w-3.5 h-3.5 text-red-600" />}
                          >
                            Arrival
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isThisSimulating || effectiveStatus === 'available'}
                            isLoading={isThisSimulating && simulatingAction === 'departure'}
                            onClick={() => handleSimulateDeparture(slot)}
                            className="text-emerald-700 border-emerald-200 hover:bg-emerald-50 text-[11px] py-1"
                            leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                          >
                            Departure
                          </Button>
                        </div>
                      </td>

                      {/* Management Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(slot)}
                            title="Edit bay details"
                            className="text-charcoal-500 hover:text-charcoal-900 p-1.5"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setToggleSlot(slot)}
                            title={slot.is_active ? 'Deactivate bay' : 'Activate bay'}
                            className={slot.is_active ? 'text-charcoal-500 hover:text-amber-600 p-1.5' : 'text-charcoal-400 hover:text-emerald-600 p-1.5'}
                          >
                            <Power className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )}

      {/* Add / Edit Bay Modal */}
      <Modal
        isOpen={isSlotModalOpen}
        onClose={() => setIsSlotModalOpen(false)}
        title={editingSlot ? `Edit Bay ${editingSlot.label}` : 'Create New Parking Bay'}
      >
        <form onSubmit={handleSaveSlot} className="space-y-4">
          {modalError && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">
              {modalError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">
              Bay Number / Identifier
            </label>
            <Input
              type="text"
              placeholder="e.g. A11, B12"
              value={formLabel}
              onChange={(e) => setFormLabel(e.target.value.toUpperCase())}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Floor & Zone
              </label>
              <select
                className="w-full px-3 py-2 text-sm border border-charcoal-300 rounded-lg bg-white text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={formFloor}
                onChange={(e) => {
                  const fl = e.target.value as 'ground' | 'level1' | 'level2'
                  setFormFloor(fl)
                  setFormZone(fl === 'ground' ? 'A' : fl === 'level1' ? 'B' : 'C')
                }}
              >
                <option value="ground">Ground Floor (Zone A)</option>
                <option value="level1">Level 1 (Zone B)</option>
                <option value="level2">Level 2 (Zone C)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Bay Type
              </label>
              <select
                className="w-full px-3 py-2 text-sm border border-charcoal-300 rounded-lg bg-white text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
              >
                <option value="standard">Standard</option>
                <option value="compact">Compact</option>
                <option value="ev">EV Charging</option>
                <option value="accessible">Accessible / ADA</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">
              Location Notes
            </label>
            <Input
              type="text"
              placeholder="e.g. Near North elevator pillar"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="is_active_check"
              checked={formIsActive}
              onChange={(e) => setFormIsActive(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
            />
            <label htmlFor="is_active_check" className="text-xs font-medium text-charcoal-700">
              Active for public driver reservations
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-charcoal-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsSlotModalOpen(false)}
              disabled={isSavingSlot}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSavingSlot}>
              {editingSlot ? 'Save Changes' : 'Create Bay'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Dialog for Toggling Active/Disabled */}
      <ConfirmDialog
        isOpen={Boolean(toggleSlot)}
        onClose={() => setToggleSlot(null)}
        onConfirm={handleConfirmToggleActive}
        title={toggleSlot?.is_active ? 'Deactivate Parking Bay' : 'Activate Parking Bay'}
        message={
          toggleSlot?.is_active
            ? `Deactivating Bay ${toggleSlot.label} will mark it Out of Service and prevent drivers from reserving it.`
            : `Activating Bay ${toggleSlot?.label} will return it to active availability.`
        }
        confirmLabel={toggleSlot?.is_active ? 'Deactivate Bay' : 'Activate Bay'}
        isDanger={toggleSlot?.is_active}
        isLoading={isToggling}
      />
    </div>
  )
}
