'use client'

import React, { useCallback } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'

type Row = {
  id: string
  title: string
  status: 'todo' | 'in_progress' | 'done'
  updatedAt: string
}

type OnStatusChange = (id: string, status: 'todo' | 'in_progress' | 'done') => void

const ROW_HEIGHT = 40
const OVERSCAN = 10

export function VirtualizedTable({ items, onStatusChange }: { items: Row[]; onStatusChange: OnStatusChange }) {
  const parentRef = React.useRef<HTMLDivElement>(null)

  const virtualRowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: OVERSCAN,
  })

  const totalHeight = items.length * ROW_HEIGHT

  const handleScroll = useCallback(() => {
    virtualRowVirtualizer.measure()
  }, [virtualRowVirtualizer])

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm">
      <div
        ref={parentRef}
        className="overflow-y-auto h-96"
        style={{ position: 'relative' }}
        onScroll={handleScroll}
      >
        <div style={{ height: totalHeight, position: 'relative' }} className="w-full">
          <div className="absolute left-0 right-0" style={{ transform: `translateY(${virtualRowVirtualizer.scrollOffset}px)` }}>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b text-muted-foreground sticky top-0 bg-background z-10">
                  <th className="pb-3 font-medium">ID</th>
                  <th className="pb-3 font-medium">Title</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Updated At</th>
                </tr>
              </thead>
              <tbody>
                {virtualRowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const row = items[virtualRow.index]
                  return (
                    <tr
                      key={row.id}
                      className="border-b hover:bg-accent/50 transition-colors"
                      style={{
                        height: virtualRow.size,
                        transform: `translateY(${virtualRow.start}px)`,
                        display: 'block',
                        width: '100%',
                      }}
                    >
                      <td className="pb-3 text-muted-foreground">{row.id}</td>
                      <td className="pb-3">{row.title}</td>
                      <td className="pb-3">
                        <select
                          value={row.status}
                          onChange={(e) => {
                            const newStatus = e.target.value as 'todo' | 'in_progress' | 'done'
                            onStatusChange(row.id, newStatus)
                          }}
                          className="rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="done">Done</option>
                        </select>
                      </td>
                      <td className="pb-3 text-muted-foreground text-sm">{row.updatedAt}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
