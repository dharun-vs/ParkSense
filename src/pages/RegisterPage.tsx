import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signUp } from '@/features/auth/authService'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Lock, Mail, User, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react'

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate()

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (displayName.trim().length < 2) {
      setError('Please provide your full name (at least 2 characters).')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    try {
      setIsLoading(true)
      await signUp(email, password, displayName.trim())
      setSuccess(true)
      setTimeout(() => {
        navigate('/dashboard')
      }, 1500)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Please try again.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-charcoal-50/70 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-charcoal-200/80 shadow-md p-6 sm:p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white font-extrabold text-2xl shadow-sm mb-2">
            P
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-charcoal-900">
            Create a ParkSense Account
          </h1>
          <p className="text-xs text-charcoal-500">
            Join ParkSense to find slots, reserve ahead, and park seamlessly.
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center space-y-2">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-emerald-900">Registration Successful!</p>
            <p className="text-xs text-emerald-700">Redirecting to your ParkSense dashboard...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="text"
                label="Full Name"
                placeholder="Alex Morgan"
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
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                leftIcon={<Mail className="w-4 h-4" />}
              />
            </div>

            <div>
              <Input
                type="password"
                label="Password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                helperText="Must be at least 8 characters"
                leftIcon={<Lock className="w-4 h-4" />}
              />
            </div>

            <div>
              <Input
                type="password"
                label="Confirm Password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                leftIcon={<Lock className="w-4 h-4" />}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Create Account
            </Button>
          </form>
        )}

        <div className="text-center text-xs text-charcoal-500 pt-2 border-t border-charcoal-100">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-emerald-600 hover:text-emerald-700 underline">
            Sign in to existing account
          </Link>
        </div>
      </div>
    </div>
  )
}
