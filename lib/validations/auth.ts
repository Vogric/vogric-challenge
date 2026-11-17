import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Minimum 8 characters'),
})


export const authUserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  name: z.string().nullable().optional(),
})

export const currentUserResponseSchema = z.object({
  user: authUserSchema.nullable(),
})

export const loginResponseSchema = z.object({
  user: authUserSchema,
})

export type AuthUser = z.infer<typeof authUserSchema>
