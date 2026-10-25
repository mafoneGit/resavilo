import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { after, before, test } from 'node:test'

let server
const base = process.env.SECURITY_TEST_URL || 'http://127.0.0.1:3107'

before(async () => {
  if (process.env.SECURITY_TEST_URL) return
  server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '3107'], {
    env: { ...process.env, NODE_ENV: 'production' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let output = ''
  server.stdout.on('data', (chunk) => { output += chunk })
  server.stderr.on('data', (chunk) => { output += chunk })
  for (let i = 0; i < 100; i++) {
    if (server.exitCode !== null) throw new Error(output)
    if (output.includes('Ready in')) return
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error(`Server did not start: ${output}`)
})

after(async () => {
  if (server && server.exitCode === null) {
    const stopped = once(server, 'exit')
    server.kill('SIGTERM')
    await stopped
  }
})

test('production responses enforce security headers and nonces', async () => {
  const response = await fetch(base, { headers: { 'x-nonce': 'attacker-controlled' } })
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('x-powered-by'), null)
  assert.equal(response.headers.get('x-frame-options'), 'DENY')
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff')
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer')
  assert.match(response.headers.get('strict-transport-security'), /max-age=31536000/)
  assert.match(response.headers.get('cache-control'), /no-store/)
  const policy = response.headers.get('content-security-policy')
  const scripts = policy.split(';').find((part) => part.trim().startsWith('script-src'))
  assert.ok(scripts)
  assert.doesNotMatch(scripts, /unsafe-inline|unsafe-eval|attacker-controlled/)
  assert.match(policy, /frame-ancestors 'none'/)
  assert.match(policy, /form-action 'none'/)
  const nonce = scripts.match(/'nonce-([^']+)'/)[1]
  const html = await response.text()
  const tags = [...html.matchAll(/<script\b([^>]*)>/g)]
  assert.ok(tags.length > 0)
  for (const [, attributes] of tags) assert.ok(attributes.includes(`nonce="${nonce}"`))
  const second = await fetch(base)
  assert.ok(!second.headers.get('content-security-policy').includes(`'nonce-${nonce}'`))
  await second.body.cancel()
})

test('login and registration are previews with no credential submission fallback', async () => {
  for (const path of ['/', '/register']) {
    const response = await fetch(`${base}${path}`)
    assert.equal(response.status, 200)
    const html = await response.text()
    assert.match(html, /Preview only. Do not use a real password/)
    assert.match(html, /<form[^>]*method="post"/)
    assert.match(response.headers.get('content-security-policy'), /form-action 'none'/)
    assert.match(html, path === '/register' ? /Preview registration/ : /Preview sign-in/)
    for (const id of path === '/register' ? ['name', 'email', 'password', 'confirmPassword'] : ['email', 'password']) {
      const input = [...html.matchAll(/<input\b[^>]*>/g)].find(([tag]) => tag.includes(`id="${id}"`))
      assert.ok(input)
      assert.doesNotMatch(input[0], /\sdisabled(?:="")?(?=\s|\/?>)/)
    }
    const disabledButtons = [...html.matchAll(/<button\b[^>]*\sdisabled=""[^>]*>/g)]
    assert.equal(disabledButtons.length, 4)
  }
  const response = await fetch(`${base}/api/auth/sign-up/email`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}',
  })
  assert.equal(response.status, 404)
})

test('workspace routes render navigation without server-side storage access', async () => {
  for (const path of ['/resumes', '/resumes/12345678-1234-4234-8234-123456789abc']) {
    const response = await fetch(`${base}${path}`)
    assert.equal(response.status, 200)
    const html = await response.text()
    assert.match(html, /aria-label="Workspace"/)
    assert.match(html, /My Resumes/)
    assert.doesNotMatch(html, /href="\/dashboard"/)
    assert.match(html, /Loading your workspace/)
    assert.match(response.headers.get('cache-control'), /no-store/)
  }
})

// Keep old bookmarks working without a duplicate workspace page.
test('dashboard redirects to the sole My Resumes page', async () => {
  const response = await fetch(`${base}/dashboard`, { redirect: 'manual' })
  assert.equal(response.status, 307)
  assert.equal(new URL(response.headers.get('location'), base).pathname, '/resumes')
})
