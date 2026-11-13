import type { Prisma } from '@prisma/client'
import { db } from '@/lib/db'

const MAX_ATTEMPTS = 3

/**
 * Prisma surfaces a Postgres serialization failure (40001) or deadlock (40P01)
 * as `P2034`. Under `Serializable` that error is *expected* under contention and
 * the documented remedy is to retry the whole transaction.
 */
function isWriteConflict(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'P2034'
  )
}

/**
 * Runs an interactive transaction at `Serializable` isolation and retries on
 * write conflicts.
 *
 * Why this exists: `Serializable` is the only isolation level that makes the
 * "last admin" check safe (the count and the update must be one unit), but it
 * trades a silent race for a loud exception. Without a retry the trade is a bad
 * one: a legitimate concurrent request turns into a 500 for the user. With the
 * retry, contention costs a few milliseconds instead of a failed request.
 *
 * The bound is deliberately small. If three consecutive attempts lose a write
 * race, the contention is not transient and the caller should see the error.
 */
export async function runSerializable<T>(
  operation: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  let lastError: unknown

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      return await db.$transaction(operation, { isolationLevel: 'Serializable' })
    } catch (error) {
      lastError = error
      if (!isWriteConflict(error)) throw error
    }
  }

  throw lastError
}
