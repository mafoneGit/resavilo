import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Achievement } from '@/lib/resumes/model'
import { EditorField } from './editor-field'

export function ExperienceAchievements({ items, onChange, prefix, errors }: {
  items: Achievement[]; onChange: (items: Achievement[]) => void; prefix: string; errors: Record<string, string>
}) {
  return <div className="mt-5 space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm font-semibold text-slate-700">Achievements</p>
      <Button type="button" variant="outline" size="sm" disabled={items.length >= 30} onClick={() => onChange([...items, { id: crypto.randomUUID(), text: '' }])}><Plus aria-hidden="true" />Add achievement</Button>
    </div>
    <p className="text-xs leading-5 text-slate-500">One result per bullet. Describe your action and its impact; add numbers where relevant.</p>
    {items.map((item, index) => <div key={item.id} className="flex items-start gap-2">
      <div className="min-w-0 flex-1"><EditorField id={`${prefix}.${index}.text`} label={`Achievement ${index + 1}`} value={item.text} onChange={(text) => onChange(items.map((entry) => entry.id === item.id ? { ...entry, text } : entry))} multiline maxLength={1000} error={errors[`${prefix}.${index}.text`]} /></div>
      <Button type="button" variant="ghost" size="icon" className="mt-6 text-red-700 hover:bg-red-50" aria-label={`Remove achievement ${index + 1}`} onClick={() => onChange(items.filter((entry) => entry.id !== item.id))}><Trash2 aria-hidden="true" /></Button>
    </div>)}
  </div>
}
