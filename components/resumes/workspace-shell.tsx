'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Files, ArrowLeft, HardDrive } from 'lucide-react'
import { ResumesProvider } from './provider'
import { CreateResumeButton } from './shared'
import type { ReactNode } from 'react'

export function WorkspaceShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  return <ResumesProvider>
    <div className="min-h-screen bg-[#f5f6fb] text-slate-800" style={{ backgroundImage: "linear-gradient(rgba(248,249,253,.86), rgba(248,249,253,.94)), url('/images/gradient-background.jpg')", backgroundSize: 'cover', backgroundAttachment: 'fixed' }}>
      <a href="#workspace-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:p-3">Skip to content</a>
      <aside className="border-b border-white/80 bg-white/60 p-5 backdrop-blur-2xl md:fixed md:inset-y-0 md:left-0 md:flex md:w-64 md:flex-col md:border-r md:p-7">
        <Link href="/resumes" aria-label="Resavilo My Resumes" className="block w-36"><img src="/images/resavilo-logo.png" alt="resavilo." width={1458} height={447} className="h-auto w-full" /></Link>
        <nav aria-label="Workspace" className="mt-6 flex gap-2 md:mt-12 md:flex-col">
          {[{ href: '/resumes', label: 'My Resumes', icon: Files }].map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href === '/resumes' && pathname.startsWith('/resumes/'))
            return <Link key={href} href={href} aria-current={active ? 'page' : undefined} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${active ? 'bg-white text-[#0C115B] shadow-sm' : 'text-slate-600 hover:bg-white/60'}`}><Icon className="size-4" aria-hidden="true" />{label}</Link>
          })}
        </nav>
        <div className="mt-5 hidden md:block"><CreateResumeButton /></div>
        <div className="mt-auto hidden pt-10 md:block">
          <div className="rounded-xl border border-white/90 bg-white/55 p-4 text-xs leading-5 text-slate-600"><HardDrive className="mb-2 size-4 text-[#0C115B]" aria-hidden="true" />Saved on this browser.<br />No account or cloud sync yet.</div>
          <Link href="/" className="mt-5 flex items-center gap-2 text-xs text-slate-500 hover:text-[#0C115B]"><ArrowLeft className="size-3" aria-hidden="true" />Back to sign in</Link>
        </div>
      </aside>
      <main id="workspace-content" className="mx-auto max-w-[1600px] p-5 sm:p-8 md:ml-64 lg:p-12">{children}</main>
    </div>
  </ResumesProvider>
}
