import React from 'react'
import type { ParkingSlot } from '@/types/database'
import { CheckCircle2, Clock, Car, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ParkingSlotCardProps {
  slot: ParkingSlot
  isSelected?: boolean
  onClick?: () => void
  disabled?: boolean
}

export const ParkingSlotCard: React.FC<ParkingSlotCardProps> = ({
  slot,
  isSelected,
  onClick,
  disabled,
}) => {
  const statusConfig = {
    available: {
      label: 'Available',
      icon: CheckCircle2,
      border: 'border-green-300 hover:border-green-500',
      bg: 'bg-green-50/70 hover:bg-green-50',
      text: 'text-green-800',
      tagBg: 'bg-green-100 text-green-800 border-green-200',
      indicator: 'bg-[#16A34A]',
    },
    occupied: {
      label: 'Occupied',
      icon: Car,
      border: 'border-red-300 hover:border-red-400',
      bg: 'bg-red-50/70',
      text: 'text-red-900',
      tagBg: 'bg-red-100 text-red-800 border-red-200',
      indicator: 'bg-[#DC2626]',
    },
    reserved: {
      label: 'Reserved',
      icon: Clock,
      border: 'border-blue-300 hover:border-blue-400',
      bg: 'bg-blue-50/70',
      text: 'text-blue-900',
      tagBg: 'bg-blue-100 text-blue-800 border-blue-200',
      indicator: 'bg-[#2563EB]',
    },
    maintenance: {
      label: 'Out of Service',
      icon: AlertTriangle,
      border: 'border-amber-300',
      bg: 'bg-amber-50/70',
      text: 'text-amber-800',
      tagBg: 'bg-amber-100 text-amber-800 border-amber-200',
      indicator: 'bg-[#EAB308]',
    },
  }

  const effectiveStatus = !slot.is_active ? 'maintenance' : slot.occupancy_status
  const current = statusConfig[effectiveStatus] || statusConfig.maintenance
  const IconComponent = current.icon

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'group relative flex flex-col justify-between p-3.5 rounded-xl border-2 transition-all duration-150 text-left outline-none',
        current.bg,
        current.border,
        isSelected && 'ring-2 ring-emerald-600 ring-offset-2 border-emerald-600 shadow-md scale-[1.02]',
        disabled && 'opacity-60 cursor-not-allowed',
        !disabled && 'cursor-pointer hover:shadow-md'
      )}
      aria-label={`Parking slot ${slot.label}, zone ${slot.zone}, status: ${current.label}`}
    >
      {/* Top Header: Label & Status Indicator */}
      <div className="flex items-center justify-between w-full">
        <span className="font-extrabold text-base tracking-tight text-charcoal-900 group-hover:text-emerald-700 transition-colors">
          {slot.label}
        </span>
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border',
            current.tagBg
          )}
        >
          <span className={cn('w-1.5 h-1.5 rounded-full', current.indicator)} />
          {current.label}
        </span>
      </div>

      {/* Center visual: Icon & Zone */}
      <div className="my-2.5 flex items-center justify-between w-full">
        <div className="flex items-center gap-1.5 text-xs text-charcoal-500">
          <span className="font-medium bg-white/80 px-1.5 py-0.5 rounded border border-charcoal-200/60">
            Zone {slot.zone}
          </span>
          <span className="text-[11px] uppercase tracking-wider text-charcoal-400">
            {slot.slot_type}
          </span>
        </div>
        <IconComponent className={cn('w-5 h-5 opacity-80', current.text)} />
      </div>

      {/* Bottom info: slot notes if any or click prompt */}
      <div className="w-full text-[11px] text-charcoal-400 truncate">
        {slot.notes ? (
          <span>{slot.notes}</span>
        ) : effectiveStatus === 'available' ? (
          <span className="text-emerald-700 font-medium group-hover:underline">Click to reserve</span>
        ) : (
          <span>Inspect slot</span>
        )}
      </div>
    </button>
  )
}
