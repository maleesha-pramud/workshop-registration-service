import { useState } from 'react'
import { usersApi } from '../../api/endpoints'
import { useFormSubmit } from '../../hooks/useFormSubmit'
import { Alert, Button, Field, Modal } from '../ui'
import { RoleSelect } from './RoleSelect'

export function EditUserModal({ user, isSelf, onClose, onDone }) {
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
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="edit-user" loading={submitting}>
            Save changes
          </Button>
        </>
      }
    >
      <form id="edit-user" className="space-y-4" noValidate onSubmit={onSubmit}>
        {formError && <Alert tone="error">{formError}</Alert>}
        {isSelf && <Alert tone="info">You can't change your own role or deactivate your own account.</Alert>}
        <Field label="Full name" error={errors.name}>
          {(p) => (
            <input
              {...p}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          )}
        </Field>
        <p className="text-sm text-slate-500">{user.email}</p>
        <RoleSelect
          value={form.role}
          onChange={(role) => setForm((f) => ({ ...f, role }))}
          disabled={isSelf}
          error={errors.role}
        />
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
