import { redirect } from 'next/navigation'

export default function AdminLoginPage() {
  // Redirect to unified sign-in page
  redirect('/sign-in')
}
