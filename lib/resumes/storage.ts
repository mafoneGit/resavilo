import { z } from 'zod'
import { resumeSchema, type Resume } from './model.ts'

export const RESUME_STORAGE_KEY = 'resavilo.resumes.v1'
const MAX_STORAGE_LENGTH = 4_000_000
const envelope = z.object({ version: z.literal(1), resumes: z.array(resumeSchema).max(100) })
export type ResumeStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
export type StorageResult = {
  status: 'ready' | 'invalid' | 'unavailable'
  resumes: Resume[]
  message?: string
}

function browserStorage(): ResumeStorage {
  if (typeof window === 'undefined') throw new Error('Browser storage is unavailable.')
  return window.localStorage
}

export function readResumes(storage?: ResumeStorage): StorageResult {
  let raw: string | null
  try { raw = (storage ?? browserStorage()).getItem(RESUME_STORAGE_KEY) }
  catch { return { status: 'unavailable', resumes: [], message: 'Browser storage is unavailable. Enable local storage and try again.' } }
  if (raw === null) return { status: 'ready', resumes: [] }
  try {
    if (raw.length > MAX_STORAGE_LENGTH) throw new Error('Too much data')
    const parsed = envelope.parse(JSON.parse(raw))
    if (new Set(parsed.resumes.map((resume) => resume.id)).size !== parsed.resumes.length) throw new Error('Duplicate IDs')
    return { status: 'ready', resumes: parsed.resumes.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) }
  } catch {
    return { status: 'invalid', resumes: [], message: 'Saved resume data could not be read. It has been kept untouched to prevent data loss.' }
  }
}

function writable(storage?: ResumeStorage) {
  const target = storage ?? browserStorage()
  const state = readResumes(target)
  if (state.status !== 'ready') throw new Error(state.message)
  return { target, resumes: state.resumes }
}

function write(resumes: Resume[], storage: ResumeStorage) {
  const data = JSON.stringify(envelope.parse({ version: 1, resumes }))
  if (data.length > MAX_STORAGE_LENGTH) throw new Error('Local storage is full. Shorten this resume or remove an unused one, then save again.')
  try { storage.setItem(RESUME_STORAGE_KEY, data) }
  catch { throw new Error('Could not save to browser storage. Your edits are still here. Free some space or enable storage and try again.') }
}

/** expectedUpdatedAt prevents silent overwrites from another tab or a stale editor. */
export function saveResume(draft: Resume, expectedUpdatedAt: string | null, storage?: ResumeStorage): Resume {
  const { target, resumes } = writable(storage)
  const parsed = resumeSchema.parse(draft)
  const existing = resumes.find((resume) => resume.id === parsed.id)
  if (expectedUpdatedAt === null ? !!existing : !existing || existing.updatedAt !== expectedUpdatedAt) {
    throw new Error('This resume changed or was deleted in another tab. Reload the saved version before continuing.')
  }
  const saved: Resume = {
    ...parsed,
    createdAt: existing?.createdAt ?? parsed.createdAt,
    updatedAt: new Date(Math.max(Date.now(), existing ? Date.parse(existing.updatedAt) + 1 : Date.parse(parsed.createdAt))).toISOString(),
  }
  write(existing ? resumes.map((resume) => resume.id === saved.id ? saved : resume) : [saved, ...resumes], target)
  return saved
}

export function deleteResume(id: string, expectedUpdatedAt: string, storage?: ResumeStorage) {
  const { target, resumes } = writable(storage)
  const existing = resumes.find((resume) => resume.id === id)
  if (existing && existing.updatedAt !== expectedUpdatedAt) throw new Error('This resume changed in another tab. Review it before deleting.')
  write(resumes.filter((resume) => resume.id !== id), target)
}

/** Only called after explicit user confirmation; removes our key, never other app data. */
export function resetResumeStorage(storage?: ResumeStorage) {
  try { (storage ?? browserStorage()).removeItem(RESUME_STORAGE_KEY) }
  catch { throw new Error('Could not reset local resume storage.') }
}
