import { describe, it, expect } from 'vitest'
import {
  loginSchema,
  registerSchema,
  bookingSchema,
} from '@/lib/validation/schemas'

describe('loginSchema', () => {
  it('validates email and password', () => {
    const result = loginSchema.safeParse({
      usernameOrEmail: 'alex@example.com',
      password: 'password123',
    })
    expect(result.success).toBe(true)
  })

  it('validates admin username and demo password', () => {
    const result = loginSchema.safeParse({
      usernameOrEmail: 'admin',
      password: 'admin',
    })
    expect(result.success).toBe(true)
  })

  it('validates customer username and demo password', () => {
    const result = loginSchema.safeParse({
      usernameOrEmail: 'customer',
      password: '1234',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty username or email', () => {
    const result = loginSchema.safeParse({
      usernameOrEmail: '',
      password: 'password123',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({
      usernameOrEmail: 'admin',
      password: '',
    })
    expect(result.success).toBe(false)
  })
})

describe('registerSchema', () => {
  it('validates a strong registration payload', () => {
    const result = registerSchema.safeParse({
      display_name: 'Alex Hunter',
      email: 'alex@example.com',
      password: 'StrongPassword123',
      confirmPassword: 'StrongPassword123',
    })
    expect(result.success).toBe(true)
  })

  it('rejects when confirmPassword does not match', () => {
    const result = registerSchema.safeParse({
      display_name: 'Alex Hunter',
      email: 'alex@example.com',
      password: 'StrongPassword123',
      confirmPassword: 'DifferentPassword123',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Passwords do not match')
    }
  })

  it('rejects passwords without a number', () => {
    const result = registerSchema.safeParse({
      display_name: 'Alex Hunter',
      email: 'alex@example.com',
      password: 'StrongPassword',
      confirmPassword: 'StrongPassword',
    })
    expect(result.success).toBe(false)
  })
})

describe('bookingSchema', () => {
  const futureStart = new Date(Date.now() + 3600 * 1000 * 2).toISOString()
  const futureEnd = new Date(Date.now() + 3600 * 1000 * 4).toISOString()

  it('accepts valid future reservation payload', () => {
    const result = bookingSchema.safeParse({
      parking_slot_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      start_time: futureStart,
      end_time: futureEnd,
      vehicle_plate: 'KA-01-AB-1234',
    })
    expect(result.success).toBe(true)
  })

  it('rejects reservation where end time is before start time', () => {
    const result = bookingSchema.safeParse({
      parking_slot_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      start_time: futureEnd,
      end_time: futureStart,
    })
    expect(result.success).toBe(false)
  })
})
