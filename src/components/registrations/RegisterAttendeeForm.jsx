import { useRef, useState } from 'react'
import { registrationsApi } from '../../api/endpoints'
import { useToast } from '../../hooks/useToast'
import { Alert, Button, Card, Field } from '../ui'

const EMPTY = { attendeeName: '', attendeeEmail: '' }

/**
 * Registers an attendee. The seat count on screen may be seconds old, so the
 * server has the final say: if a colleague took the last seat first, we get a
 * 409 WORKSHOP_FULL and offer the waitlist instead of failing silently.
 */
export default function RegisterAttendeeForm({ workshop, onRegistered }) {
  const { notify } = useToast()
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [justFilled, setJustFilled] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const nameInput = useRef(null)

  const notOpen = workshop.status !== 'OPEN'
  const started = workshop.hasStarted

  if (notOpen || started) {
    return (
      <Card className="p-5">
        <h2 className="font-semibold text-slate-900">Register an attendee</h2>
        <Alert tone="info" className="mt-3">
          {started
            ? 'This workshop has already started, so it is no longer taking registrations.'
            : 'This workshop is not taking registrations right now.'}
        </Alert>
      </Card>
    )
  }

  const waitlistMode = workshop.isFull || justFilled

  const submit = async (joinWaitlist) => {
    setSubmitting(true)
    setErrors({})
    setFormError(null)
    try {
      const { data } = await registrationsApi.register(workshop.id, { ...form, joinWaitlist })
      notify(
        data.status === 'WAITLISTED'
          ? `${data.attendeeName} added to the waitlist`
          : `${data.attendeeName} is registered`,
      )
      setForm(EMPTY)
      setJustFilled(false)
      onRegistered()
      nameInput.current?.focus() // ready for the next person in the queue
    } catch (err) {
      if (err.code === 'WORKSHOP_FULL') {
        setJustFilled(true)
        onRegistered() // refresh seat count
      } else if (err.code === 'ALREADY_REGISTERED') {
        setErrors({ attendeeEmail: err.message })
      } else {
        const fieldErrors = err.fieldErrors?.() ?? {}
        setErrors(fieldErrors)
        if (!Object.keys(fieldErrors).length) setFormError(err.message)
        if (['WORKSHOP_NOT_OPEN', 'WORKSHOP_STARTED'].includes(err.code)) onRegistered()
      }
    } finally {
      setSubmitting(false)
    }
  }

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  return (
    <Card className="p-5">
      <h2 className="font-semibold text-slate-900">
        {waitlistMode ? 'Add to waitlist' : 'Register an attendee'}
      </h2>

      <form
        className="mt-4 space-y-4"
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          submit(workshop.isFull)
        }}
      >
        {justFilled ? (
          <Alert tone="warning" title="Sorry, the last seat was just taken">
            Another booking got there first. You can add {form.attendeeName || 'this person'} to the waitlist.
            They'll get the next seat that frees up.
          </Alert>
        ) : (
          workshop.isFull && (
            <Alert tone="info">
              This workshop is full. New attendees join the waitlist and automatically get the next free seat,
              in order.
            </Alert>
          )
        )}
        {formError && <Alert tone="error">{formError}</Alert>}

        <Field label="Attendee name" error={errors.attendeeName}>
          {(p) => (
            <input
              {...p}
              ref={nameInput}
              value={form.attendeeName}
              onChange={set('attendeeName')}
              autoComplete="off"
              placeholder="e.g. Nimali Perera"
            />
          )}
        </Field>
        <Field label="Attendee email" error={errors.attendeeEmail}>
          {(p) => (
            <input
              {...p}
              type="email"
              placeholder="name@example.com"
              value={form.attendeeEmail}
              onChange={set('attendeeEmail')}
              autoComplete="off"
            />
          )}
        </Field>

        {justFilled ? (
          <div className="flex gap-2">
            <Button className="flex-1" loading={submitting} onClick={() => submit(true)}>
              Add to waitlist
            </Button>
            <Button variant="secondary" onClick={() => setJustFilled(false)}>
              Not now
            </Button>
          </div>
        ) : (
          <Button type="submit" className="w-full" loading={submitting}>
            {workshop.isFull ? 'Add to waitlist' : 'Register'}
          </Button>
        )}
      </form>
    </Card>
  )
}
