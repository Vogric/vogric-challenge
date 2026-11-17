import { ArrowDown, ArrowUp, CornerDownLeft } from 'lucide-react'

export function CommandFooter() {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/30 px-4 py-2.5 text-[10px] text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <ArrowUp className="h-3 w-3" aria-hidden="true" />
        <ArrowDown className="h-3 w-3" aria-hidden="true" />
        navigate
      </span>
      <span className="inline-flex items-center gap-1.5">
        <CornerDownLeft className="h-3 w-3" aria-hidden="true" />
        open
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="rounded border border-border bg-card px-1 py-0.5 font-mono">esc</span>
        close
      </span>
    </div>
  )
}
