import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { homePathFor } from '../routes/navigation'
import { Card } from '../components/ui'

export default function ForbiddenPage() {
  const { user } = useAuth()
  return (
    <Card className="mx-auto max-w-md p-8 text-center">
      <h1 className="text-lg font-semibold text-slate-900">You don't have access to this page</h1>
      <p className="mt-2 text-sm text-slate-500">If you think you should, ask your administrator.</p>
      <Link
        to={homePathFor(user)}
        className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:underline"
      >
        Go to my home page
      </Link>
    </Card>
  )
}
