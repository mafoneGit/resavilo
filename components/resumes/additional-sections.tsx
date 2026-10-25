import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { newLanguage, newCertification, type Resume } from '@/lib/resumes/model'
import { EditorField } from './editor-field'
import { EditorSection } from './editor-section'
import { SearchableSelect } from './searchable-select'
import { LanguageProficiency } from './language-proficiency'
import { useResumes } from './provider'
import { languageSuggestions, suggestionsFrom } from '@/lib/resumes/options'

export function AdditionalSections({ draft, onChange, errors }: { draft: Resume; onChange: (draft: Resume) => void; errors: Record<string, string> }) {
  const { resumes } = useResumes()
  const issuers = suggestionsFrom([...resumes, draft].flatMap((resume) => resume.certifications.map((entry) => entry.issuer)))
  const certificates = suggestionsFrom([...resumes, draft].flatMap((resume) => resume.certifications.map((entry) => entry.name)))
  return <>
    <EditorSection id="languages" title="Languages" hint="Add a language and choose the proficiency that best describes your ability." action={<Button type="button" variant="outline" disabled={draft.languages.length >= 30} onClick={() => onChange({ ...draft, languages: [...draft.languages, newLanguage()] })}><Plus aria-hidden="true" />Add language</Button>}>
      {!draft.languages.length && <p className="text-sm text-slate-500">Add languages relevant to the role.</p>}
      <div className="space-y-5">{draft.languages.map((item, index) => <fieldset key={item.id} className="min-w-0 rounded-xl border border-slate-200/80 p-4">
        <legend className="px-2 text-sm font-semibold text-[#0C115B]">Language {index + 1}</legend>
        <div className="mb-3 flex justify-end"><Button type="button" variant="ghost" size="sm" className="text-red-700 hover:bg-red-50" aria-label={`Remove language ${index + 1}`} onClick={() => onChange({ ...draft, languages: draft.languages.filter((entry) => entry.id !== item.id) })}><Trash2 aria-hidden="true" />Remove</Button></div>
        <div className="grid gap-5 xl:grid-cols-2">
          <SearchableSelect options={languageSuggestions} excluded={draft.languages.filter((entry) => entry.id !== item.id).map((entry) => entry.name)} placeholder="Select a language" id={`languages.${index}.name`} label="Language" value={item.name} maxLength={200} error={errors[`languages.${index}.name`]} onChange={(name) => onChange({ ...draft, languages: draft.languages.map((entry) => entry.id === item.id ? { ...entry, name } : entry) })} />
          <LanguageProficiency id={`languages.${index}.proficiency`} value={item.proficiency} onChange={(proficiency) => onChange({ ...draft, languages: draft.languages.map((entry) => entry.id === item.id ? { ...entry, proficiency } : entry) })} />
        </div>
      </fieldset>)}</div>
    </EditorSection>
    <EditorSection id="certifications" title="Certifications" hint="Include qualifications relevant to the job. The preview shows the most recent first." action={<Button type="button" variant="outline" disabled={draft.certifications.length >= 50} onClick={() => onChange({ ...draft, certifications: [...draft.certifications, newCertification()] })}><Plus aria-hidden="true" />Add certification</Button>}>
      {!draft.certifications.length && <p className="text-sm text-slate-500">No certifications added yet.</p>}
      <div className="space-y-5">{draft.certifications.map((item, index) => <fieldset key={item.id} className="min-w-0 rounded-xl border border-slate-200/80 p-4">
        <legend className="px-2 text-sm font-semibold text-[#0C115B]">Certification {index + 1}</legend>
        <div className="mb-3 flex justify-end"><Button type="button" variant="ghost" size="sm" className="text-red-700 hover:bg-red-50" aria-label={`Remove certification ${index + 1}`} onClick={() => onChange({ ...draft, certifications: draft.certifications.filter((entry) => entry.id !== item.id) })}><Trash2 aria-hidden="true" />Remove</Button></div>
        <label className="mb-4 flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={item.doesNotExpire} onChange={(event) => onChange({ ...draft, certifications: draft.certifications.map((entry) => entry.id === item.id ? { ...entry, doesNotExpire: event.target.checked, expirationDate: event.target.checked ? '' : entry.expirationDate } : entry) })} />This credential does not expire</label>
        <div className="grid gap-5 xl:grid-cols-2">{([['name', 'Certification name'], ['issuer', 'Issuing organisation'], ['date', 'Issue date'], ['expirationDate', 'Expiration date'], ['credentialId', 'Credential ID'], ['credentialUrl', 'Credential URL']] as const).map(([key, label]) => <EditorField key={key} id={`certifications.${index}.${key}`} disabled={key === 'expirationDate' && item.doesNotExpire} suggestions={key === 'issuer' ? issuers : key === 'name' ? certificates : undefined} label={label} value={item[key]} type={(key === 'date' || key === 'expirationDate') ? 'month' : key === 'credentialUrl' ? 'url' : 'text'} maxLength={key === 'credentialUrl' ? 500 : 200} error={errors[`certifications.${index}.${key}`]} onChange={(value) => onChange({ ...draft, certifications: draft.certifications.map((entry) => entry.id === item.id ? { ...entry, [key]: value } : entry) })} />)}</div>
      </fieldset>)}</div>
    </EditorSection>
  </>
}
