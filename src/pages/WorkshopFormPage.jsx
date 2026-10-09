import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { workshopsApi } from '../api/endpoints'
import { useApi } from '../hooks/useApi'
import { useLocations } from '../hooks/useLocations'
import { useToast } from '../hooks/useToast'
import { combineDateTime, toDateInput, toTimeInput } from '../utils/dates'
import { Alert, Button, Card, Field, PageHeader, PageLoader } from '../components/ui'

export default function WorkshopFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const {
    data: workshop,
    loading,
    error,
  } = useApi(() => (isEdit ? workshopsApi.get(id) : Promise.resolve(null)), [id])

  if (isEdit && loading) return <PageLoader />
  if (isEdit && error) return <Alert tone="error">{error.message}</Alert>

  // Keyed so the form re-initialises if we navigate between workshops.
  return <WorkshopForm key={id ?? 'new'} workshop={workshop} />
}

function initialValues(w) {
  if (!w) {
    return {
      code: '',
      title: '',
      instructor: '',
      locationId: '',
      date: '',
      startTime: '10:00',
      endTime: '12:00',
      capacity: '20',
      description: '',
    }
  }
  return {
    code: w.code,
    title: w.title,
    instructor: w.instructor,
    locationId: String(w.locationId),
    date: toDateInput(w.startsAt),
    startTime: toTimeInput(w.startsAt),
    endTime: toTimeInput(w.endsAt),
    capacity: String(w.capacity),
    description: w.description ?? '',
  }
}

function toPayload(v) {
  return {
    code: v.code.trim(),
    title: v.title.trim(),
    instructor: v.instructor.trim(),
    locationId: v.locationId ? Number(v.locationId) : undefined,
    startsAt: combineDateTime(v.date, v.startTime),
    endsAt: combineDateTime(v.date, v.endTime),
    capacity: v.capacity === '' ? undefined : Number(v.capacity),
    description: v.description.trim() || null,
  }
}

// API field names -> the input that should show the message.
const FIELD_MAP = { startsAt: 'startTime', endsAt: 'endTime' }

function WorkshopForm({ workshop }) {
  const isEdit = Boolean(workshop)
  const navigate = useNavigate()
  const { notify } = useToast()
  const locations = useLocations()
  const [values, setValues] = useState(() => initialValues(workshop))
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const set = (field) => (e) => setValues((v) => ({ ...v, [field]: e.target.value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    const clientErrors = {}
    if (!values.date) clientErrors.date = 'Choose a date'
    if (!values.startTime) clientErrors.startTime = 'Choose a start time'
    if (!values.endTime) clientErrors.endTime = 'Choose an end time'
    if (Object.keys(clientErrors).length) return setErrors(clientErrors)

    let payload = toPayload(values)
    if (isEdit) {
      // Send only what changed: smaller requests and a precise audit trail.
      const original = toPayload(initialValues(workshop))
      payload = Object.fromEntries(Object.entries(payload).filter(([k, v]) => v !== original[k]))
      if (!Object.keys(payload).length) return navigate(`/workshops/${workshop.id}`)
    }

    setSubmitting(true)
    setErrors({})
    setFormError(null)
    try {
      const { data } = isEdit
        ? await workshopsApi.update(workshop.id, payload)
        : await workshopsApi.create(payload)
      notify(isEdit ? 'Workshop updated' : 'Workshop created')
      navigate(`/workshops/${data.id}`)
    } catch (err) {
      const fieldErrors = {}
      for (const [k, msg] of Object.entries(err.fieldErrors?.() ?? {})) fieldErrors[FIELD_MAP[k] ?? k] = msg
      if (err.code === 'CODE_TAKEN') fieldErrors.code = err.message
      if (err.code === 'CAPACITY_BELOW_REGISTRATIONS') fieldErrors.capacity = err.message
      setErrors(fieldErrors)
      if (!Object.keys(fieldErrors).length) setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageHeader
        title={isEdit ? `Edit ${workshop.title}` : 'New workshop'}
        subtitle={
          isEdit ? workshop.code : 'Add a workshop to the catalogue so the front desk can take bookings.'
        }
      />

      <Card className="max-w-3xl p-6">
        <form className="space-y-5" noValidate onSubmit={onSubmit}>
          {formError && <Alert tone="error">{formError}</Alert>}

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Code" error={errors.code} hint="A short code staff can recognise, e.g. POT-101">
              {(p) => (
                <input
                  {...p}
                  value={values.code}
                  onChange={set('code')}
                  className={`${p.className} uppercase`}
                />
              )}
            </Field>
            <Field label="Title" error={errors.title} className="sm:col-span-2">
              {(p) => (
                <input
                  {...p}
                  value={values.title}
                  onChange={set('title')}
                  placeholder="e.g. Pottery for beginners"
                />
              )}
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Instructor" error={errors.instructor}>
              {(p) => (
                <input
                  {...p}
                  value={values.instructor}
                  onChange={set('instructor')}
                  placeholder="e.g. Nimali Fernando"
                />
              )}
            </Field>
            <Field label="Location" error={errors.locationId}>
              {(p) => (
                <select {...p} value={values.locationId} onChange={set('locationId')}>
                  <option value="">Choose a location</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Date" error={errors.date}>
              {(p) => <input {...p} type="date" value={values.date} onChange={set('date')} />}
            </Field>
            <Field label="Starts" error={errors.startTime}>
              {(p) => <input {...p} type="time" value={values.startTime} onChange={set('startTime')} />}
            </Field>
            <Field label="Ends" error={errors.endTime}>
              {(p) => <input {...p} type="time" value={values.endTime} onChange={set('endTime')} />}
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Capacity (seats)"
              error={errors.capacity}
              hint={
                isEdit && workshop.activeCount > 0
                  ? `${workshop.activeCount} already registered, so capacity can't go lower than that.`
                  : undefined
              }
            >
              {(p) => (
                <input
                  {...p}
                  type="number"
                  min={Math.max(1, workshop?.activeCount ?? 1)}
                  max={1000}
                  value={values.capacity}
                  onChange={set('capacity')}
                />
              )}
            </Field>
          </div>

          <Field
            label="Description (optional)"
            error={errors.description}
            hint="Anything the front desk should tell callers: what to bring, who it suits, the price."
          >
            {(p) => <textarea {...p} rows={4} value={values.description} onChange={set('description')} />}
          </Field>

          <div className="flex justify-end gap-2 border-t border-slate-200 pt-5">
            <Link to={isEdit ? `/workshops/${workshop.id}` : '/workshops'}>
              <Button variant="secondary">Cancel</Button>
            </Link>
            <Button type="submit" loading={submitting}>
              {isEdit ? 'Save changes' : 'Create workshop'}
            </Button>
          </div>
        </form>
      </Card>
    </>
  )
}
