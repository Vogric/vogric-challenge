import type { Command } from './command'

export function filterCommands(commands: Command[], query: string): Command[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return commands

  return commands.filter((command) =>
    `${command.label} ${command.description} ${command.keywords}`.toLowerCase().includes(normalized)
  )
}
