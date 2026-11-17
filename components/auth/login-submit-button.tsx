import { ArrowUpRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Submit control for the sign-in form. Isolated so the credentials panel stays
 * focused on data flow and within the 150-line module budget.
 */
export function LoginSubmitButton({ isSubmitting }: { isSubmitting: boolean }) {
  return (
    <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
      {isSubmitting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          Signing in...
        </>
      ) : (
        <>
          Sign in to workspace
          <ArrowUpRight className="ml-2 h-4 w-4" aria-hidden="true" />
        </>
      )}
    </Button>
  )
}
