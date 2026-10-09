import { useState } from 'react'
import { usersApi } from '../../api/endpoints'
import { useFormSubmit } from '../../hooks/useFormSubmit'
import { Alert, Button, Field, Modal } from '../ui'
import { RoleSelect } from './RoleSelect'

export function CreateUserModal({ onClose, onDone }) {
  const [form, setForm] = useState({ name: '', email: '', role: 'STAFF', password: '' })
  const { errors, formError, submitting, submit } = useFormSubmit(onDone, 'Account created', (err) =>
    err.code === 'EMAIL_TAKEN' ? { email: err.message } : {},
  )
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const onSubmit = (e) => {
    e.preventDefault()
    submit(() => usersApi.create(form))
  }

  return (
    <Modal
      open
      title="Add staff member"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="create-user" loading={submitting}>
            Create account
          </Button>
        </>
      }
    >
      <form id="create-user" className="space-y-4" noValidate onSubmit={onSubmit}>
        {formError && <Alert tone="error">{formError}</Alert>}
        <Field label="Full name" error={errors.name}>
          {(p) => <input {...p} value={form.name} onChange={set('name')} autoFocus />}
        </Field>
        <Field label="Email" error={errors.email}>
          {(p) => <input {...p} type="email" value={form.email} onChange={set('email')} />}
        </Field>
        <RoleSelect
          value={form.role}
          onChange={(role) => setForm((f) => ({ ...f, role }))}
          error={errors.role}
        />
        <Field
          label="Temporary password"
          error={errors.password}
          hint="At least 8 characters. Share it with them in person."
        >
          {(p) => (
            <input
              {...p}
              type="text"
              autoComplete="new-password"
              value={form.password}
              onChange={set('password')}
            />
          )}
        </Field>
      </form>
    </Modal>
  )
}
