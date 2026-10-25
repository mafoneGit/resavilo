'use client'

import { useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog'
import { useResumes } from './provider'

export const primaryButton = 'bg-[#0C115B] text-white hover:bg-[#1b2376] focus-visible:ring-indigo-300'
export const glassPanel = 'rounded-2xl border border-white/80 bg-white/75 shadow-[0_8px_32px_rgba(12,17,91,0.04)] backdrop-blur-xl'
export function messageOf(error: unknown) { return error instanceof Error ? error.message : 'Something went wrong. Please try again.' }

export function ConfirmDialog({ open, onOpenChange, title, description, actionLabel, onConfirm }: {
  open: boolean; onOpenChange: (open: boolean) => void; title: string; description: string; actionLabel: string; onConfirm: () => void
}) {
  return <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent className="border-white/80 bg-white/95 backdrop-blur-xl">
      <AlertDialogHeader><AlertDialogTitle>{title}</AlertDialogTitle><AlertDialogDescription>{description}</AlertDialogDescription></AlertDialogHeader>
      <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-red-700 text-white hover:bg-red-800" onClick={onConfirm}>{actionLabel}</AlertDialogAction></AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
}

export function CreateResumeButton({ children = 'Create Resume' }: { children?: ReactNode }) {
  const { create, loaded, status } = useResumes()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const router = useRouter()
  return <div>
    <Button className={primaryButton} disabled={!loaded || status !== 'ready' || busy} onClick={() => {
      if (!window.dispatchEvent(new Event('resavilo:before-navigation', { cancelable: true }))) return
      setBusy(true); setError('')
      try { router.push(`/resumes/${create().id}`) }
      catch (error) { setError(messageOf(error)) }
      finally { setBusy(false) }
    }}><Plus aria-hidden="true" />{children}</Button>
    {error && <p role="alert" className="mt-2 max-w-sm text-sm text-red-800">{error}</p>}
  </div>
}

export function StorageNotice() {
  const { status, message, reset, refresh } = useResumes()
  const [confirm, setConfirm] = useState(false)
  const [error, setError] = useState('')
  if (status === 'ready') return null
  return <div role="alert" className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
    <p>{message}</p>
    {error && <p className="mt-2 text-red-800">{error}</p>}
    <div className="mt-3 flex flex-wrap gap-2">
      <Button variant="outline" onClick={refresh}>Try again</Button>
      {status === 'invalid' && <Button variant="outline" onClick={() => setConfirm(true)}>Reset local resume data</Button>}
    </div>
    <ConfirmDialog open={confirm} onOpenChange={setConfirm} title="Reset local resume data?" description="This removes all saved Resavilo resumes in this browser, including unreadable data. This cannot be undone. Other browser data is not affected." actionLabel="Reset resume data" onConfirm={() => {
      try { reset() } catch (error) { setError(messageOf(error)) }
    }} />
  </div>
}

export function LoadingResumes() {
  return <p role="status" className="flex items-center gap-2 py-12 text-sm text-slate-600"><Loader2 className="size-4 animate-spin" aria-hidden="true" />Loading your workspace…</p>
}

export function EmptyResumes() {
  return <div className={`${glassPanel} flex flex-col items-center px-6 py-16 text-center sm:py-24`}>
    <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-indigo-50 text-[#0C115B]"><FileText className="size-7" aria-hidden="true" /></div>
    <h2 className="text-xl font-semibold text-[#0C115B]">A fresh start for your next chapter</h2>
    <p className="mb-7 mt-3 max-w-md text-sm leading-6 text-slate-600">Build your first resume, one section at a time. Your work stays saved in this browser so you can come back whenever you’re ready.</p>
    <CreateResumeButton>Create your first resume</CreateResumeButton>
  </div>
}

export function updatedLabel(timestamp: string) {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jerusalem' }).format(new Date(timestamp))
}
