import { LoginBrandPanel } from '@/components/auth/login-brand-panel'
import { LoginCredentialsPanel } from '@/components/auth/login-credentials-panel'

/**
 * Sign-in screen. The brand column is a Server Component; only the credentials
 * panel is interactive, so that is the only part that ships as client JS.
 */
export function LoginForm() {
  return (
    <main className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[minmax(380px,0.9fr)_1.1fr]">
      <LoginBrandPanel />
      <LoginCredentialsPanel />
    </main>
  )
}
