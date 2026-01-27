import { useState } from 'react'
import { Check, ChevronsUpDown, GitBranch, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

export default function BranchSelector({
  branch,
  branches,
  loading,
  onBranchChange,
  onFetchBranches,
}) {
  const [open, setOpen] = useState(false)

  const defaultBranches = ['main', 'master', 'develop'].filter((b) =>
    branches.includes(b)
  )
  const otherBranches = branches.filter((b) => !defaultBranches.includes(b))

  const handleSelect = (selectedBranch) => {
    onBranchChange(selectedBranch)
    setOpen(false)
  }

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[300px] justify-between"
            onClick={() => {
              if (branches.length === 0) {
                onFetchBranches()
              }
            }}
          >
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-muted-foreground" />
              <span>{branch}</span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder="Search branches..." />
            <CommandList>
              <CommandEmpty>
                {loading ? 'Loading branches...' : 'No branches found.'}
              </CommandEmpty>

              {defaultBranches.length > 0 && (
                <CommandGroup heading="Default">
                  {defaultBranches.map((b) => (
                    <CommandItem
                      key={b}
                      value={b}
                      onSelect={() => handleSelect(b)}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          branch === b ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      {b}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {otherBranches.length > 0 && (
                <CommandGroup heading="All Branches">
                  {otherBranches.map((b) => (
                    <CommandItem
                      key={b}
                      value={b}
                      onSelect={() => handleSelect(b)}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          branch === b ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      {b}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Button
        variant="outline"
        size="icon"
        onClick={onFetchBranches}
        disabled={loading}
      >
        <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
      </Button>
    </div>
  )
}
