'use client'

import { ErrorCard } from '@/components/error-card'

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorCard reset={reset} />
}
