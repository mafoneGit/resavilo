import type { ReactNode } from 'react'
import { glassPanel } from './shared'

export function EditorSection({ id, title, hint, children, action }: { id: string; title: string; hint: string; children: ReactNode; action?: ReactNode }) {
  return <section id={id} className={`${glassPanel} scroll-mt-6 p-5 sm:p-7`} aria-labelledby={`${id}-heading`}>
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4"><div><h2 id={`${id}-heading`} className="text-lg font-semibold text-[#0C115B]">{title}</h2><p className="mt-1 text-xs leading-5 text-slate-500">{hint}</p></div>{action}</div>
    {children}
  </section>
}
