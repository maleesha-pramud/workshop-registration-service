import { useState } from 'react'
import { usersApi } from '../../api/endpoints'
import { useFormSubmit } from '../../hooks/useFormSubmit'
import { Alert, Button, Field, Modal } from '../ui'
import { RoleSelect } from './RoleSelect'

export function EditUserModal({ user, isSelf, onClose, onDone }) {
  const [form, setForm] = useState({ name: user.name, role: user.role })
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
        {isSelf && <Alert tone="info">You can't change your own role.</Alert>}
        <Field label="Full name" error={errors.name}>
          {(p) => (
            <input
              {...p}
              value={form.name}
              autoFocus
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
      </form>
    </Modal>
  )
}
