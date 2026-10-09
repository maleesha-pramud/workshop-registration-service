import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { homePathFor } from '../routes/navigation'
import { Alert, Button, Card, Field } from '../components/ui'

export default function LoginPage() {
  const { login, status, user, sessionExpired } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  if (status === 'authenticated') return <Navigate to={homePathFor(user)} replace />

  const onSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const signedIn = await login(form.email, form.password)
      const from = location.state?.from?.pathname
      navigate(from && from !== '/' ? from : homePathFor(signedIn), { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-indigo-600 font-semibold text-white">
            WD
          </span>
          <h1 className="text-xl font-semibold text-slate-900">Workshop Desk</h1>
          <p className="text-sm text-slate-500">Sign in with your staff account</p>
        </div>

        <Card className="p-6">
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            {sessionExpired && !error && (
              <Alert tone="warning">Your session ended. Please sign in again.</Alert>
            )}
            {error && <Alert tone="error">{error}</Alert>}

            <Field label="Email">
              {(props) => (
                <input {...props} type="email" autoComplete="username" required autoFocus value={form.email} onChange={set('email')} />
              )}
            </Field>
            <Field label="Password">
              {(props) => (
                <input {...props} type="password" autoComplete="current-password" required value={form.password} onChange={set('password')} />
              )}
            </Field>

            <Button type="submit" className="w-full" loading={submitting}>
              Sign in
            </Button>
          </form>
        </Card>
        <p className="mt-4 text-center text-xs text-slate-500">
          No account? Ask your administrator to create one for you.
        </p>
      </div>
    </div>
  )
}
