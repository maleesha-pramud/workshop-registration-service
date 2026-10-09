import { useState } from 'react'
import { registrationsApi } from '../../api/endpoints'
import { useToast } from '../../hooks/useToast'
import { Alert, Button, Field, Modal } from '../ui'

export default function CancelRegistrationDialog({ registration, onClose, onCancelled }) {
  const { notify } = useToast()
  const [reason, setReason] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const confirm = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const { data } = await registrationsApi.cancel(registration.id, reason || undefined)
      notify(`Registration for ${registration.attendeeName} cancelled`)
      onCancelled(data)
    } catch (err) {
      if (err.code === 'ALREADY_CANCELLED') {
        // A colleague got there first: the outcome the user wanted already happened.
        notify('This registration had already been cancelled by a colleague', { tone: 'info' })
        onCancelled(null)
      } else {
        setError(err.message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const holdsSeat = registration.status === 'ACTIVE'

  return (
    <Modal
      open
      title="Cancel registration?"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Keep registration
          </Button>
          <Button variant="danger" loading={submitting} onClick={confirm}>
            Cancel registration
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-sm">
        {error && <Alert tone="error">{error}</Alert>}
        <p>
          <strong>{registration.attendeeName}</strong> ({registration.attendeeEmail}){' '}
          {holdsSeat
            ? 'will lose their seat. If anyone is on the waitlist, the next person gets it automatically.'
            : 'will be removed from the waitlist.'}
        </p>
        <p className="text-slate-500">The registration stays in the history, with your name and the time.</p>
        <Field label="Reason (optional)">
          {(p) => (
            <input
              {...p}
              value={reason}
              maxLength={255}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Called to cancel, feeling unwell"
            />
          )}
        </Field>
      </div>
    </Modal>
  )
}
