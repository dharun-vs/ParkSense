import React, { useState } from 'react'
import { useAuth } from '@/features/auth/AuthContext'
import { updateProfile } from '@/features/auth/authService'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { User, Mail, Shield, CheckCircle2, AlertCircle, Info } from 'lucide-react'

export const ProfilePage: React.FC = () => {
  const { user, profile, refreshProfile, isAdmin } = useAuth()
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [isSaving, setIsSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSuccessMessage(null)
    setErrorMessage(null)

    if (displayName.trim().length < 2) {
      setErrorMessage('Name must be at least 2 characters.')
      return
    }

    try {
      setIsSaving(true)
      await updateProfile(user.id, { display_name: displayName.trim() })
      await refreshProfile()
      setSuccessMessage('Profile name updated successfully.')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile.'
      setErrorMessage(msg)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="pb-2 border-b border-charcoal-200/80">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 tracking-tight">
          User Account & Profile
        </h1>
        <p className="text-xs sm:text-sm text-charcoal-500 mt-1">
          Manage your personal details and view your ParkSense permissions.
        </p>
      </div>

      {successMessage && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-charcoal-200/80 shadow-xs p-6 space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-charcoal-100">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 font-extrabold text-2xl flex items-center justify-center border border-emerald-200">
            {profile?.display_name ? profile.display_name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-charcoal-900">
              {profile?.display_name || 'ParkSense User'}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-charcoal-500">{user?.email}</span>
              <Badge variant={isAdmin ? 'emerald' : 'charcoal'} size="sm">
                {isAdmin ? 'Administrator' : 'Standard User'}
              </Badge>
            </div>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <Input
              type="text"
              label="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              leftIcon={<User className="w-4 h-4" />}
            />
          </div>

          <div>
            <Input
              type="email"
              label="Email Address"
              value={user?.email || ''}
              disabled
              helperText="Email cannot be changed directly in the demo."
              leftIcon={<Mail className="w-4 h-4" />}
            />
          </div>

          <div className="pt-2">
            <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
              Save Profile Changes
            </Button>
          </div>
        </form>
      </div>

      {/* Role & Security Card */}
      <div className="bg-white rounded-2xl border border-charcoal-200/80 shadow-xs p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-charcoal-900">Security & Role Isolation</h3>
        </div>
        <p className="text-xs text-charcoal-600 leading-relaxed">
          ParkSense enforces strict role-based access control. All new accounts receive the standard{' '}
          <code className="bg-charcoal-100 px-1 py-0.5 rounded text-charcoal-800">user</code> role by default.
          To prevent unauthorized privilege escalation, roles cannot be modified via client-side requests.
        </p>

        <div className="rounded-xl bg-charcoal-50 border border-charcoal-200 p-3.5 text-xs text-charcoal-600 space-y-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-charcoal-800">
            <Info className="w-3.5 h-3.5 text-charcoal-500" />
            <span>Promoting an Administrator (College Demo Instruction)</span>
          </div>
          <p className="text-[11px] text-charcoal-500 leading-relaxed">
            In your Supabase SQL editor, run:{' '}
            <code className="block bg-charcoal-900 text-emerald-400 p-2 rounded-lg font-mono text-[10px] mt-1 overflow-x-auto">
              UPDATE profiles SET role = 'admin' WHERE id = '{user?.id || 'YOUR_USER_ID'}';
            </code>
          </p>
        </div>
      </div>
    </div>
  )
}
