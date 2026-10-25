import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { languageLevels, type Language } from '@/lib/resumes/model'

const explanations: Record<string, string> = {
  'Elementary proficiency': 'Basic words and simple everyday conversations.',
  'Limited working proficiency': 'Routine tasks and simple conversations at work.',
  'Professional working proficiency': 'Comfortable handling most work conversations and documents.',
  'Full professional proficiency': 'Confident and precise in complex professional situations.',
  'Native or bilingual proficiency': 'Native-level fluency or equally comfortable in both languages.',
}

export function LanguageProficiency({ id, value, onChange }: { id: string; value: Language['proficiency']; onChange: (value: Language['proficiency']) => void }) {
  const legacy = value && !languageLevels.some((level) => level === value)
  return <div className="min-w-0 space-y-2">
    <Label htmlFor={id}>Proficiency</Label>
    <Select value={value || 'unspecified'} onValueChange={(next) => onChange(next === 'unspecified' ? '' : next as Language['proficiency'])}>
      <SelectTrigger id={id} aria-describedby={`${id}-hint`} className="data-[size=default]:h-auto min-h-9 w-full border-slate-200 bg-white/80 text-left [&_[data-slot=select-value]]:whitespace-normal [&_[data-slot=select-value]]:line-clamp-none"><SelectValue placeholder="Select proficiency" /></SelectTrigger>
      <SelectContent className="max-w-[calc(100vw-2rem)] border-slate-200 bg-white">
        <SelectItem value="unspecified">Select proficiency</SelectItem>
        {languageLevels.filter(Boolean).map((level) => <SelectItem key={level} value={level} className="focus:bg-indigo-50 focus:text-[#0C115B]">{level}</SelectItem>)}
        {legacy && <SelectItem value={value}>{value} (previous selection)</SelectItem>}
      </SelectContent>
    </Select>
    <p id={`${id}-hint`} className="text-xs leading-5 text-slate-500">{legacy ? 'Your previous level is preserved. Choose a new description if you want to update it.' : explanations[value] || 'Choose the description that best reflects your ability.'}</p>
  </div>
}
