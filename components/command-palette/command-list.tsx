import type { Command } from './command'
import { CommandOption } from './command-option'

type CommandListProps = {
  commands: Command[]
  activeIndex: number
  onActiveChange: (index: number) => void
  onSelect: (command: Command) => void
}

export function CommandList({ commands, activeIndex, onActiveChange, onSelect }: CommandListProps) {
  return (
    <div className="max-h-[min(420px,55vh)] overflow-y-auto p-2">
      <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Navigate
      </p>
      {commands.length === 0 ? (
        <p className="px-3 py-8 text-center text-sm text-muted-foreground">
          No matching commands.
        </p>
      ) : (
        <div id="command-list" role="listbox" aria-label="Commands">
          {commands.map((command, index) => (
            <CommandOption
              key={command.id}
              command={command}
              isActive={index === activeIndex}
              onHover={() => onActiveChange(index)}
              onSelect={() => onSelect(command)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
