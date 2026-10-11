import React, { useEffect, useState } from 'react'
import { fetchAnalyticsStats } from '@/features/analytics/analyticsService'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { BarChart3, RefreshCw, Layers, PieChart as PieIcon, TrendingUp, Info } from 'lucide-react'
import { PARKING_STATUS_THEMES } from '@/lib/statusColors'

export const AdminAnalyticsPage: React.FC = () => {
  const [data, setData] = useState<{
    bookings: Array<{ status: string; created_at: string }>
    slots: Array<{ id: string; label: string; zone: string; occupancy_status: string; is_active: boolean }>
  }>({ bookings: [], slots: [] })
  const [isLoading, setIsLoading] = useState(true)

  const loadData = async () => {
    try {
      setIsLoading(true)
      const res = await fetchAnalyticsStats()
      setData(res)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Process data for charts
  const statusCounts = data.slots.reduce(
    (acc, slot) => {
      const status = !slot.is_active ? 'maintenance' : slot.occupancy_status
      acc[status] = (acc[status] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const occupancyPieData = [
    { name: 'Available', value: statusCounts.available || 0, color: PARKING_STATUS_THEMES.available.hex },
    { name: 'Occupied', value: statusCounts.occupied || 0, color: PARKING_STATUS_THEMES.occupied.hex },
    { name: 'Reserved', value: statusCounts.reserved || 0, color: PARKING_STATUS_THEMES.reserved.hex },
    { name: 'Maintenance', value: statusCounts.maintenance || 0, color: PARKING_STATUS_THEMES.maintenance.hex },
  ].filter((d) => d.value > 0)

  // Booking stats
  const bookingCounts = data.bookings.reduce(
    (acc, b) => {
      acc[b.status] = (acc[b.status] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const bookingBarData = [
    { name: 'Confirmed', count: bookingCounts.confirmed || 0, fill: '#10b981' },
    { name: 'Completed', count: bookingCounts.completed || 0, fill: '#3b82f6' },
    { name: 'Cancelled', count: bookingCounts.cancelled || 0, fill: '#9ca3af' },
  ]

  // Zone distribution
  const zoneCounts = data.slots.reduce(
    (acc, s) => {
      const z = s.zone || 'Other'
      acc[z] = (acc[z] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const zoneBarData = Object.entries(zoneCounts).map(([zone, count]) => ({
    zone: `Zone ${zone}`,
    slots: count,
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-charcoal-200/80">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 tracking-tight">
              Facility Analytics & Intelligence
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-charcoal-500 mt-1">
            Real-time metrics, capacity utilization, and historical booking activity.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          isLoading={isLoading}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Refresh Data
        </Button>
      </div>

      {/* Summary KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-charcoal-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-charcoal-400 uppercase tracking-wider block">
            Total Slots Managed
          </span>
          <span className="text-2xl font-black text-charcoal-900 mt-1 block">
            {data.slots.length}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-charcoal-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-charcoal-400 uppercase tracking-wider block">
            All-Time Bookings
          </span>
          <span className="text-2xl font-black text-charcoal-900 mt-1 block">
            {data.bookings.length}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-charcoal-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-charcoal-400 uppercase tracking-wider block">
            Active Confirmed
          </span>
          <span className="text-2xl font-black text-emerald-700 mt-1 block">
            {bookingCounts.confirmed || 0}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-charcoal-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-charcoal-400 uppercase tracking-wider block">
            Cancellation Rate
          </span>
          <span className="text-2xl font-black text-charcoal-700 mt-1 block">
            {data.bookings.length > 0
              ? `${Math.round(((bookingCounts.cancelled || 0) / data.bookings.length) * 100)}%`
              : '0%'}
          </span>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Occupancy Distribution */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-emerald-600" />
              <CardTitle>Current Space Distribution</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {occupancyPieData.length === 0 ? (
              <p className="py-12 text-center text-xs text-charcoal-400">No slot data available.</p>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={occupancyPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {occupancyPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bookings by Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <CardTitle>Booking Lifecycle Distribution</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {data.bookings.length === 0 ? (
              <div className="py-12 text-center text-xs text-charcoal-400 space-y-2">
                <p>No historical booking records in database yet.</p>
                <p className="text-[11px] text-charcoal-500">
                  Real numbers will populate as users create and manage parking reservations.
                </p>
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bookingBarData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Zone Capacity Breakdown */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <CardTitle>Capacity per Facility Zone</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {zoneBarData.length === 0 ? (
            <p className="py-8 text-center text-xs text-charcoal-400">No zones recorded.</p>
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={zoneBarData}>
                  <XAxis dataKey="zone" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="slots" fill="#059669" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Honest Data Disclosure */}
      <div className="rounded-xl border border-charcoal-200 bg-charcoal-50/70 p-4 text-xs text-charcoal-600 flex items-start gap-3">
        <Info className="w-4 h-4 text-charcoal-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-charcoal-800">Academic Project Note on Analytics</p>
          <p className="text-[11px] text-charcoal-500 leading-relaxed">
            All graphs and percentages above are computed directly from active PostgreSQL rows. ParkSense adheres strictly to honest data reporting—no synthetic historical trends or fabricated charts are simulated.
          </p>
        </div>
      </div>
    </div>
  )
}
