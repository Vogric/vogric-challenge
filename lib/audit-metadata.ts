import { z } from 'zod'
import { taskStatusSchema } from '@/lib/validations/tasks'

const roleSchema = z.enum(['ADMIN', 'MANAGER', 'VIEWER'])

export const taskStatusChangedMetadataSchema = z
  .object({
    from: taskStatusSchema,
    to: taskStatusSchema,
    title: z.string().min(1),
  })
  .strict()

export const membershipRoleChangedMetadataSchema = z
  .object({
    targetUserId: z.string().min(1),
    from: roleSchema,
    to: roleSchema,
  })
  .strict()

export type TaskStatusChangedMetadata = z.infer<typeof taskStatusChangedMetadataSchema>
export type MembershipRoleChangedMetadata = z.infer<typeof membershipRoleChangedMetadataSchema>

export type ParsedAuditMetadata =
  | ({ kind: 'task.status_changed' } & TaskStatusChangedMetadata)
  | ({ kind: 'membership.role_changed' } & MembershipRoleChangedMetadata)
  | { kind: 'unknown'; raw: Record<string, unknown> }

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

/**
 * Parses the JSON boundary into an action-specific union. Unknown actions keep
 * a typed raw record for the forensic details panel instead of leaking
 * `unknown` into the UI.
 */
export function parseAuditMetadata(action: string, value: unknown): ParsedAuditMetadata | null {
  const record = asRecord(value)
  if (!record) return null

  if (action === 'task.status_changed') {
    const parsed = taskStatusChangedMetadataSchema.safeParse(record)
    return parsed.success ? { kind: action, ...parsed.data } : { kind: 'unknown', raw: record }
  }

  if (action === 'membership.role_changed') {
    const parsed = membershipRoleChangedMetadataSchema.safeParse(record)
    return parsed.success ? { kind: action, ...parsed.data } : { kind: 'unknown', raw: record }
  }

  return { kind: 'unknown', raw: record }
}
