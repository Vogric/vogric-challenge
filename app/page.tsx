export const dynamic = 'force-dynamic'

import { LandingHeroPanel } from '@/app/_components/landing-hero-panel'
import { LandingPreviewPanel } from '@/app/_components/landing-preview-panel'
import { LandingInsideSection } from '@/app/_components/landing-inside-section'

/**
 * Landing page. The three panels live in `app/_components` so this route stays
 * within the 100-line page budget enforced by `scripts/check-page-size.mjs`.
 */
export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[minmax(380px,0.78fr)_1.22fr]">
        <LandingHeroPanel />
        <LandingPreviewPanel />
      </div>
      <LandingInsideSection />
    </main>
  )
}
