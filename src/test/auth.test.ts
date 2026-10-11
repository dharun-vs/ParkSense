import { describe, it, expect, vi } from 'vitest'
import {
  resolveLoginIdentifier,
  DEMO_ACCOUNTS,
  signIn,
} from '@/features/auth/authService'
import { supabase } from '@/lib/supabase'

describe('resolveLoginIdentifier', () => {
  it('resolves "admin" username to admin demo email', () => {
    expect(resolveLoginIdentifier('admin')).toBe(DEMO_ACCOUNTS.admin.email)
  })

  it('resolves case-insensitive and trimmed "  ADMIN  " to admin demo email', () => {
    expect(resolveLoginIdentifier('  ADMIN  ')).toBe(DEMO_ACCOUNTS.admin.email)
  })

  it('resolves "customer" username to customer demo email', () => {
    expect(resolveLoginIdentifier('customer')).toBe(DEMO_ACCOUNTS.customer.email)
  })

  it('resolves case-insensitive and trimmed "  Customer  " to customer demo email', () => {
    expect(resolveLoginIdentifier('  Customer  ')).toBe(DEMO_ACCOUNTS.customer.email)
  })

  it('preserves standard email addresses without misidentifying as username', () => {
    expect(resolveLoginIdentifier('driver@example.com')).toBe('driver@example.com')
    expect(resolveLoginIdentifier('alex.smith@parksense.com')).toBe('alex.smith@parksense.com')
  })

  it('does NOT mistake email containing "admin" or "customer" for demo aliases', () => {
    expect(resolveLoginIdentifier('admin@company.com')).toBe('admin@company.com')
    expect(resolveLoginIdentifier('customer@support.org')).toBe('customer@support.org')
  })

  it('handles empty input gracefully', () => {
    expect(resolveLoginIdentifier('')).toBe('')
    expect(resolveLoginIdentifier('   ')).toBe('')
  })
})

describe('Demo Accounts Configuration & Redirects', () => {
  it('configures admin account with /admin redirect', () => {
    expect(DEMO_ACCOUNTS.admin.username).toBe('admin')
    expect(DEMO_ACCOUNTS.admin.role).toBe('admin')
    expect(DEMO_ACCOUNTS.admin.defaultPath).toBe('/admin')
  })

  it('configures customer account with /dashboard redirect', () => {
    expect(DEMO_ACCOUNTS.customer.username).toBe('customer')
    expect(DEMO_ACCOUNTS.customer.role).toBe('user')
    expect(DEMO_ACCOUNTS.customer.defaultPath).toBe('/dashboard')
  })
})

describe('signIn authentication error handling', () => {
  it('throws a generic error when credentials fail without leaking account existence', async () => {
    vi.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { name: 'AuthApiError', message: 'Invalid login credentials', status: 400 },
    } as any)

    await expect(signIn('nonexistent', 'wrongpass')).rejects.toThrow(
      'Invalid username/email or password. Please try again.'
    )
  })

  it('returns verified server-side profile role upon successful authentication', async () => {
    vi.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValueOnce({
      data: {
        user: { id: 'admin-user-uuid', email: 'admin@parksense.demo' },
        session: { access_token: 'valid-token' },
      },
      error: null,
    } as any)

    vi.spyOn(supabase, 'from').mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          single: async () => ({
            data: { id: 'admin-user-uuid', display_name: 'Admin', role: 'admin' },
            error: null,
          }),
        }),
      }),
    } as any)

    const result = await signIn('admin', 'admin')
    expect(result.profile?.role).toBe('admin')
  })
})
