import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ParkingSlotCard } from '@/components/parking/ParkingSlotCard'
import { Badge } from '@/components/ui/Badge'
import { ErrorMessage, EmptyState } from '@/components/ui/Feedback'
import type { ParkingSlot } from '@/types/database'

describe('ParkingSlotCard Component', () => {
  const mockSlot: ParkingSlot = {
    id: 'slot-1',
    label: 'A01',
    zone: 'A',
    floor: 'ground',
    slot_type: 'ev',
    is_active: true,
    occupancy_status: 'available',
    notes: '22kW Charger',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  it('renders slot label, zone, type, and availability badge', () => {
    render(<ParkingSlotCard slot={mockSlot} />)
    expect(screen.getByText('A01')).toBeInTheDocument()
    expect(screen.getByText('Zone A')).toBeInTheDocument()
    expect(screen.getByText('Available')).toBeInTheDocument()
    expect(screen.getByText('22kW Charger')).toBeInTheDocument()
  })

  it('fires onClick callback when clicked', () => {
    const handleClick = vi.fn()
    render(<ParkingSlotCard slot={mockSlot} onClick={handleClick} />)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('renders occupied status visually and accessible', () => {
    const occupiedSlot: ParkingSlot = {
      ...mockSlot,
      occupancy_status: 'occupied',
      notes: null,
    }
    render(<ParkingSlotCard slot={occupiedSlot} />)
    expect(screen.getByText('Occupied')).toBeInTheDocument()
  })
})

describe('Feedback Components', () => {
  it('renders ErrorMessage with retry action', () => {
    const handleRetry = vi.fn()
    render(
      <ErrorMessage
        title="Network Error"
        message="Unable to connect to database"
        onRetry={handleRetry}
      />
    )
    expect(screen.getByText('Network Error')).toBeInTheDocument()
    expect(screen.getByText('Unable to connect to database')).toBeInTheDocument()

    const retryBtn = screen.getByRole('button', { name: /try again/i })
    fireEvent.click(retryBtn)
    expect(handleRetry).toHaveBeenCalledTimes(1)
  })

  it('renders EmptyState with custom title and description', () => {
    render(
      <EmptyState
        title="No Spaces Reserved"
        description="Browse the interactive map to reserve your first slot."
      />
    )
    expect(screen.getByText('No Spaces Reserved')).toBeInTheDocument()
    expect(screen.getByText('Browse the interactive map to reserve your first slot.')).toBeInTheDocument()
  })
})
