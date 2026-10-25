import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'
import { newResume, newExperience, newEducation } from '../lib/resumes/model.ts'

// Compile the presentation component with the existing TypeScript dependency;
// no browser, storage or additional test framework is needed for rendering tests.
const source = readFileSync(new URL('../components/resumes/resume-preview.tsx', import.meta.url), 'utf8')
const output = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
}).outputText
const module = { exports: {} }
new Function('require', 'module', 'exports', output)(createRequire(import.meta.url), module, module.exports)
const { ResumePreview } = module.exports
const render = (resume) => renderToStaticMarkup(createElement(ResumePreview, { resume }))

test('empty drafts show guidance without empty resume sections', () => {
  const html = render(newResume())
  assert.match(html, /Your name/)
  assert.match(html, /Your story starts here/)
  for (const heading of ['Professional summary', 'Experience', 'Education', 'Skills']) assert.ok(!html.includes(`>${heading}</h3>`))
})

test('preview renders current unsaved draft values and all repeatable sections', () => {
  const saved = newResume()
  const draft = {
    ...saved,
    personal: { ...saved.personal, fullName: 'Alex Example', email: 'alex@example.com', phone: '555 0100', location: 'Remote' },
    summary: 'First line\nSecond line',
    experience: [
      { ...newExperience(), jobTitle: 'Designer', current: true, company: 'Example', startDate: '2022-01', description: 'Built useful things.' },
      { ...newExperience(), jobTitle: 'Researcher', endDate: '2021-06' },
      newExperience(),
    ],
    education: [{ ...newEducation(), institution: 'Example University', degree: 'BA', fieldOfStudy: 'Design', startDate: '2018-09', endDate: '2021-06' }],
    skills: [{ id: crypto.randomUUID(), name: 'Research' }],
  }
  const html = render(draft)
  for (const text of ['Alex Example', 'alex@example.com', '555 0100', 'Remote', 'First line\nSecond line', 'Designer', 'Researcher', 'Jan 2022 – Present', 'Jun 2021', 'Example University', 'BA · Design', 'Research']) assert.ok(html.includes(text), text)
  assert.ok(!render(saved).includes('Alex Example'))
  const changed = render({ ...draft, personal: { ...draft.personal, fullName: 'Updated name' }, skills: [] })
  assert.ok(changed.includes('Updated name'))
  assert.ok(!changed.includes('Alex Example'))
  assert.ok(!changed.includes('aria-label="Resume skills"'))
})

test('resume text is escaped and cannot introduce executable HTML', () => {
  const draft = newResume()
  draft.personal.fullName = '<script>alert(1)</script>'
  draft.summary = '<img src=x onerror=alert(1)>'
  const html = render(draft)
  assert.ok(!html.includes('<script>'))
  assert.ok(!html.includes('<img'))
  assert.ok(html.includes('&lt;script&gt;'))
  assert.ok(html.includes('&lt;img'))
})

test('experience and education render in reverse chronology without reordering draft arrays', () => {
  const draft = newResume()
  draft.experience = [
    { ...newExperience(), jobTitle: 'Old role', startDate: '2019-01', endDate: '2020-02' },
    { ...newExperience(), jobTitle: 'Undated role' },
    { ...newExperience(), jobTitle: 'Current role', current: true, startDate: '2024-01' },
    { ...newExperience(), jobTitle: 'Recent role', startDate: '2021-01', endDate: '2023-12' },
  ]
  draft.education = [
    { ...newEducation(), institution: 'Older university', startDate: '2014-09', endDate: '2018-06' },
    { ...newEducation(), institution: 'Recent university', startDate: '2022-09', endDate: '2024-06' },
  ]
  const originalIds = draft.experience.map((item) => item.id)
  const html = render(draft)
  const positions = ['Current role', 'Recent role', 'Old role', 'Undated role'].map((text) => html.indexOf(text))
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b))
  assert.ok(html.indexOf('Recent university') < html.indexOf('Older university'))
  assert.deepEqual(draft.experience.map((item) => item.id), originalIds)
})

test('optional sections render semantic bullets and safe clickable professional links', () => {
  const draft = newResume()
  draft.personal.linkedin = 'https://linkedin.com/in/alex-example'
  draft.personal.portfolio = 'javascript:alert(1)'
  draft.experience = [{ ...newExperience(), achievements: [{ id: crypto.randomUUID(), text: 'Improved reliability by 20%.' }] }]
  draft.languages = [{ id: crypto.randomUUID(), name: 'English', proficiency: 'C1' }]
  draft.certifications = [{ id: crypto.randomUUID(), name: 'Example certificate', issuer: 'Example institute', date: '2025-06', credentialUrl: 'https://example.com/certificate' }]
  const html = render(draft)
  assert.match(html, /aria-label="Achievements"/)
  assert.match(html, /<li[^>]*>Improved reliability by 20%\.<\/li>/)
  assert.ok(html.includes('English — C1'))
  assert.ok(html.includes('Example certificate'))
  assert.ok(html.includes('Example institute'))
  assert.ok(html.includes('Jun 2025'))
  assert.ok(html.includes('href="https://linkedin.com/in/alex-example"'))
  assert.ok(!html.includes('href="javascript:'))
  assert.match(html, /rel="noopener noreferrer"/)
})

test('profile-style selections appear in preview with explicit current status and credentials', () => {
  const draft = newResume()
  draft.experience = [{ ...newExperience(), jobTitle: 'Consultant', company: 'Example', employmentType: 'Contract', current: true, startDate: '2025-01' }]
  draft.languages = [{ id: crypto.randomUUID(), name: 'English', proficiency: 'Professional working proficiency' }]
  draft.certifications = [{ id: crypto.randomUUID(), name: 'Example certificate', issuer: 'Example institute', date: '2025-01', expirationDate: '2027-01', credentialId: 'CERT-123', doesNotExpire: false, credentialUrl: '' }]
  let html = render(draft)
  for (const text of ['Contract', 'Jan 2025 – Present', 'Professional working proficiency', 'Credential ID: CERT-123', 'Expires Jan 2027']) assert.ok(html.includes(text), text)
  draft.experience[0].current = false
  draft.certifications[0].expirationDate = ''
  draft.certifications[0].doesNotExpire = true
  html = render(draft)
  assert.ok(!html.includes('Jan 2025 – Present'))
  assert.ok(html.includes('No expiration date'))
})
