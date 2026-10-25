import type { ReactNode } from 'react'
import type { Resume } from '@/lib/resumes/model'

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function dateLabel(value: string) {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value)
  return match ? `${months[Number(match[2]) - 1]} ${match[1]}` : ''
}

function dateRange(start: string, end: string, current?: boolean) {
  start = /^\d{4}-(0[1-9]|1[0-2])$/.test(start) ? start : ''
  end = /^\d{4}-(0[1-9]|1[0-2])$/.test(end) ? end : ''
  if (!start) return end ? dateLabel(end) : ''
  if (end) return `${dateLabel(start)} – ${dateLabel(end)}`
  return (current ?? !!start) ? `${dateLabel(start)} – Present` : dateLabel(start)
}

function mostRecentFirst<T extends { startDate: string; endDate: string; current?: boolean }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const currentA = a.current ?? (!!a.startDate && !a.endDate)
    const currentB = b.current ?? (!!b.startDate && !b.endDate)
    return Number(currentB) - Number(currentA)
      || (b.endDate || b.startDate).localeCompare(a.endDate || a.startDate)
      || b.startDate.localeCompare(a.startDate)
  })
}

function safeHref(value: string) {
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.href : undefined } catch { return undefined }
}

function WebLink({ value }: { value: string }) {
  const href = safeHref(value)
  return href ? <a href={href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{value}</a> : <span>{value}</span>
}

function PreviewSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="mt-6">
    <h3 className="mb-3 border-b border-slate-200 pb-2 text-[10px] font-bold uppercase tracking-[.16em] text-[#0C115B]">{title}</h3>
    {children}
  </section>
}

/** Pure rendering of the current draft: no saved copy, storage or HTML injection. */
export function ResumePreview({ resume }: { resume: Resume }) {
  const contact = [resume.personal.email, resume.personal.phone, resume.personal.location].filter((value) => value.trim())
  const experience = mostRecentFirst(resume.experience.filter((entry) => [entry.jobTitle, entry.company, entry.employmentType, entry.location, entry.startDate, entry.endDate, entry.description, ...entry.achievements.map((item) => item.text)].some((value) => value.trim())))
  const education = mostRecentFirst(resume.education.filter(({ id: _id, ...entry }) => Object.values(entry).some((value) => typeof value === 'string' && value.trim())))
  const links = [resume.personal.linkedin, resume.personal.portfolio].filter((value) => value.trim())
  const languages = resume.languages.filter((item) => item.name.trim())
  const certifications = resume.certifications.filter((item) => item.name.trim() || item.issuer.trim() || item.date || item.credentialUrl.trim() || item.credentialId?.trim() || item.expirationDate).slice().sort((a, b) => b.date.localeCompare(a.date))
  const hasContent = resume.personal.fullName.trim() || contact.length || resume.summary.trim() || experience.length || education.length || resume.skills.length || links.length || languages.length || certifications.length

  return <aside aria-label="Live resume preview" className="min-w-0 lg:sticky lg:top-6">
    <div className="rounded-2xl border border-white/90 bg-slate-200/40 p-3 shadow-sm sm:p-4 lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto" tabIndex={0} aria-label="Scrollable resume document">
      <article aria-label="Resume document" className="min-h-[640px] w-full bg-white px-6 py-9 text-[11px] leading-relaxed text-slate-700 shadow-sm [overflow-wrap:anywhere] sm:px-8 xl:px-9" style={{ aspectRatio: '210 / 297' }}>
        <header className="border-b-2 border-[#0C115B] pb-5">
          <h2 className={`text-2xl font-semibold leading-tight tracking-tight ${resume.personal.fullName.trim() ? 'text-[#0C115B]' : 'text-slate-300'}`}>{resume.personal.fullName.trim() || 'Your name'}</h2>
          {!!contact.length && <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500" aria-label="Contact information">{contact.map((value, index) => <li key={index}>{value}</li>)}</ul>}
          {!!links.length && <ul aria-label="Professional links" className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500">{links.map((value, index) => <li key={index}><WebLink value={value} /></li>)}</ul>}
        </header>
        {!hasContent && <p className="mt-8 text-xs leading-6 text-slate-400">Your story starts here. Add your information on the left and watch your resume take shape.</p>}
        {!!resume.summary.trim() && <PreviewSection title="Professional summary"><p className="whitespace-pre-wrap">{resume.summary}</p></PreviewSection>}
        {!!experience.length && <PreviewSection title="Experience">
          <div className="space-y-5">{experience.map((entry) => <section key={entry.id}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              {entry.jobTitle.trim() && <h4 className="font-semibold text-slate-900">{entry.jobTitle}</h4>}
              {(entry.startDate || entry.endDate) && <p className="text-[10px] text-slate-500">{dateRange(entry.startDate, entry.endDate, entry.current)}</p>}
            </div>
            {(entry.company.trim() || entry.location.trim() || entry.employmentType?.trim()) && <p className="mt-0.5 text-slate-500">{[entry.company, entry.employmentType, entry.location].filter((value) => value?.trim()).join(' · ')}</p>}
            {entry.description.trim() && <p className="mt-2 whitespace-pre-wrap">{entry.description}</p>}
            {entry.achievements.some((item) => item.text.trim()) && <ul aria-label="Achievements" className="mt-2 list-disc space-y-1 pl-4">{entry.achievements.filter((item) => item.text.trim()).map((item) => <li key={item.id} className="whitespace-pre-wrap">{item.text}</li>)}</ul>}
          </section>)}</div>
        </PreviewSection>}
        {!!education.length && <PreviewSection title="Education">
          <div className="space-y-4">{education.map((entry) => <section key={entry.id}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              {entry.institution.trim() && <h4 className="font-semibold text-slate-900">{entry.institution}</h4>}
              {(entry.startDate || entry.endDate) && <p className="text-[10px] text-slate-500">{dateRange(entry.startDate, entry.endDate, entry.current)}</p>}
            </div>
            {(entry.degree.trim() || entry.fieldOfStudy.trim()) && <p className="mt-0.5">{[entry.degree, entry.fieldOfStudy].filter((value) => value.trim()).join(' · ')}</p>}
          </section>)}</div>
        </PreviewSection>}
        {!!resume.skills.length && <PreviewSection title="Skills"><ul className="flex flex-wrap gap-x-4 gap-y-1" aria-label="Resume skills">{resume.skills.map((skill) => <li key={skill.id}>{skill.name}</li>)}</ul></PreviewSection>}
        {!!languages.length && <PreviewSection title="Languages"><ul className="space-y-1">{languages.map((item) => <li key={item.id}>{item.name}{item.proficiency && ` — ${item.proficiency}`}</li>)}</ul></PreviewSection>}
        {!!certifications.length && <PreviewSection title="Certifications"><div className="space-y-3">{certifications.map((item) => <section key={item.id}>
          <div className="flex flex-wrap justify-between gap-x-3 gap-y-1">{item.name.trim() && <h4 className="font-semibold text-slate-900">{item.name}</h4>}{item.date && <p className="text-[10px] text-slate-500">{dateLabel(item.date)}</p>}</div>
          {item.issuer.trim() && <p>{item.issuer}</p>}
          {item.credentialId?.trim() && <p className="mt-1 text-[10px] text-slate-500">Credential ID: {item.credentialId}</p>}
          {item.doesNotExpire ? <p className="text-[10px] text-slate-500">No expiration date</p> : item.expirationDate && <p className="text-[10px] text-slate-500">Expires {dateLabel(item.expirationDate)}</p>}
          {item.credentialUrl.trim() && <p className="mt-1 text-[10px] text-slate-500"><WebLink value={item.credentialUrl} /></p>}
        </section>)}</div></PreviewSection>}
      </article>
    </div>
    <p className="mt-3 px-1 text-xs leading-5 text-slate-500">Preview includes unsaved edits. Use Save changes to keep them in this browser.</p>
  </aside>
}
