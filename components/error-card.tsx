'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function ErrorCard({ reset }: { reset: () => void }) {
  return (
    <Card className="w-full max-w-md p-8 shadow-sm">
      <CardHeader>
        <CardTitle>Something went wrong</CardTitle>
        <CardDescription>Please try again. If the problem persists, contact support.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={reset} className="w-full">
          Try again
        </Button>
      </CardContent>
    </Card>
  )
}
