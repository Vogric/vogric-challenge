'use client'

import { m, useReducedMotion } from 'framer-motion'
import { StatCard, type StatCardProps } from '@/components/dashboard/stat-card'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export function StatsGrid({ stats }: { stats: StatCardProps[] }) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <m.div
      variants={container}
      initial={shouldReduceMotion ? false : 'hidden'}
      animate="show"
      className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
    >
      {stats.map((stat) => (
        <m.div key={stat.valueTestId} variants={item}>
          <StatCard {...stat} />
        </m.div>
      ))}
    </m.div>
  )
}
