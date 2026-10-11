import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import { DEMO_ACCOUNTS } from '@/features/auth/authService'
import { ParkSenseLogo } from '@/components/ui/ParkSenseLogo'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Lock, User, AlertCircle, ArrowRight, Shield, UserCheck, CheckCircle2, Car, Layers, CalendarCheck } from 'lucide-react'

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname

  const { signIn, user, profile, isLoading: isAuthLoading } = useAuth()

  const [usernameOrEmail, setUsernameOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // If already authenticated and not in a loading or submit state, redirect to destination
  useEffect(() => {
    if (!isAuthLoading && user && profile && !isLoading) {
      if (from) {
        navigate(from, { replace: true })
      } else if (profile.role === 'admin') {
        navigate(DEMO_ACCOUNTS.admin.defaultPath, { replace: true })
      } else {
        navigate(DEMO_ACCOUNTS.customer.defaultPath, { replace: true })
      }
    }
  }, [user, profile, isAuthLoading, isLoading, from, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!usernameOrEmail.trim() || !password) {
      setError('Please provide both username/email and password.')
      return
    }

    try {
      setIsLoading(true)
      const { profile: loggedInProfile } = await signIn(usernameOrEmail, password)

      if (from) {
        navigate(from, { replace: true })
      } else if (loggedInProfile?.role === 'admin') {
        navigate(DEMO_ACCOUNTS.admin.defaultPath, { replace: true })
      } else {
        navigate(DEMO_ACCOUNTS.customer.defaultPath, { replace: true })
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid username/email or password. Please try again.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  const fillDemoCredentials = (role: 'admin' | 'customer') => {
    if (role === 'admin') {
      setUsernameOrEmail('admin')
      setPassword('admin')
    } else {
      setUsernameOrEmail('customer')
      setPassword('1234')
    }
    setError(null)
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F4F7FB]">
      {/* ── Brand Showcase (Left side on desktop matching Screen 1) ── */}
      <div className="lg:w-1/2 bg-[#0B1B3D] text-white p-8 lg:p-14 flex flex-col justify-between relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center lg:items-start text-center lg:text-left my-auto space-y-8 py-8">
          <div className="space-y-1">
            <ParkSenseLogo theme="dark" variant="full" size="lg" />
            <p className="text-[11px] text-slate-400 font-medium">Intelligent Parking Architecture & Real-Time Bays</p>
          </div>

          {/* 3 Reference Feature Items with green rounded square icons */}
          <div className="w-full max-w-sm space-y-5 pt-4 text-left">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-[#10B981]/20 border border-[#10B981]/40 flex items-center justify-center text-[#10B981] shrink-0">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Find available parking</p>
                <p className="text-xs text-slate-400">Real-time space availability</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-[#10B981]/20 border border-[#10B981]/40 flex items-center justify-center text-[#10B981] shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Check in & out</p>
                <p className="text-xs text-slate-400">Quick and easy process</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-[#10B981]/20 border border-[#10B981]/40 flex items-center justify-center text-[#10B981] shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Manage with confidence</p>
                <p className="text-xs text-slate-400">Safe, secure, and reliable</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 pt-6 text-xs text-slate-400 flex items-center justify-between border-t border-white/10">
          <span>Campus Parking System v2.0</span>
          <span>Operational Ready</span>
        </div>
      </div>

      {/* ── Sign-in Panel (Right side) ── */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-6">
          {/* Header on mobile */}
          <div className="lg:hidden text-center pb-2">
            <div className="inline-block">
              <ParkSenseLogo theme="light" variant="full" size="md" />
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-[#0B1B3D]">Welcome Back</h2>
            <p className="text-xs text-[#66758A]">
              Sign in to your ParkSense account. Welcome to ParkSense.
            </p>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="text"
                label="Username or Email"
                placeholder="Enter username or email"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                required
                autoCapitalize="none"
                autoCorrect="off"
                leftIcon={<User className="w-4 h-4 text-slate-400" />}
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
                leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full bg-[#165DFB] hover:bg-[#1249c7] text-white font-semibold py-2.5 shadow-sm rounded-xl"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In
            </Button>
          </form>

          {/* Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200" />
            <span className="flex-shrink mx-3 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
              COLLEGE DEMO ACCESS
            </span>
            <div className="flex-grow border-t border-slate-200" />
          </div>

          <p className="text-[11px] text-[#66758A] text-center">
            Pre-configured evaluation accounts. Click to load demo credentials:
          </p>

          {/* Reference Demo Quick-Access Buttons */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => fillDemoCredentials('customer')}
              className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-[#0B1B3D] flex items-center justify-between hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#10B981]" />
                <span>Customer Demo Account</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400 font-normal">customer / 1234</span>
            </button>

            <button
              type="button"
              onClick={() => fillDemoCredentials('admin')}
              className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-[#0B1B3D] flex items-center justify-between hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#0B1B3D]" />
                <span>Admin Demo Account</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400 font-normal">admin / admin</span>
            </button>
          </div>

          <div className="text-center text-xs text-[#66758A] pt-2 border-t border-slate-200">
            New to ParkSense?{' '}
            <Link to="/register" className="font-semibold text-[#165DFB] hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
