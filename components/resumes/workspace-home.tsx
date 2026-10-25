'use client'

import { useResumes } from './provider'
import { CreateResumeButton, EmptyResumes, LoadingResumes, StorageNotice } from './shared'
import { ResumeList } from './resume-list'

export function WorkspaceHome() {
  const { loaded, status, resumes } = useResumes()
  return <>
    <header className="mb-9 flex flex-wrap items-start justify-between gap-5">
      <div><p className="mb-3 text-xs font-semibold uppercase tracking-[.16em] text-slate-500">Your workspace</p><h1 className="text-3xl font-semibold tracking-tight text-[#0C115B] sm:text-4xl">My Resumes</h1><p className="mt-3 max-w-lg text-sm leading-6 text-slate-600">Your experience, thoughtfully organised. Create, refine and keep your resumes in one place.</p></div>
      <div className="pt-1"><CreateResumeButton /></div>
    </header>
    <StorageNotice />
    {!loaded ? <LoadingResumes /> : status !== 'ready' ? null : !resumes.length ? <EmptyResumes /> : <ResumeList resumes={resumes} />}
    <p className="mt-8 text-xs leading-5 text-slate-500">Stored only in this browser. Clearing site data removes saved resumes.</p>
  </>
}
