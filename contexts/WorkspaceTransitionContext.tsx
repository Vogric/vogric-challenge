'use client'

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

type WorkspaceTransitionContextValue = {
  isSwitching: boolean
  begin: () => void
  end: () => void
}

const WorkspaceTransitionContext = createContext<WorkspaceTransitionContextValue | undefined>(
  undefined
)

export function WorkspaceTransitionProvider({ children }: { children: ReactNode }) {
  const [isSwitching, setIsSwitching] = useState(false)

  const begin = useCallback(() => setIsSwitching(true), [])
  const end = useCallback(() => setIsSwitching(false), [])

  const value = useMemo(
    () => ({ isSwitching, begin, end }),
    [isSwitching, begin, end]
  )

  return (
    <WorkspaceTransitionContext.Provider value={value}>
      {children}
    </WorkspaceTransitionContext.Provider>
  )
}

export function useWorkspaceTransition() {
  const context = useContext(WorkspaceTransitionContext)
  if (!context) {
    throw new Error('useWorkspaceTransition must be used within WorkspaceTransitionProvider')
  }
  return context
}
