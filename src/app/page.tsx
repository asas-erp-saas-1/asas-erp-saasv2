import { redirect } from 'next/navigation'

export default function RootPage() {
  // Redirect to dashboard overview by default.
  // The layout/middleware should handle auth checks and redirect to login if unauthenticated.
  redirect('/dashboard/overview')
}
