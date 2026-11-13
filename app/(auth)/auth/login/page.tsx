import { redirect } from 'next/navigation'
import { LoginForm } from '@/components/auth/login-form'
import { getRequestUser } from '@/lib/request-user'

export const dynamic = 'force-dynamic'

/**
 * The redirect for an already-authenticated visitor lives here rather than in the
 * middleware. The middleware only knows whether a cookie exists; an expired
 * cookie would bounce the user between /auth/login and /dashboard forever. Here
 * the session is actually resolved, so "already signed in" means signed in.
 */
export default async function LoginPage() {
  const user = await getRequestUser()
  if (user) redirect('/dashboard')

  return <LoginForm />
}
