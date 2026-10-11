import React from 'react'
import type { ParkingSlot } from '@/types/database'
import { Zap, Accessibility, ShieldAlert, ArrowDown, ArrowUp, ArrowRight, ArrowLeft } from 'lucide-react'

interface TopDownLotVisualizerProps {
  slots: ParkingSlot[]
  selectedSlot: ParkingSlot | null
  onSelectSlot: (slot: ParkingSlot) => void
}

export const TopDownLotVisualizer: React.FC<TopDownLotVisualizerProps> = ({
  slots,
  selectedSlot,
  onSelectSlot,
}) => {
  // Group slots by Zone
  const zoneASlots = slots.filter((s) => s.zone === 'A')
  const zoneBSlots = slots.filter((s) => s.zone === 'B')
  const zoneCSlots = slots.filter((s) => s.zone === 'C')

  // Render individual parking bay
  const renderBay = (slot: ParkingSlot, orientation: 'down' | 'up' = 'down') => {
    const isSelected = selectedSlot?.id === slot.id
    const isOccupied = slot.is_active && slot.occupancy_status === 'occupied'
    const isReserved = slot.is_active && slot.occupancy_status === 'reserved'
    const isAvailable = slot.is_active && slot.occupancy_status === 'available'
    const isMaintenance = !slot.is_active || slot.occupancy_status === 'maintenance'

    // Status styling according to centralized ParkSense palette
    let bayBg = 'bg-charcoal-800/90'
    let borderColor = 'border-charcoal-600'
    let textColor = 'text-charcoal-200'
    let statusDot = 'bg-[#16A34A]'

    if (isAvailable) {
      bayBg = 'bg-[#16a34a]/20 hover:bg-[#16a34a]/30'
      borderColor = 'border-[#16A34A]'
      textColor = 'text-green-400'
      statusDot = 'bg-[#16A34A]'
    } else if (isOccupied) {
      bayBg = 'bg-[#dc2626]/20 hover:bg-[#dc2626]/30'
      borderColor = 'border-[#DC2626]'
      textColor = 'text-red-400'
      statusDot = 'bg-[#DC2626]'
    } else if (isReserved) {
      bayBg = 'bg-[#2563eb]/20 hover:bg-[#2563eb]/30'
      borderColor = 'border-[#2563EB]'
      textColor = 'text-blue-400'
      statusDot = 'bg-[#2563EB]'
    } else if (isMaintenance) {
      bayBg = 'bg-[#eab308]/20 hover:bg-[#eab308]/30'
      borderColor = 'border-[#EAB308] border-dashed'
      textColor = 'text-amber-400'
      statusDot = 'bg-[#EAB308]'
    }

    if (isSelected) {
      borderColor = 'border-[#1263F1] ring-2 ring-[#1263F1] shadow-lg shadow-blue-500/20'
    }

    return (
      <button
        key={slot.id}
        type="button"
        onClick={() => onSelectSlot(slot)}
        className={`group relative flex flex-col items-center justify-between p-2 rounded-md transition-all duration-150 cursor-pointer select-none text-left min-w-[70px] sm:min-w-[80px] h-28 border-x-2 ${
          orientation === 'down' ? 'border-t-2 border-b-0' : 'border-b-2 border-t-0'
        } ${bayBg} ${borderColor}`}
        title={`Bay ${slot.label} (Zone ${slot.zone}) - ${slot.occupancy_status.toUpperCase()}`}
        data-bay={slot.label}
        data-status={!slot.is_active ? 'maintenance' : slot.occupancy_status}
      >
        {/* Bay Number & Type Icon */}
        <div className="w-full flex items-center justify-between text-[11px] font-bold">
          <span className={`font-mono tracking-tight ${textColor}`}>{slot.label}</span>
          <div className="flex items-center gap-1">
            {slot.slot_type === 'ev' && (
              <span title="EV Charging">
                <Zap className="w-3 h-3 text-emerald-400 shrink-0" />
              </span>
            )}
            {slot.slot_type === 'accessible' && (
              <span title="Accessible">
                <Accessibility className="w-3 h-3 text-blue-400 shrink-0" />
              </span>
            )}
            {isMaintenance && (
              <span title="Maintenance">
                <ShieldAlert className="w-3 h-3 text-amber-400 shrink-0" />
              </span>
            )}
            <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
          </div>
        </div>

        {/* Center: Top-down vehicle silhouette or stall symbol */}
        <div className="my-auto flex items-center justify-center w-full">
          {isOccupied ? (
            /* Minimalist Top-Down Vehicle Graphic */
            <div className="w-10 h-14 bg-charcoal-700 rounded-sm border border-charcoal-500 flex flex-col justify-between p-0.5 shadow-sm">
              {/* Windshield */}
              <div className="w-full h-2 bg-charcoal-900 rounded-xs" />
              {/* Roof */}
              <div className="w-6 h-4 bg-charcoal-600 mx-auto rounded-xs flex items-center justify-center">
                <span className="text-[8px] font-mono text-charcoal-400 uppercase">CAR</span>
              </div>
              {/* Rear window */}
              <div className="w-full h-1.5 bg-charcoal-900 rounded-xs" />
            </div>
          ) : isReserved ? (
            <div className="flex flex-col items-center text-blue-300">
              <span className="text-[9px] font-mono font-bold tracking-widest uppercase bg-blue-900/60 px-1 py-0.5 rounded border border-[#2563EB]/60">
                RESERVED
              </span>
            </div>
          ) : isMaintenance ? (
            <div className="text-center text-[9px] font-mono text-amber-300">
              <span className="bg-amber-950/60 px-1 py-0.5 rounded border border-[#EAB308]/60">
                SERVICE
              </span>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full border border-dashed border-[#16A34A]/60 flex items-center justify-center text-[#16A34A] font-bold text-xs group-hover:scale-110 transition-transform">
              P
            </div>
          )}
        </div>

        {/* Bay Bottom line / status text */}
        <div className="w-full text-center">
          <span className="text-[9px] font-mono uppercase tracking-wider text-charcoal-400 group-hover:text-charcoal-200">
            {slot.occupancy_status}
          </span>
        </div>
      </button>
    )
  }

  return (
    <div className="w-full rounded-2xl bg-charcoal-950 border border-charcoal-800 p-4 sm:p-6 text-charcoal-100 shadow-xl overflow-x-auto">
      {/* Top Header: Entry Gate, Exit Gate, Legend */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-charcoal-800 gap-4 min-w-[760px]">
        {/* Gate Entry & Exit indicators */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-500/40 px-3 py-1.5 rounded-lg text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-300 font-bold">GATE A [ENTRY]</span>
            <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
          </div>

          <div className="flex items-center gap-2 bg-charcoal-900 border border-charcoal-700 px-3 py-1.5 rounded-lg text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-charcoal-300 font-bold">GATE B [EXIT]</span>
            <ArrowUp className="w-3.5 h-3.5 text-red-400" />
          </div>
        </div>

        {/* Top-Down Schematic Legend */}
        <div className="flex items-center gap-4 text-xs font-medium text-charcoal-300 bg-charcoal-900/80 px-3 py-1.5 rounded-lg border border-charcoal-800">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#16A34A] border border-green-500" title="#16A34A" data-status-color="#16A34A" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#DC2626] border border-red-500" title="#DC2626" data-status-color="#DC2626" />
            <span>Occupied</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#2563EB] border border-blue-500" title="#2563EB" data-status-color="#2563EB" />
            <span>Reserved</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#EAB308] border border-yellow-500" title="#EAB308" data-status-color="#EAB308" />
            <span>Out of Service</span>
          </div>
        </div>
      </div>

      {/* Lot Blueprint Schematic Area */}
      <div className="pt-6 space-y-6 min-w-[760px]">
        {/* ========================================================= */}
        {/* ZONE A SECTION (Ground Floor / Premium, EV & Accessible)  */}
        {/* ========================================================= */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold tracking-wider text-emerald-400 uppercase font-mono flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-400 rounded-full" />
              Zone A — Ground Floor (EV Charging & Accessible)
            </span>
            <span className="text-charcoal-400 font-mono text-[11px]">Bays A01 – A10</span>
          </div>

          <div className="grid grid-cols-10 gap-2 bg-charcoal-900/60 p-3 rounded-xl border border-charcoal-800/80">
            {zoneASlots.map((s) => renderBay(s, 'down'))}
          </div>
        </div>

        {/* DRIVING LANE 1 (Circulation Path) */}
        <div className="relative h-12 bg-charcoal-900 rounded-lg border border-dashed border-charcoal-700 flex items-center justify-between px-6 overflow-hidden">
          {/* Road center dash marks */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-around">
            {Array.from({ length: 8 }).map((_, i) => (
              <span key={i} className="w-8 h-0.5 bg-yellow-500/70" />
            ))}
          </div>

          <div className="relative z-10 flex items-center gap-2 text-[10px] font-mono text-charcoal-400 uppercase">
            <ArrowRight className="w-3.5 h-3.5 text-yellow-500" />
            <span>One-Way Traffic Circulation Lane A</span>
          </div>

          <div className="relative z-10 flex items-center gap-1 text-[10px] font-mono text-charcoal-400">
            <span>Speed Limit 10 km/h</span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* ZONE B SECTION (Level 1 / General Fleet Stalls)           */}
        {/* ========================================================= */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold tracking-wider text-blue-400 uppercase font-mono flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-400 rounded-full" />
              Zone B — Level 1 (General Fleet Parking)
            </span>
            <span className="text-charcoal-400 font-mono text-[11px]">Bays B01 – B10</span>
          </div>

          <div className="grid grid-cols-10 gap-2 bg-charcoal-900/60 p-3 rounded-xl border border-charcoal-800/80">
            {zoneBSlots.map((s) => renderBay(s, 'up'))}
          </div>
        </div>

        {/* DRIVING LANE 2 (Circulation Path) */}
        <div className="relative h-12 bg-charcoal-900 rounded-lg border border-dashed border-charcoal-700 flex items-center justify-between px-6 overflow-hidden">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-around">
            {Array.from({ length: 8 }).map((_, i) => (
              <span key={i} className="w-8 h-0.5 bg-yellow-500/70" />
            ))}
          </div>

          <div className="relative z-10 flex items-center gap-2 text-[10px] font-mono text-charcoal-400 uppercase">
            <ArrowLeft className="w-3.5 h-3.5 text-yellow-500" />
            <span>Circulation Lane B → East Wing Exit</span>
          </div>

          <div className="relative z-10 text-[10px] font-mono text-charcoal-400">
            <span>Pedestrian Crossing Zone</span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* ZONE C SECTION (Level 2 / Extended Stay & Economy)        */}
        {/* ========================================================= */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold tracking-wider text-charcoal-300 uppercase font-mono flex items-center gap-2">
              <span className="w-2 h-2 bg-charcoal-400 rounded-full" />
              Zone C — Level 2 (Extended Stay & Economy)
            </span>
            <span className="text-charcoal-400 font-mono text-[11px]">Bays C01 – C08</span>
          </div>

          <div className="grid grid-cols-8 gap-2 bg-charcoal-900/60 p-3 rounded-xl border border-charcoal-800/80">
            {zoneCSlots.map((s) => renderBay(s, 'down'))}
          </div>
        </div>
      </div>
    </div>
  )
}
