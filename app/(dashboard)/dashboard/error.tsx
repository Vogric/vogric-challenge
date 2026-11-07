'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <Card className="w-full max-w-md p-8 shadow-sm">
      <CardHeader>
        <CardTitle>Something went wrong</CardTitle>
        <CardDescription>{error.message}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={reset} className="w-full">
          Try again
        </Button>
      </CardContent>
    </Card>
  )
}
