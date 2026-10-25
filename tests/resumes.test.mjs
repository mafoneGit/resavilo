import assert from 'node:assert/strict'
import { test } from 'node:test'
import { newResume, newExperience, newEducation, resumeSchema } from '../lib/resumes/model.ts'
import { saveResume, readResumes, deleteResume, resetResumeStorage, RESUME_STORAGE_KEY } from '../lib/resumes/storage.ts'

function storage() {
  const values = new Map()
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) }
}

test('create, edit all sections, save, reopen and delete retain IDs and data', () => {
  const db = storage()
  assert.deepEqual(readResumes(db).resumes, [])
  const original = saveResume(newResume(), null, db)
  const draft = {
    ...original, title: 'Product designer', personal: { fullName: 'Alex Example', email: 'alex@example.com', phone: '+1 555 0100', location: 'Remote' }, summary: 'A focused summary.',
    experience: [{ ...newExperience(), company: 'Example', jobTitle: 'Designer', startDate: '2022-01', endDate: '2025-06', description: 'Designed products.' }, newExperience()],
    education: [{ ...newEducation(), institution: 'Example University', degree: 'BA', fieldOfStudy: 'Design', startDate: '2018-09', endDate: '2021-06' }, newEducation()],
    skills: [{ id: crypto.randomUUID(), name: 'Research' }],
  }
  const saved = saveResume(draft, original.updatedAt, db)
  assert.equal(saved.id, original.id)
  assert.equal(saved.createdAt, original.createdAt)
  assert.ok(saved.updatedAt > original.updatedAt)
  assert.deepEqual(readResumes(db).resumes[0], saved)
  const reopened = saveResume({ ...saved, skills: [], experience: saved.experience.slice(1), education: saved.education.slice(1) }, saved.updatedAt, db)
  assert.equal(reopened.experience.length, 1)
  assert.equal(reopened.education.length, 1)
  assert.deepEqual(reopened.skills, [])
  deleteResume(saved.id, reopened.updatedAt, db)
  assert.deepEqual(readResumes(db).resumes, [])
})

test('invalid JSON, unsupported versions and malformed records are preserved, never overwritten', () => {
  const db = storage()
  for (const value of ['{broken', 'null', '{"version":2,"resumes":[]}', '{"version":1,"resumes":[{}]}']) {
    db.setItem(RESUME_STORAGE_KEY, value)
    assert.equal(readResumes(db).status, 'invalid')
    assert.throws(() => saveResume(newResume(), null, db))
    assert.equal(db.getItem(RESUME_STORAGE_KEY), value)
  }
  db.setItem('unrelated', 'keep')
  resetResumeStorage(db)
  assert.equal(readResumes(db).status, 'ready')
  assert.equal(db.getItem('unrelated'), 'keep')
})

test('denied storage and quota errors do not report a successful save', () => {
  assert.equal(readResumes({ getItem() { throw new Error('Denied') } }).status, 'unavailable')
  const db = storage()
  const original = saveResume(newResume(), null, db)
  const quota = { ...db, setItem() { throw new Error('QuotaExceededError') } }
  assert.throws(() => saveResume({ ...original, title: 'Changed' }, original.updatedAt, quota), /Could not save/)
  assert.equal(readResumes(db).resumes[0].title, original.title)
})

test('stale edits and deletion cannot overwrite a newer record or resurrect a deleted record', () => {
  const db = storage()
  const original = saveResume(newResume(), null, db)
  const newer = saveResume({ ...original, title: 'Newer tab' }, original.updatedAt, db)
  assert.throws(() => saveResume({ ...original, title: 'Stale tab' }, original.updatedAt, db), /another tab/)
  assert.throws(() => deleteResume(original.id, original.updatedAt, db), /another tab/)
  deleteResume(newer.id, newer.updatedAt, db)
  assert.throws(() => saveResume(original, original.updatedAt, db), /another tab/)
})

test('drafts allow empty sections but reject invalid email, reversed dates and duplicate IDs', () => {
  const draft = newResume()
  assert.ok(resumeSchema.safeParse(draft).success)
  assert.equal(resumeSchema.safeParse({ ...draft, title: '   ' }).success, false)
  assert.equal(resumeSchema.safeParse({ ...draft, personal: { ...draft.personal, email: 'invalid' } }).success, false)
  const experience = { ...newExperience(), startDate: '2025-04', endDate: '2024-01' }
  assert.equal(resumeSchema.safeParse({ ...draft, experience: [experience] }).success, false)
  assert.equal(resumeSchema.safeParse({ ...draft, experience: [newExperience()], education: [newEducation()] }).success, true)
  const entry = newExperience()
  assert.equal(resumeSchema.safeParse({ ...draft, experience: [entry, entry] }).success, false)
})

test('latest updates sort first and separate resumes stay independent', () => {
  const db = storage()
  const first = saveResume(newResume(), null, db)
  const second = saveResume(newResume(), null, db)
  const updated = saveResume({ ...first, title: 'Updated first', updatedAt: first.updatedAt }, first.updatedAt, db)
  assert.deepEqual(new Set(readResumes(db).resumes.map((resume) => resume.id)), new Set([first.id, second.id]))
  assert.equal(readResumes(db).resumes.find((resume) => resume.id === first.id).title, updated.title)
  deleteResume(second.id, second.updatedAt, db)
  assert.equal(readResumes(db).resumes[0].id, first.id)
})

test('legacy resumes gain optional fields without changing stored data or existing descriptions', () => {
  const db = storage()
  const old = newResume()
  delete old.personal.linkedin
  delete old.personal.portfolio
  delete old.languages
  delete old.certifications
  const experience = { ...newExperience(), description: 'Original free text must survive.' }
  delete experience.achievements
  old.experience = [experience]
  const raw = JSON.stringify({ version: 1, resumes: [old] })
  db.setItem(RESUME_STORAGE_KEY, raw)
  const result = readResumes(db)
  assert.equal(result.status, 'ready')
  assert.equal(db.getItem(RESUME_STORAGE_KEY), raw)
  const migrated = result.resumes[0]
  assert.equal(migrated.personal.linkedin, '')
  assert.equal(migrated.personal.portfolio, '')
  assert.deepEqual(migrated.languages, [])
  assert.deepEqual(migrated.certifications, [])
  assert.deepEqual(migrated.experience[0].achievements, [])
  assert.equal(migrated.experience[0].description, experience.description)
  assert.equal(saveResume(migrated, old.updatedAt, db).id, old.id)
})

test('professional links, achievements, languages and certifications persist together', () => {
  const db = storage()
  const draft = newResume()
  draft.personal.linkedin = 'https://www.linkedin.com/in/alex-example'
  draft.personal.portfolio = 'https://example.com/portfolio'
  draft.experience = [{ ...newExperience(), achievements: [{ id: crypto.randomUUID(), text: 'Reduced lead time by 20%.' }] }]
  draft.languages = [{ id: crypto.randomUUID(), name: 'English', proficiency: 'C1' }]
  draft.certifications = [{ id: crypto.randomUUID(), name: 'Example certificate', issuer: 'Example institute', date: '2025-06', credentialUrl: 'https://example.com/certificate' }]
  const saved = saveResume(draft, null, db)
  assert.deepEqual(readResumes(db).resumes[0], saved)
  draft.personal.portfolio = 'javascript:alert(1)'
  assert.equal(resumeSchema.safeParse(draft).success, false)
  draft.personal.portfolio = 'https://example.com'
  draft.personal.linkedin = 'https://linkedin.com.attacker.example/in/test'
  assert.equal(resumeSchema.safeParse(draft).success, false)
})

test('LinkedIn-style proficiency and existing CEFR selections both remain valid', () => {
  const db = storage()
  const draft = newResume()
  const levels = ['Elementary proficiency', 'Limited working proficiency', 'Professional working proficiency', 'Full professional proficiency', 'Native or bilingual proficiency', 'C1', 'Native / bilingual']
  draft.languages = levels.map((proficiency, index) => ({ id: crypto.randomUUID(), name: `Language ${index}`, proficiency }))
  const saved = saveResume(draft, null, db)
  assert.deepEqual(readResumes(db).resumes[0].languages.map((item) => item.proficiency), levels)
  const updated = saveResume(saved, saved.updatedAt, db)
  assert.equal(updated.languages[5].proficiency, 'C1')
})

test('current roles, employment type and certification validity persist with validation', () => {
  const db = storage()
  const draft = newResume()
  draft.experience = [{ ...newExperience(), jobTitle: 'Engineer', employmentType: 'Contract', current: true, startDate: '2025-01' }]
  draft.certifications = [{ id: crypto.randomUUID(), name: 'Example credential', issuer: 'Example institute', date: '2025-01', expirationDate: '2027-01', doesNotExpire: false, credentialId: 'CERT-123', credentialUrl: '' }]
  const saved = saveResume(draft, null, db)
  assert.equal(readResumes(db).resumes[0].experience[0].employmentType, 'Contract')
  assert.equal(readResumes(db).resumes[0].certifications[0].credentialId, 'CERT-123')
  assert.equal(saved.experience[0].current, true)
  draft.experience[0].endDate = '2026-01'
  assert.equal(resumeSchema.safeParse(draft).success, false)
  draft.experience[0].endDate = ''
  draft.certifications[0].expirationDate = '2024-01'
  assert.equal(resumeSchema.safeParse(draft).success, false)
  draft.certifications[0].expirationDate = '2027-01'
  draft.certifications[0].doesNotExpire = true
  assert.equal(resumeSchema.safeParse(draft).success, false)
})
