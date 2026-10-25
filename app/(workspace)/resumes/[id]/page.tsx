import { ResumeEditorLoader } from '@/components/resumes/resume-editor'
export const metadata = { title: 'Resume editor - resavilo.' }
export default async function ResumeEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ResumeEditorLoader id={id} />
}
