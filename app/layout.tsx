import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { Providers } from './providers'
import { WebVitals } from '@/components/web-vitals'
import { THEME_BOOTSTRAP } from '@/lib/theme'

export const metadata: Metadata = {
  title: 'Vogric Ops — Multi-tenant dashboard',
  description: 'Multi-tenant operations dashboard built with Next.js and Prisma',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get('x-nonce') ?? undefined

  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body className="font-sans">
        <Providers>
          <a
            href="#main-content"
            className="sr-only rounded-md bg-card px-4 py-2 font-semibold text-foreground shadow-sm focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
          >
            Skip to main content
          </a>
          <main id="main-content">{children}</main>
        </Providers>
        <WebVitals />
      </body>
    </html>
  )
}
