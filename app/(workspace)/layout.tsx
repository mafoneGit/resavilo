import type { ReactNode } from 'react'
import { WorkspaceShell } from '@/components/resumes/workspace-shell'

export const metadata = { title: 'Workspace - resavilo.', description: 'Create, edit and manage your resumes.' }
export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return <WorkspaceShell>{children}</WorkspaceShell>
}
