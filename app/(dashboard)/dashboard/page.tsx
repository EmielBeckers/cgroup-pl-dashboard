import { redirect } from 'next/navigation'

// The mock dashboard is retired (honest-mode): the real group overview
// lives at /group. Old bookmarks land there.
export default function DashboardRedirect() {
  redirect('/group')
}
