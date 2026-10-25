'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Save, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { resumeSchema, newEducation, newExperience, type Resume } from '@/lib/resumes/model'
import { useResumes } from './provider'
import { EditorField } from './editor-field'
import { EditorSection } from './editor-section'
import { ExperienceAchievements } from './experience-achievements'
import { AdditionalSections } from './additional-sections'
import { skillSuggestions, degreeSuggestions, jobTitleSuggestions, employmentSuggestions, suggestionsFrom } from '@/lib/resumes/options'
import { ResumePreview } from './resume-preview'
import { glassPanel, primaryButton, messageOf, LoadingResumes, StorageNotice, updatedLabel } from './shared'

export function ResumeEditorLoader({ id }: { id: string }) {
  const { loaded } = useResumes()
  if (!loaded) return <LoadingResumes />
  return <OpenedResumeEditor key={id} id={id} />
}

function OpenedResumeEditor({ id }: { id: string }) {
  const { status, resumes } = useResumes()
  // Keep the opened document mounted if another tab deletes it: unsaved text
  // must remain visible so the user can recover it before leaving.
  const [opened] = useState(() => resumes.find((resume) => resume.id === id))
  if (!opened) return status !== 'ready' ? <StorageNotice /> : <div className={`${glassPanel} p-8`}><h1 className="text-2xl font-semibold text-[#0C115B]">Resume not found</h1><p className="my-4 text-sm text-slate-600">This resume may have been deleted, or it was saved in a different browser.</p><Button asChild variant="outline"><Link href="/resumes">Back to My Resumes</Link></Button></div>
  return <><StorageNotice /><ResumeEditor initialResume={opened} /></>
}

function ResumeEditor({ initialResume }: { initialResume: Resume }) {
  const { save, resumes, refresh } = useResumes()
  const [draft, setDraft] = useState(initialResume)
  const [saved, setSaved] = useState(initialResume)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')
  const [failure, setFailure] = useState('')
  const [skill, setSkill] = useState('')
  const [skillError, setSkillError] = useState('')
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved)
  const latest = resumes.find((resume) => resume.id === draft.id)
  const companySuggestions = suggestionsFrom([...resumes, draft].flatMap((resume) => resume.experience.map((entry) => entry.company)))
  const schoolSuggestions = suggestionsFrom([...resumes, draft].flatMap((resume) => resume.education.map((entry) => entry.institution)))
  const conflict = latest?.updatedAt !== saved.updatedAt

  useEffect(() => {
    if (!dirty) return
    const beforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    const onLink = (event: MouseEvent) => {
      const link = (event.target as Element).closest?.('a[href]') as HTMLAnchorElement | null
      if (!link || link.target === '_blank' || link.origin !== window.location.origin || link.pathname === window.location.pathname) return
      if (!window.confirm('You have unsaved changes. Leave without saving?')) { event.preventDefault(); event.stopPropagation() }
    }
    const beforeNavigation = (event: Event) => { if (!window.confirm('You have unsaved changes. Leave without saving?')) event.preventDefault() }
    window.addEventListener('resavilo:before-navigation', beforeNavigation)
    window.addEventListener('beforeunload', beforeUnload)
    document.addEventListener('click', onLink, true)
    return () => { window.removeEventListener('resavilo:before-navigation', beforeNavigation); window.removeEventListener('beforeunload', beforeUnload); document.removeEventListener('click', onLink, true) }
  }, [dirty])

  function update(next: Resume) { setDraft(next); setMessage(''); setFailure('') }
  function persist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(''); setFailure(''); setErrors({})
    const result = resumeSchema.safeParse(draft)
    if (!result.success) {
      const fields: Record<string, string> = {}
      for (const issue of result.error.issues) fields[issue.path.join('.')] = issue.message
      setErrors(fields)
      setFailure('Please review the highlighted fields before saving.')
      const first = result.error.issues[0]?.path.join('.')
      document.getElementById(first === 'summary' ? 'summary-text' : first)?.focus()
      return
    }
    try {
      const next = save(result.data, saved.updatedAt)
      setDraft(next); setSaved(next); setMessage('All changes saved in this browser.')
    } catch (error) { setFailure(messageOf(error)); refresh() }
  }
  function addSkill() {
    const name = skill.trim()
    if (!name) { setSkillError('Enter a skill first.'); return }
    if (name.length > 80) { setSkillError('Use no more than 80 characters.'); return }
    if (draft.skills.some((item) => item.name.toLowerCase() === name.toLowerCase())) { setSkillError('This skill is already added.'); return }
    if (draft.skills.length >= 100) { setSkillError('You can add up to 100 skills.'); return }
    update({ ...draft, skills: [...draft.skills, { id: crypto.randomUUID(), name }] }); setSkill(''); setSkillError('')
  }
  function reloadSaved() {
    if (dirty && !window.confirm('Discard your unsaved changes and reload the saved version?')) return
    if (latest) { setDraft(latest); setSaved(latest); setErrors({}); setFailure(''); setMessage('Saved version loaded.') }
  }

  return <>
    <Link href="/resumes" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-[#0C115B]"><ArrowLeft className="size-4" aria-hidden="true" />My Resumes</Link>
    <header className="mb-7"><p className="mb-2 text-xs font-semibold uppercase tracking-[.16em] text-slate-500">Resume editor</p><h1 className="break-words text-3xl font-semibold text-[#0C115B]">{draft.title || 'Untitled resume'}</h1><p className="mt-3 text-sm leading-6 text-slate-600">Tell your story, one section at a time. Empty sections can be filled in later.</p></header>
    <form onSubmit={persist} method="post" noValidate className="space-y-5">
      <div className={`${glassPanel} flex flex-wrap items-center justify-between gap-4 p-4 sm:px-6`}>
        <div className="text-xs leading-5 text-slate-500"><p className="font-semibold text-slate-700">{dirty ? 'Unsaved changes' : 'Saved in this browser'}</p><p>Last saved {updatedLabel(saved.updatedAt)}</p></div>
        <Button type="submit" className={primaryButton} disabled={conflict}><Save aria-hidden="true" />Save changes</Button>
      </div>
      {failure && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{failure}</p>}
      {message && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">{message}</p>}
      {conflict && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><p>{latest ? 'This resume changed in another tab. Reload its saved version before continuing.' : 'This resume was deleted or is unavailable in another tab. Your edits are still visible; copy any text you need before leaving.'}</p><Button type="button" variant="outline" className="mt-3" disabled={!latest} onClick={reloadSaved}>Reload saved version</Button></div>}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-5">
          <EditorSection id="details" title="Resume details" hint="A title to help you find this resume later.">
            <EditorField id="title" label="Resume title" value={draft.title} onChange={(title) => update({ ...draft, title })} maxLength={120} required error={errors.title} />
          </EditorSection>
          <EditorSection id="personal" title="Personal information" hint="Make it easy for someone to get in touch.">
            <div className="grid gap-5 xl:grid-cols-2">
              {([['fullName', 'Full name'], ['email', 'Email'], ['phone', 'Phone'], ['location', 'Location'], ['linkedin', 'LinkedIn URL'], ['portfolio', 'Portfolio / website URL']] as const).map(([key, label]) => <EditorField key={key} id={`personal.${key}`} label={label} value={draft.personal[key]} onChange={(value) => update({ ...draft, personal: { ...draft.personal, [key]: value } })} maxLength={key === 'email' ? 254 : key === 'phone' ? 60 : ['linkedin', 'portfolio'].includes(key) ? 500 : 200} type={key === 'email' ? 'email' : key === 'phone' ? 'tel' : ['linkedin', 'portfolio'].includes(key) ? 'url' : 'text'} error={errors[`personal.${key}`]} />)}
            </div>
          </EditorSection>
          <EditorSection id="summary" title="Professional summary" hint="A few focused sentences about your experience and what you bring.">
            <EditorField id="summary-text" label="Summary" multiline value={draft.summary} onChange={(summary) => update({ ...draft, summary })} maxLength={10000} error={errors.summary} />
          </EditorSection>
          <EditorSection id="experience" title="Work experience" hint="Add your roles. The preview shows current and most recent experience first." action={<Button type="button" variant="outline" disabled={draft.experience.length >= 50} onClick={() => update({ ...draft, experience: [...draft.experience, newExperience()] })}><Plus aria-hidden="true" />Add experience</Button>}>
            {!draft.experience.length && <p className="text-sm text-slate-500">No experience added yet. Add your first role when you’re ready.</p>}
            <div className="space-y-5">{draft.experience.map((entry, index) => <fieldset key={entry.id} className="min-w-0 rounded-xl border border-slate-200/80 bg-white/35 p-4 sm:p-5">
              <legend className="px-2 text-sm font-semibold text-[#0C115B]">Experience {index + 1}</legend>
              <div className="mb-4 flex justify-end"><Button type="button" variant="ghost" size="sm" className="text-red-700 hover:bg-red-50" aria-label={`Remove experience ${index + 1}`} onClick={() => update({ ...draft, experience: draft.experience.filter((item) => item.id !== entry.id) })}><Trash2 aria-hidden="true" />Remove</Button></div>
              <label className="mb-4 flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={entry.current ?? (!!entry.startDate && !entry.endDate)} onChange={(event) => update({ ...draft, experience: draft.experience.map((item) => item.id === entry.id ? { ...item, current: event.target.checked, endDate: event.target.checked ? '' : item.endDate } : item) })} />I currently work here</label>
              <div className="grid gap-5 xl:grid-cols-2">
                {([['jobTitle', 'Job title'], ['company', 'Company'], ['employmentType', 'Employment type'], ['location', 'Location'], ['startDate', 'Start date'], ['endDate', 'End date'], ['description', 'Description']] as const).map(([key, label]) => <EditorField key={key} id={`experience.${index}.${key}`} disabled={key === 'endDate' && (entry.current ?? (!!entry.startDate && !entry.endDate))} suggestions={key === 'jobTitle' ? jobTitleSuggestions : key === 'company' ? companySuggestions : key === 'employmentType' ? employmentSuggestions : undefined} label={label} value={entry[key]} onChange={(value) => update({ ...draft, experience: draft.experience.map((item) => item.id === entry.id ? { ...item, [key]: value } : item) })} type={key.endsWith('Date') ? 'month' : 'text'} multiline={key === 'description'} className={key === 'description' ? 'xl:col-span-2' : ''} maxLength={key === 'description' ? 10000 : key === 'employmentType' ? 80 : 200} error={errors[`experience.${index}.${key}`]} />)}
              </div><p className="mt-3 text-xs text-slate-500">Use the checkbox for a current role. Dates are optional when unknown.</p>
              <ExperienceAchievements items={entry.achievements} prefix={`experience.${index}.achievements`} errors={errors} onChange={(achievements) => update({ ...draft, experience: draft.experience.map((item) => item.id === entry.id ? { ...item, achievements } : item) })} />
            </fieldset>)}</div>
          </EditorSection>
          <EditorSection id="education" title="Education" hint="Include your studies. The preview shows the most recent first." action={<Button type="button" variant="outline" disabled={draft.education.length >= 50} onClick={() => update({ ...draft, education: [...draft.education, newEducation()] })}><Plus aria-hidden="true" />Add education</Button>}>
            {!draft.education.length && <p className="text-sm text-slate-500">No education added yet.</p>}
            <div className="space-y-5">{draft.education.map((entry, index) => <fieldset key={entry.id} className="min-w-0 rounded-xl border border-slate-200/80 bg-white/35 p-4 sm:p-5">
              <legend className="px-2 text-sm font-semibold text-[#0C115B]">Education {index + 1}</legend>
              <div className="mb-4 flex justify-end"><Button type="button" variant="ghost" size="sm" className="text-red-700 hover:bg-red-50" aria-label={`Remove education ${index + 1}`} onClick={() => update({ ...draft, education: draft.education.filter((item) => item.id !== entry.id) })}><Trash2 aria-hidden="true" />Remove</Button></div>
              <label className="mb-4 flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={entry.current ?? (!!entry.startDate && !entry.endDate)} onChange={(event) => update({ ...draft, education: draft.education.map((item) => item.id === entry.id ? { ...item, current: event.target.checked, endDate: event.target.checked ? '' : item.endDate } : item) })} />I am currently studying here</label>
              <div className="grid gap-5 xl:grid-cols-2">
                {([['institution', 'Institution'], ['degree', 'Degree'], ['fieldOfStudy', 'Field of study'], ['startDate', 'Start date'], ['endDate', 'End date']] as const).map(([key, label]) => <EditorField key={key} id={`education.${index}.${key}`} disabled={key === 'endDate' && (entry.current ?? (!!entry.startDate && !entry.endDate))} suggestions={key === 'institution' ? schoolSuggestions : key === 'degree' ? degreeSuggestions : undefined} label={label} value={entry[key]} onChange={(value) => update({ ...draft, education: draft.education.map((item) => item.id === entry.id ? { ...item, [key]: value } : item) })} type={key.endsWith('Date') ? 'month' : 'text'} maxLength={200} error={errors[`education.${index}.${key}`]} />)}
              </div>
            </fieldset>)}</div>
          </EditorSection>
          <EditorSection id="skills" title="Skills" hint="Keep the strengths that are most relevant to your next role.">
            <div className="flex items-end gap-3"><div className="min-w-0 flex-1"><EditorField id="new-skill" suggestions={skillSuggestions} label="Add a skill" value={skill} onChange={(value) => { setSkill(value); setSkillError('') }} maxLength={80} error={skillError} /></div><Button type="button" variant="outline" onClick={addSkill}>Add skill</Button></div>
            {!!draft.skills.length && <ul className="mt-5 flex flex-wrap gap-2" aria-label="Skills">{draft.skills.map((item) => <li key={item.id} className="inline-flex max-w-full items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-sm text-[#0C115B]"><span className="break-words">{item.name}</span><button type="button" aria-label={`Remove skill ${item.name}`} className="rounded-full p-1 hover:bg-indigo-100 focus-visible:outline-2" onClick={() => update({ ...draft, skills: draft.skills.filter((skill) => skill.id !== item.id) })}><X className="size-3.5" aria-hidden="true" /></button></li>)}</ul>}
          </EditorSection>
          <AdditionalSections draft={draft} onChange={update} errors={errors} />
          <div className="flex justify-end pb-8"><Button type="submit" className={primaryButton} disabled={conflict}><Save aria-hidden="true" />Save changes</Button></div>
        </div>
        <ResumePreview resume={draft} />
      </div>
    </form>
  </>
}
