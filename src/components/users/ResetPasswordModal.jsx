import { useState } from 'react'
import { usersApi } from '../../api/endpoints'
import { useFormSubmit } from '../../hooks/useFormSubmit'
import { Alert, Button, Field, Modal } from '../ui'

export function ResetPasswordModal({ user, onClose, onDone }) {
  const [password, setPassword] = useState('')
  const { errors, formError, submitting, submit } = useFormSubmit(onDone, `Password reset for ${user.name}`)

  const onSubmit = (e) => {
    e.preventDefault()
    submit(() => usersApi.resetPassword(user.id, password))
  }

  return (
    <Modal
      open
      title={`Reset password for ${user.name}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="reset-password" loading={submitting}>
            Set password
          </Button>
        </>
      }
    >
      <form id="reset-password" className="space-y-4" noValidate onSubmit={onSubmit}>
        {formError && <Alert tone="error">{formError}</Alert>}
        <Field label="New temporary password" error={errors.password} hint="At least 8 characters.">
          {(p) => (
            <input
              {...p}
              type="text"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
          )}
        </Field>
      </form>
    </Modal>
  )
}
