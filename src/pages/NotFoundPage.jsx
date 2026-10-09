import { Link } from 'react-router-dom'
import { Card } from '../components/ui'

export default function NotFoundPage() {
  return (
    <Card className="mx-auto max-w-md p-8 text-center">
      <h1 className="text-lg font-semibold text-slate-900">Page not found</h1>
      <p className="mt-2 text-sm text-slate-500">The page you were looking for doesn't exist.</p>
      <Link to="/" className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:underline">
        Back to start
      </Link>
    </Card>
  )
}
