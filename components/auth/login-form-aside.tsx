import Link from 'next/link'
import { LockKeyhole } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'

/**
 * Closing note and escape hatch under the sign-in form: the session guarantee
 * and the link back to the landing page.
 */
export function LoginFormAside() {
  return (
    <>
      <div className="mt-6 flex items-start gap-2 border-t border-border pt-4 text-[11px] leading-5 text-muted-foreground">
        <LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <p>
          Sessions are revoked server-side. The login endpoint is rate-limited
          before password hashing.
        </p>
      </div>

      <Link
        href="/"
        className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'mt-3' })}
      >
        Back to overview
      </Link>
    </>
  )
}
