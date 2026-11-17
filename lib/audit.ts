import type { Prisma } from '@prisma/client'
import { db } from '@/lib/db'

type AuditInput = {
  organizationId: string
  actorId: string
  action: string
  entityType: string
  entityId?: string | null
  metadata?: Record<string, unknown>
}

/**
 * Records a tenant-scoped audit event. Passing a transaction client keeps the
 * event in the same transaction as the mutation it describes.
 */
export async function recordAuditEvent(
  input: AuditInput,
  tx?: Prisma.TransactionClient
): Promise<void> {
  const client = tx ?? db

  await client.auditEvent.create({
    data: {
      organizationId: input.organizationId,
      actorId: input.actorId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      ...(input.metadata !== undefined
        ? { metadata: input.metadata as Prisma.InputJsonValue }
        : {}),
    },
  })
}
