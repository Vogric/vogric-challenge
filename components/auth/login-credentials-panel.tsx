'use client'

import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { useRef, useState, type FormEvent } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoginFormAside } from '@/components/auth/login-form-aside'
import { LoginSubmitButton } from '@/components/auth/login-submit-button'
import { authKeys } from '@/lib/query-keys'
import { loginResponseSchema, loginSchema } from '@/lib/validations/auth'

/**
 * Sign-in form and its submit flow. Extracted from `login-form.tsx` so the
 * interactive logic stays in one focused client component.
 */
export function LoginCredentialsPanel() {
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

          <LoginSubmitButton isSubmitting={isSubmitting} />
        </form>

        <LoginFormAside />
      </div>
    </section>
  )
}
