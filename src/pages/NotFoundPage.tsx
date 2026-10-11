import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Compass, Home } from 'lucide-react'

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-charcoal-50 p-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-2xl mb-4">
        404
      </div>
      <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 tracking-tight">
        Page Not Found
      </h1>
      <p className="text-xs sm:text-sm text-charcoal-500 max-w-sm mt-2 mb-6">
        The parking page or resource you are looking for does not exist or has been relocated.
      </p>
      <div className="flex items-center gap-3">
        <Link to="/dashboard">
          <Button variant="primary" size="md" leftIcon={<Home className="w-4 h-4" />}>
            Go to Dashboard
          </Button>
        </Link>
        <Link to="/parking">
          <Button variant="outline" size="md" leftIcon={<Compass className="w-4 h-4" />}>
            Parking Map
          </Button>
        </Link>
      </div>
    </div>
  )
}
