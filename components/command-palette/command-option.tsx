import { CornerDownLeft } from 'lucide-react'
import type { Command } from './commands'

type CommandOptionProps = {
  command: Command
  isActive: boolean
  onHover: () => void
  onSelect: () => void
}

export function CommandOption({ command, isActive, onHover, onSelect }: CommandOptionProps) {
  return (
    <div
      id={`command-option-${command.id}`}
      role="option"
      aria-selected={isActive}
      onMouseEnter={onHover}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onSelect}
      className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
        isActive ? 'bg-muted text-foreground' : 'text-muted-foreground'
      }`}
    >
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
          isActive ? 'border-border bg-card text-foreground' : 'border-transparent bg-muted/60'
        }`}
      >
        <command.icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-foreground">{command.label}</span>
        <span
          className={`block truncate text-xs ${
            isActive ? 'text-foreground/70' : 'text-muted-foreground'
          }`}
        >
          {command.description}
        </span>
      </span>
      {isActive && (
        <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
      )}
    </div>
  )
}
