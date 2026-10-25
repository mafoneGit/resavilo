'use client'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export function MonthYearField({ id, label, value, onChange, disabled, error }: {
  id: string; label: string; value: string; onChange: (value: string) => void; disabled?: boolean; error?: string
}) {
  // Incomplete selections remain in the draft and fail validation on Save;
  // a year or month is never silently invented or discarded.
  const [year = '', month = ''] = value.split('-')
  const currentYear = Number(new Intl.DateTimeFormat('en', { year: 'numeric', timeZone: 'Asia/Jerusalem' }).format(new Date()))
  const years = Array.from({ length: currentYear + 20 - 1900 + 1 }, (_, index) => String(currentYear + 20 - index))
  if (year && !years.includes(year)) years.push(year)
  years.sort((a, b) => Number(b) - Number(a))
  function change(nextMonth: string, nextYear: string) {
    onChange(nextMonth || nextYear ? `${nextYear}-${nextMonth}` : '')
  }
  const trigger = 'w-full min-w-0 border-slate-200 bg-white/80 text-left'
  return <fieldset disabled={disabled} className="min-w-0 space-y-2">
    <legend className="mb-2 text-sm font-medium text-slate-700">{label}</legend>
    <div className="flex min-w-0 items-center gap-2">
      <Select value={month} disabled={disabled} onValueChange={(next) => change(next, year)}>
        <SelectTrigger id={id} aria-label={`${label} month`} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} className={`${trigger} flex-1`}><SelectValue placeholder="Month" /></SelectTrigger>
        <SelectContent className="border-slate-200 bg-white">{months.map((name, index) => <SelectItem key={name} value={String(index + 1).padStart(2, '0')} className="focus:bg-indigo-50 focus:text-[#0C115B]">{name}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={year} disabled={disabled} onValueChange={(next) => change(month, next)}>
        <SelectTrigger id={`${id}-year`} aria-label={`${label} year`} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} className={`${trigger} w-24 shrink-0`}><SelectValue placeholder="Year" /></SelectTrigger>
        <SelectContent className="border-slate-200 bg-white">{years.map((item) => <SelectItem key={item} value={item} className="focus:bg-indigo-50 focus:text-[#0C115B]">{item}</SelectItem>)}</SelectContent>
      </Select>
      {!!value && <Button type="button" variant="ghost" size="icon-sm" disabled={disabled} aria-label={`Clear ${label.toLowerCase()}`} className="shrink-0 text-slate-500" onClick={() => onChange('')}><X aria-hidden="true" /></Button>}
    </div>
    {error ? <p id={`${id}-error`} className="text-xs text-red-700">{error}</p> : !!value && (!month || !year) && <p className="text-xs text-slate-500">Select both a month and a year.</p>}
  </fieldset>
}
