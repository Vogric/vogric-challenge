'use client'

import { m, useReducedMotion } from 'framer-motion'
import { StatCard, type StatCardProps } from '@/components/dashboard/stat-card'

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1 },
  },
}

const item = {
  hidden: { y: 16 },
  show: {
    y: 0,
    transition: { type: 'spring' as const, stiffness: 260, damping: 24 },
  },
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
