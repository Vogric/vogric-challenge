import { z } from 'zod'

const optionalUrl = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().url().optional()
)

export const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  NODE_ENV: z.enum(['development', 'test', 'production']).optional(),
  UPSTASH_REDIS_REST_URL: optionalUrl,
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
})

export type ValidatedEnv = z.infer<typeof envSchema>

export function validateEnv(source: Record<string, string | undefined> = process.env): ValidatedEnv {
  const parsed = envSchema.safeParse(source)
  if (!parsed.success) {
    const fields = Object.entries(parsed.error.flatten().fieldErrors)
      .map(([field, errors]) => `${field}: ${errors?.join(', ')}`)
      .join('; ')
    throw new Error(`Invalid environment configuration: ${fields}`)
  }
  return parsed.data
}
