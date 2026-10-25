'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { newResume, type Resume } from '@/lib/resumes/model'
import { readResumes, saveResume, deleteResume, resetResumeStorage, RESUME_STORAGE_KEY, type StorageResult } from '@/lib/resumes/storage'

type Context = StorageResult & {
  loaded: boolean
  refresh: () => void
  create: () => Resume
  save: (resume: Resume, revision: string) => Resume
  remove: (resume: Resume) => void
  reset: () => void
}
const ResumesContext = createContext<Context | null>(null)

export function ResumesProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StorageResult>({ status: 'ready', resumes: [] })
  const [loaded, setLoaded] = useState(false)
  const refresh = useCallback(() => { setState(readResumes()); setLoaded(true) }, [])
  useEffect(() => {
    refresh()
    const onStorage = (event: StorageEvent) => {
      if (event.key === RESUME_STORAGE_KEY || event.key === null) refresh()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [refresh])
  function create() { const resume = saveResume(newResume(), null); refresh(); return resume }
  function save(resume: Resume, revision: string) { const saved = saveResume(resume, revision); refresh(); return saved }
  function remove(resume: Resume) { deleteResume(resume.id, resume.updatedAt); refresh() }
  function reset() { resetResumeStorage(); refresh() }
  return <ResumesContext.Provider value={{ ...state, loaded, refresh, create, save, remove, reset }}>{children}</ResumesContext.Provider>
}

export function useResumes() {
  const context = useContext(ResumesContext)
  if (!context) throw new Error('Resume workspace is required.')
  return context
}
