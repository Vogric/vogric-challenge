import { z } from 'zod'

/**
 * Audit metadata is intentionally `unknown` at the database boundary: it is a
 * JSON column that may contain historical or forward-compatible event shapes.
 * Parse it immediately into this narrow, optional contract before rendering.
 */
export const auditMetadataSchema = z
  .object({
    from: z.string().min(1).optional(),
    to: z.string().min(1).optional(),
    title: z.string().min(1).optional(),
    targetUserId: z.string().min(1).optional(),
  })
  .passthrough()

export type AuditMetadata = z.infer<typeof auditMetadataSchema>

export function parseAuditMetadata(value: unknown): AuditMetadata | null {
  const parsed = auditMetadataSchema.safeParse(value)
  return parsed.success ? parsed.data : null
}
