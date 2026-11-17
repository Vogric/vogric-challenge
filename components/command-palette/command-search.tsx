import type { RefObject } from 'react'
import { Search, X } from 'lucide-react'

type CommandSearchProps = {
  inputRef: RefObject<HTMLInputElement | null>
  closeButtonRef: RefObject<HTMLButtonElement | null>
  query: string
  activeOptionId?: string
  onChange: (value: string) => void
  onClose: () => void
}

export function CommandSearch({
  inputRef,
  closeButtonRef,
  query,
  activeOptionId,
  onChange,
  onClose,
}: CommandSearchProps) {
  return (
    <div className="command-search-row flex items-center gap-3 border-b border-border px-4">
      <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <input
        ref={inputRef}
        value={query}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search pages and actions..."
        aria-label="Search commands"
        aria-controls="command-list"
        aria-activedescendant={activeOptionId}
        className="command-search-input h-14 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
      <button
        ref={closeButtonRef}
        type="button"
        onClick={onClose}
        aria-label="Close command palette"
        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  )
}
