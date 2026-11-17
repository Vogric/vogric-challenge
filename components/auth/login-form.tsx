'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { useRef, useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowUpRight, Loader2, LockKeyhole } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authKeys } from '@/lib/query-keys'
import { loginResponseSchema, loginSchema } from '@/lib/validations/auth'

export function LoginForm() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const parsed = loginSchema.safeParse({ email, password })
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors
      setError(fieldErrors.email?.[0] ?? fieldErrors.password?.[0] ?? 'Invalid input')
      if (fieldErrors.email) emailRef.current?.focus()
      else passwordRef.current?.focus()
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      })

      if (res.status === 401) {
        setError('Invalid credentials')
        return
      }

      if (!res.ok) {
        setError('Authentication error. Please try again.')
        return
      }

      const data = loginResponseSchema.parse(await res.json())
      queryClient.setQueryData(authKeys.currentUser, data.user)
      await router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Authentication error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[minmax(380px,0.9fr)_1.1fr]">
      <section className="relative flex flex-col justify-between bg-sidebar px-6 py-7 text-sidebar-foreground sm:px-10 lg:px-14 lg:py-12">
        <div>
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
              V
            </span>
            <span className="font-semibold tracking-tight">Vogric Ops</span>
          </Link>

          <div className="mt-16 max-w-md lg:mt-24">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-muted">
              Editorial Ops / secure access
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-5xl">
              Welcome back to the control room.
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-6 text-sidebar-muted">
              Sign in to the Acme Corp workspace. Roles, tenant scope and session
              revocation are resolved server-side.
            </p>

            <div className="mt-10 rounded-xl border border-sidebar-border bg-white/[0.04] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-muted">
                Demo access
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px]">
                <span>demo@example.com</span>
                <span className="text-sidebar-muted">/</span>
                <span>password123</span>
              </div>
              <p className="mt-2 text-[11px] leading-5 text-sidebar-muted">
                Use the demo account to explore all three tenant roles.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-between gap-3 border-t border-sidebar-border pt-4 text-[10px] uppercase tracking-[0.12em] text-sidebar-muted">
          <Link href="/" className="inline-flex items-center gap-1.5 transition-colors hover:text-sidebar-foreground">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to overview
          </Link>
          <span className="inline-flex items-center gap-1.5">
            <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
            HttpOnly · revocable
          </span>
        </div>
      </section>

      <section className="flex items-center justify-center p-6 sm:p-10 lg:p-14">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Workspace access
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Sign in</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Use your organization credentials to continue.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              id="login-error"
              className="mb-5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
            >
              {error}
            </div>
          )}

          <form
            id="login-form"
            className="space-y-5"
            onSubmit={(event) => {
              void handleSubmit(event)
            }}
            noValidate
            aria-busy={isSubmitting}
          >
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="user@company.com"
                autoComplete="email"
                autoFocus
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'login-error' : undefined}
                disabled={isSubmitting}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                ref={emailRef}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder={'\u2022'.repeat(8)}
                autoComplete="current-password"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'login-error' : undefined}
                disabled={isSubmitting}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                ref={passwordRef}
              />
            </div>

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
          </form>

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
        </div>
      </section>
    </main>
  )
}
