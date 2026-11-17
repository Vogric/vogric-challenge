import { ChevronDown } from 'lucide-react'
import type { MembershipSummary } from '@/types/organizations'
import { memberInitials, ROLE_META, ROLE_OPTIONS, type Member } from './members-table-model'

type MemberRowProps = {
  member: Member
  role: MembershipSummary['role']
  canManage: boolean
  isPending: boolean
  isCurrentUser: boolean
  onChange: (member: Member, role: MembershipSummary['role']) => void
}

export function MemberRow({
  member,
  role,
  canManage,
  isPending,
  isCurrentUser,
  onChange,
}: MemberRowProps) {
  const meta = ROLE_META[role]

  return (
    <tr
      aria-busy={isPending}
      className={`border-b transition-colors duration-150 last:border-0 hover:bg-muted/40 ${
        isPending ? 'opacity-60' : ''
      }`}
    >
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${meta.avatar}`}
            aria-hidden="true"
          >
            {memberInitials(member)}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate font-medium">{member.user.name ?? 'Unnamed user'}</p>
              {isCurrentUser && (
                <span className="rounded-full border border-border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  You
                </span>
              )}
            </div>
            <p className="truncate text-xs text-muted-foreground">{member.user.email}</p>
          </div>
        </div>
      </td>
      <td className="hidden whitespace-nowrap px-5 py-4 text-xs text-muted-foreground sm:table-cell">
        {new Date(member.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}
      </td>
      <td className="px-5 py-4">
        <span className={`relative inline-flex items-center rounded-full border ${meta.select}`}>
          <select
            aria-label={`Role for ${member.user.email}`}
            value={role}
            disabled={!canManage || isPending}
            onChange={(event) =>
              onChange(member, event.target.value as MembershipSummary['role'])
            }
            className="cursor-pointer appearance-none bg-transparent py-1 pl-2.5 pr-7 text-xs font-semibold uppercase tracking-[0.06em] outline-none disabled:cursor-not-allowed"
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value} className="text-foreground">
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-2 h-3 w-3 opacity-60"
            aria-hidden="true"
          />
        </span>
        <p className="mt-1 text-[10px] text-muted-foreground">
          {isPending ? 'Updating...' : meta.description}
        </p>
      </td>
    </tr>
  )
}
