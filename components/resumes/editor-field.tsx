import { MonthYearField } from './month-year-field'
import { SearchableSelect } from './searchable-select'
import type { Suggestion } from '@/lib/resumes/options'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

export function EditorField({ id, label, value, onChange, multiline, error, className = '', suggestions, ...props }: {
  id: string; label: string; value: string; onChange: (value: string) => void; multiline?: boolean; error?: string; className?: string; type?: string; maxLength?: number; required?: boolean; disabled?: boolean; suggestions?: readonly Suggestion[]
}) {
  if (props.type === 'month') return <div className={`${className} xl:col-span-2`}><MonthYearField id={id} label={label} value={value} onChange={onChange} error={error} disabled={props.disabled} /></div>
  if (suggestions) return <div className={className}><SearchableSelect id={id} label={label} value={value} onChange={onChange} options={suggestions} error={error} maxLength={props.maxLength} /></div>
  const common = {
    id, value, onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(event.target.value),
    'aria-invalid': !!error, 'aria-describedby': error ? `${id}-error` : undefined,
    className: 'border-slate-200 bg-white/80 focus-visible:ring-indigo-200',
  }
  return <div className={`min-w-0 space-y-2 ${className}`}>
    <Label htmlFor={id} className="text-sm text-slate-700">{label}</Label>
    {multiline ? <Textarea {...common} maxLength={props.maxLength} required={props.required} rows={5} /> : <Input {...common} {...props} />}
    {error && <p id={`${id}-error`} className="text-xs text-red-700">{error}</p>}
  </div>
}
