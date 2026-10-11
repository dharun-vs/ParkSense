import { z } from 'zod'

export const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, 'Please enter your username or email'),
  password: z.string().min(1, 'Please enter your password'),
})

export const registerSchema = z.object({
  display_name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be at most 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const bookingSchema = z.object({
  parking_slot_id: z.string().uuid('Invalid slot selected'),
  start_time: z.string().refine((val) => {
    return new Date(val) > new Date()
  }, 'Start time must be in the future'),
  end_time: z.string(),
  vehicle_plate: z
    .string()
    .max(20, 'Vehicle plate too long')
    .optional()
    .or(z.literal('')),
  notes: z.string().max(200, 'Notes too long').optional().or(z.literal('')),
}).refine((data) => {
  return new Date(data.end_time) > new Date(data.start_time)
}, {
  message: 'End time must be after start time',
  path: ['end_time'],
})

export const slotSchema = z.object({
  label: z
    .string()
    .min(1, 'Label is required')
    .max(10, 'Label too long')
    .toUpperCase(),
  zone: z.string().min(1, 'Zone is required').max(20, 'Zone too long'),
  slot_type: z.string().min(1, 'Type is required'),
  is_active: z.boolean(),
  notes: z.string().max(200, 'Notes too long').optional().or(z.literal('')),
})

export const profileSchema = z.object({
  display_name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be at most 50 characters'),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type BookingFormData = z.infer<typeof bookingSchema>
export type SlotFormData = z.infer<typeof slotSchema>
export type ProfileFormData = z.infer<typeof profileSchema>
