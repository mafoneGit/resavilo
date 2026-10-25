'use client'

import { useId, useState } from 'react'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandInput, CommandList, CommandGroup, CommandItem } from '@/components/ui/command'
import { sameChoice, type Suggestion } from '@/lib/resumes/options'

export function SearchableSelect({ id, label, value, onChange, options, excluded = [], error, maxLength = 200, placeholder = 'Select or type a value', hint }: {
  id: string; label: string; value: string; onChange: (value: string) => void; options: readonly Suggestion[]; excluded?: string[]; error?: string; maxLength?: number; placeholder?: string; hint?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const listId = useId()
  const candidate = query.trim()
  const duplicate = excluded.some((item) => sameChoice(item, candidate))
  const custom = candidate && !duplicate && !options.some((item) => sameChoice(item.value, candidate))
  function choose(next: string) { onChange(next); setOpen(false); setQuery('') }
  return <div className="min-w-0 space-y-2">
    <Label htmlFor={id}>{label}</Label>
    <Popover open={open} onOpenChange={(next) => { setOpen(next); if (!next) setQuery('') }}>
      <PopoverTrigger asChild>
        <Button id={id} type="button" variant="outline" role="combobox" aria-expanded={open} aria-controls={open ? listId : undefined} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} className="h-auto min-h-9 w-full justify-between border-slate-200 bg-white/80 text-left font-normal hover:bg-white">
          <span className={`min-w-0 whitespace-normal break-words ${value ? 'text-slate-800' : 'text-slate-500'}`}>{value || placeholder}</span><ChevronsUpDown className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] min-w-[220px] max-w-[calc(100vw-2rem)] border-slate-200 bg-white p-0">
        <Command>
          <CommandInput aria-label={`Search ${label.toLowerCase()}`} placeholder={`Search ${label.toLowerCase()}…`} value={query} onValueChange={setQuery} maxLength={maxLength} />
          <CommandList id={listId}>
            {value && !candidate && <CommandItem onSelect={() => choose('')}>Clear selection</CommandItem>}
            <CommandGroup heading="Suggestions">
              {options.map((option) => <CommandItem key={option.value} value={option.value} keywords={option.keywords} disabled={excluded.some((item) => sameChoice(item, option.value))} onSelect={() => choose(option.value)} className="data-[selected=true]:bg-indigo-50 data-[selected=true]:text-[#0C115B]">
                <span className="flex-1">{option.value}</span>{sameChoice(value, option.value) && <Check className="size-4" aria-hidden="true" />}
              </CommandItem>)}
            </CommandGroup>
            {custom && <CommandGroup heading="Your own value"><CommandItem value={`custom:${candidate}`} keywords={[candidate]} onSelect={() => choose(candidate)} className="data-[selected=true]:bg-indigo-50 data-[selected=true]:text-[#0C115B]"><Plus className="size-4" aria-hidden="true" /><span className="break-words">Use “{candidate}”</span></CommandItem></CommandGroup>}
          </CommandList>
          {duplicate && <p role="status" className="border-t px-3 py-2 text-xs text-slate-500">Already added.</p>}
          <p className="border-t px-3 py-2 text-xs text-slate-500">{hint || 'Can’t find it? Type a name and choose your own value.'}</p>
        </Command>
      </PopoverContent>
    </Popover>
    {error && <p id={`${id}-error`} className="text-xs text-red-700">{error}</p>}
  </div>
}
