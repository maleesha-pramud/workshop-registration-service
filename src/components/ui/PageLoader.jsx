import { Spinner } from './Spinner'

export function PageLoader() {
  return (
    <div className="flex justify-center py-16 text-indigo-600" role="status" aria-label="Loading">
      <Spinner className="h-8 w-8" />
    </div>
  )
}
