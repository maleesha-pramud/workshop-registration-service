import { useState } from 'react'
import { usersApi } from '../api/endpoints'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { ROLE_LABELS } from '../utils/labels'
import { formatDate } from '../utils/dates'
import { Alert, Badge, Button, Card, EmptyState, Field, Modal, PageHeader, PageLoader, Pagination } from '../components/ui'

const ROLE_HELP = {
  ADMIN: 'Manages staff accounts only',
  MANAGER: 'Schedules workshops and handles registrations',
  STAFF: 'Registers and cancels attendees',
}

export default function UsersPage() {
  const { user: me } = useAuth()
  const [params, setParams] = useState({ q: '', page: 1 })
  const { data: users, meta, loading, error, reload } = useApi(
    () => usersApi.list({ q: params.q || undefined, page: params.page, pageSize: 20 }),
    [params],
  )
  const [modal, setModal] = useState(null) // { type: 'create' | 'edit' | 'password', user? }
  const close = () => setModal(null)
  const done = () => {
    close()
    reload()
  }

  return (
    <>
      <PageHeader
        title="Staff accounts"
        subtitle="Create accounts for your team and choose what each person can do."
        actions={<Button onClick={() => setModal({ type: 'create' })}>Add staff member</Button>}
      />

      <Card>
        <div className="border-b border-slate-200 p-4">
          <input
            type="search"
            placeholder="Search by name or email"
            aria-label="Search staff"
            className="w-full max-w-sm rounded-lg border-0 px-3 py-2 text-sm ring-1 ring-slate-300 focus:ring-2 focus:ring-indigo-600"
            value={params.q}
            onChange={(e) => setParams({ q: e.target.value, page: 1 })}
          />
        </div>

        {error && <Alert tone="error" className="m-4">{error.message}</Alert>}
        {loading && !users ? (
          <PageLoader />
        ) : users?.length === 0 ? (
          <EmptyState title="No accounts found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Added</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users?.map((u) => (
                  <tr key={u.id} className={u.isActive ? '' : 'text-slate-400'}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">
                        {u.name} {u.id === me.id && <span className="text-xs font-normal text-slate-500">(you)</span>}
                      </p>
                      <p className="text-slate-500">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">{ROLE_LABELS[u.role]}</td>
                    <td className="px-4 py-3">
                      <Badge tone={u.isActive ? 'green' : 'gray'}>{u.isActive ? 'Active' : 'Deactivated'}</Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Button size="sm" variant="ghost" onClick={() => setModal({ type: 'edit', user: u })}>
                        Edit
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setModal({ type: 'password', user: u })}>
                        Reset password
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination meta={meta} onPage={(page) => setParams((p) => ({ ...p, page }))} />
      </Card>

      {modal?.type === 'create' && <CreateUserModal onClose={close} onDone={done} />}
      {modal?.type === 'edit' && <EditUserModal user={modal.user} isSelf={modal.user.id === me.id} onClose={close} onDone={done} />}
      {modal?.type === 'password' && <ResetPasswordModal user={modal.user} onClose={close} onDone={done} />}
    </>
  )
}

function RoleSelect({ value, onChange, disabled, error }) {
  return (
    <Field label="Role" error={error} hint={ROLE_HELP[value]}>
      {(props) => (
        <select {...props} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
          <option value="STAFF">{ROLE_LABELS.STAFF}</option>
          <option value="MANAGER">{ROLE_LABELS.MANAGER}</option>
          <option value="ADMIN">{ROLE_LABELS.ADMIN}</option>
        </select>
      )}
    </Field>
  )
}

/** Shared submit handling: field errors under inputs, everything else in an alert. */
function useFormSubmit(onDone, successMessage) {
  const { notify } = useToast()
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (action) => {
    setSubmitting(true)
    setErrors({})
    setFormError(null)
    try {
      await action()
      notify(successMessage)
      onDone()
    } catch (err) {
      const fieldErrors = err.fieldErrors?.() ?? {}
      if (err.code === 'EMAIL_TAKEN') fieldErrors.email = err.message
      setErrors(fieldErrors)
      if (!Object.keys(fieldErrors).length) setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }
  return { errors, formError, submitting, submit }
}

function CreateUserModal({ onClose, onDone }) {
  const [form, setForm] = useState({ name: '', email: '', role: 'STAFF', password: '' })
  const { errors, formError, submitting, submit } = useFormSubmit(onDone, 'Account created')
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  return (
    <Modal
      open
      title="Add staff member"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="create-user" loading={submitting}>Create account</Button>
        </>
      }
    >
      <form id="create-user" className="space-y-4" noValidate onSubmit={(e) => { e.preventDefault(); submit(() => usersApi.create(form)) }}>
        {formError && <Alert tone="error">{formError}</Alert>}
        <Field label="Full name" error={errors.name}>
          {(p) => <input {...p} value={form.name} onChange={set('name')} autoFocus />}
        </Field>
        <Field label="Email" error={errors.email}>
          {(p) => <input {...p} type="email" value={form.email} onChange={set('email')} />}
        </Field>
        <RoleSelect value={form.role} onChange={(role) => setForm((f) => ({ ...f, role }))} error={errors.role} />
        <Field label="Temporary password" error={errors.password} hint="At least 8 characters. Share it with them in person.">
          {(p) => <input {...p} type="text" autoComplete="new-password" value={form.password} onChange={set('password')} />}
        </Field>
      </form>
    </Modal>
  )
}

function EditUserModal({ user, isSelf, onClose, onDone }) {
  const [form, setForm] = useState({ name: user.name, role: user.role, isActive: user.isActive })
  const { errors, formError, submitting, submit } = useFormSubmit(onDone, 'Account updated')

  const onSubmit = (e) => {
    e.preventDefault()
    // Only send what changed, so the audit log records exactly what was done.
    const changes = Object.fromEntries(Object.entries(form).filter(([k, v]) => v !== user[k]))
    if (!Object.keys(changes).length) return onClose()
    submit(() => usersApi.update(user.id, changes))
  }

  return (
    <Modal
      open
      title={`Edit ${user.name}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="edit-user" loading={submitting}>Save changes</Button>
        </>
      }
    >
      <form id="edit-user" className="space-y-4" noValidate onSubmit={onSubmit}>
        {formError && <Alert tone="error">{formError}</Alert>}
        {isSelf && <Alert tone="info">You can't change your own role or deactivate your own account.</Alert>}
        <Field label="Full name" error={errors.name}>
          {(p) => <input {...p} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />}
        </Field>
        <p className="text-sm text-slate-500">{user.email}</p>
        <RoleSelect value={form.role} onChange={(role) => setForm((f) => ({ ...f, role }))} disabled={isSelf} error={errors.role} />
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600"
            checked={form.isActive}
            disabled={isSelf}
            onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
          />
          <span>
            <span className="font-medium text-slate-900">Account active</span>
            <span className="block text-slate-500">
              Deactivated staff are signed out immediately. Their history is kept.
            </span>
          </span>
        </label>
      </form>
    </Modal>
  )
}

function ResetPasswordModal({ user, onClose, onDone }) {
  const [password, setPassword] = useState('')
  const { errors, formError, submitting, submit } = useFormSubmit(onDone, `Password reset for ${user.name}`)

  return (
    <Modal
      open
      title={`Reset password for ${user.name}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="reset-password" loading={submitting}>Set password</Button>
        </>
      }
    >
      <form id="reset-password" className="space-y-4" noValidate onSubmit={(e) => { e.preventDefault(); submit(() => usersApi.resetPassword(user.id, password)) }}>
        {formError && <Alert tone="error">{formError}</Alert>}
        <Field label="New temporary password" error={errors.password} hint="At least 8 characters.">
          {(p) => <input {...p} type="text" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />}
        </Field>
      </form>
    </Modal>
  )
}
