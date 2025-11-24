import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'

export default async function DashboardPage() {
  // Get current session
  const session = await getSession()

  // If no session, redirect to sign-in
  if (!session) {
    redirect('/sign-in')
  }

  // Redirect based on role
  switch (session.role) {
    case 'admin':
      redirect('/admin')
    case 'professor':
      redirect('/professor')
    case 'student':
      redirect('/student')
    default:
      redirect('/sign-in')
  }
}
