import { z } from 'zod'

const id = z.string().uuid()
const shortText = z.string().max(200)
const month = z.string().regex(/^(?:\d{4}-(?:0[1-9]|1[0-2]))?$/, 'Select both a month and a year.')
const webLink = z.union([
  z.literal(''),
  z.string().trim().max(500).url('Enter a full URL, including https://.').refine((value) => {
    try { return ['https:', 'http:'].includes(new URL(value).protocol) } catch { return false }
  }, 'Use an http:// or https:// link.'),
])
const linkedIn = webLink.refine((value) => {
  if (!value) return true
  try { const host = new URL(value).hostname; return host === 'linkedin.com' || host.endsWith('.linkedin.com') } catch { return false }
}, 'Use a linkedin.com profile URL.')
export const languageLevels = [
  '', 'Elementary proficiency', 'Limited working proficiency',
  'Professional working proficiency', 'Full professional proficiency', 'Native or bilingual proficiency',
] as const
// Preserve existing CEFR values without inventing an equivalence to another scale.
export const legacyLanguageLevels = ['Native / bilingual', 'C2', 'C1', 'B2', 'B1', 'A2', 'A1'] as const
const achievementSchema = z.object({ id, text: z.string().max(1000) })
const languageSchema = z.object({ id, name: shortText, proficiency: z.enum([...languageLevels, ...legacyLanguageLevels]) })
const certificationSchema = z.object({
  id, name: shortText, issuer: shortText, date: month, credentialUrl: webLink,
  credentialId: shortText.default(''), expirationDate: month.default(''), doesNotExpire: z.boolean().default(false),
}).refine((value) => !value.date || !value.expirationDate || value.expirationDate >= value.date, {
  message: 'Expiration date must be on or after issue date.', path: ['expirationDate'],
}).refine((value) => !value.doesNotExpire || !value.expirationDate, {
  message: 'Remove the expiration date for a credential that does not expire.', path: ['expirationDate'],
})
const timestamp = z.string().datetime()
const dateRange = <T extends { startDate: string; endDate: string }>(value: T) =>
  !value.startDate || !value.endDate || value.endDate >= value.startDate

export const experienceSchema = z.object({
  id,
  jobTitle: shortText,
  company: shortText,
  employmentType: z.string().max(80).default(''),
  current: z.boolean().optional(),
  location: shortText,
  startDate: month,
  endDate: month,
  description: z.string().max(10000),
  achievements: z.array(achievementSchema).max(30).default([]),
}).refine(dateRange, { message: 'End date must be on or after start date.', path: ['endDate'] })
  .refine((entry) => !entry.current || !entry.endDate, { message: 'Clear the end date for a current entry.', path: ['endDate'] })

export const educationSchema = z.object({
  id,
  institution: shortText,
  current: z.boolean().optional(),
  degree: shortText,
  fieldOfStudy: shortText,
  startDate: month,
  endDate: month,
}).refine(dateRange, { message: 'End date must be on or after start date.', path: ['endDate'] })
  .refine((entry) => !entry.current || !entry.endDate, { message: 'Clear the end date for a current entry.', path: ['endDate'] })

export const resumeSchema = z.object({
  schemaVersion: z.literal(1),
  id,
  title: z.string().trim().min(1, 'Give your resume a title.').max(120),
  createdAt: timestamp,
  updatedAt: timestamp,
  personal: z.object({
    fullName: shortText,
    email: z.union([z.literal(''), z.string().email('Enter a valid email.').max(254)]),
    phone: z.string().max(60),
    location: shortText,
    linkedin: linkedIn.default(''),
    portfolio: webLink.default(''),
  }),
  summary: z.string().max(10000),
  experience: z.array(experienceSchema).max(50),
  education: z.array(educationSchema).max(50),
  skills: z.array(z.object({ id, name: z.string().trim().min(1).max(80) })).max(100),
  languages: z.array(languageSchema).max(30).default([]),
  certifications: z.array(certificationSchema).max(50).default([]),
}).superRefine((resume, ctx) => {
  const ids = [...resume.experience, ...resume.education, ...resume.skills, ...resume.languages, ...resume.certifications, ...resume.experience.flatMap((entry) => entry.achievements)].map((entry) => entry.id)
  if (new Set(ids).size !== ids.length) ctx.addIssue({ code: 'custom', message: 'Entry IDs must be unique.' })
  if (resume.updatedAt < resume.createdAt) ctx.addIssue({ code: 'custom', message: 'Invalid resume timestamps.' })
})

export type Resume = z.infer<typeof resumeSchema>
export type Experience = z.infer<typeof experienceSchema>
export type Achievement = z.infer<typeof achievementSchema>
export type Language = z.infer<typeof languageSchema>
export type Certification = z.infer<typeof certificationSchema>
export type Education = z.infer<typeof educationSchema>

export function newResume(): Resume {
  const now = new Date().toISOString()
  return {
    schemaVersion: 1, id: crypto.randomUUID(), title: 'Untitled resume',
    createdAt: now, updatedAt: now,
    personal: { fullName: '', email: '', phone: '', location: '', linkedin: '', portfolio: '' },
    summary: '', experience: [], education: [], skills: [], languages: [], certifications: [],
  }
}

export function newExperience(): Experience {
  return { id: crypto.randomUUID(), jobTitle: '', company: '', employmentType: '', current: false, location: '', startDate: '', endDate: '', description: '', achievements: [] }
}

export function newEducation(): Education {
  return { id: crypto.randomUUID(), institution: '', current: false, degree: '', fieldOfStudy: '', startDate: '', endDate: '' }
}

export function newLanguage(): Language {
  return { id: crypto.randomUUID(), name: '', proficiency: '' }
}

export function newCertification(): Certification {
  return { id: crypto.randomUUID(), name: '', issuer: '', date: '', credentialUrl: '', credentialId: '', expirationDate: '', doesNotExpire: false }
}
