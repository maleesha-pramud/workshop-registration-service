import { useState } from 'react'
import { Alert } from './Alert'
import { Button } from './Button'
import { Modal } from './Modal'

/**
 * "Are you sure?" dialog for one-click actions.
 * `onConfirm` may be async; the dialog stays open with the error shown if it throws,
 * and closes itself (via `onClose`) once it succeeds.
 */
export function ConfirmDialog({
  title,
  children,
  confirmLabel = 'Confirm',
  tone = 'primary',
  onConfirm,
  onClose,
}) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const confirm = async () => {
    setSubmitting(true)
    setError(null)
    try {
      await onConfirm()
      onClose()
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open
      title={title}
      onClose={submitting ? undefined : onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant={tone} loading={submitting} onClick={confirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-3 text-sm text-slate-700">
        {error && <Alert tone="error">{error}</Alert>}
        {children}
      </div>
    </Modal>
  )
}
