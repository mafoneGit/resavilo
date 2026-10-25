'use client'

import Link from 'next/link'
import { useState } from 'react'
import { FileText, ArrowUpRight, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Resume } from '@/lib/resumes/model'
import { useResumes } from './provider'
import { ConfirmDialog, glassPanel, messageOf, updatedLabel } from './shared'

export function ResumeList({ resumes }: { resumes: Resume[] }) {
  const { remove } = useResumes()
  const [deleting, setDeleting] = useState<Resume | null>(null)
  const [error, setError] = useState('')
  return <>
    {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p>}
    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {resumes.map((resume) => <article key={resume.id} className={`${glassPanel} flex min-w-0 flex-col p-6`}>
        <div className="mb-6 flex size-11 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50/70 text-[#0C115B]"><FileText className="size-5" aria-hidden="true" /></div>
        <h2 className="break-words text-base font-semibold text-[#0C115B]"><Link href={`/resumes/${resume.id}`} className="hover:underline">{resume.title}</Link></h2>
        <p className="mb-6 mt-2 text-xs leading-5 text-slate-500">Updated <time dateTime={resume.updatedAt}>{updatedLabel(resume.updatedAt)}</time></p>
        <div className="mt-auto flex items-center justify-between border-t border-slate-200/60 pt-4">
          <Button variant="ghost" asChild className="px-0 text-[#0C115B] hover:bg-transparent"><Link href={`/resumes/${resume.id}`}>Open resume<ArrowUpRight aria-hidden="true" /></Link></Button>
          <Button variant="ghost" size="icon" aria-label={`Delete ${resume.title}`} className="text-slate-500 hover:bg-red-50 hover:text-red-700" onClick={() => { setError(''); setDeleting(resume) }}><Trash2 aria-hidden="true" /></Button>
        </div>
      </article>)}
    </div>
    <ConfirmDialog open={deleting !== null} onOpenChange={(open) => { if (!open) setDeleting(null) }} title="Delete this resume?" description={`“${deleting?.title ?? ''}” will be permanently removed from this browser. This cannot be undone.`} actionLabel="Delete resume" onConfirm={() => {
      if (!deleting) return
      try { remove(deleting) } catch (error) { setError(messageOf(error)) }
      setDeleting(null)
    }} />
  </>
}
