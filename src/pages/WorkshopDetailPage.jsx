import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { registrationsApi, workshopsApi } from '../api/endpoints'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'
import { formatDate, formatDateTime, formatTimeRange } from '../utils/dates'
import { REGISTRATION_STATUS, WORKSHOP_STATUS } from '../utils/labels'
import { SeatsIndicator, WorkshopStatusBadge } from '../components/workshop'
import RegisterAttendeeForm from '../components/RegisterAttendeeForm'
import CancelRegistrationDialog from '../components/CancelRegistrationDialog'
import { Alert, Badge, Button, Card, EmptyState, PageLoader } from '../components/ui'

const TABS = [
  { id: 'ACTIVE', label: 'Attending' },
  { id: 'WAITLISTED', label: 'Waitlist' },
  { id: 'CANCELLED', label: 'Cancelled' },
  { id: 'ALL', label: 'Full history' },
]

export default function WorkshopDetailPage() {
  const { id } = useParams()
  const { can } = useAuth()
  const workshopQuery = useApi(() => workshopsApi.get(id), [id])
  const registrationsQuery = useApi(() => registrationsApi.listForWorkshop(id), [id])
  const [tab, setTab] = useState('ACTIVE')
  const [cancelling, setCancelling] = useState(null)
  const [promotedNotice, setPromotedNotice] = useState([])

  const workshop = workshopQuery.data
  const registrations = registrationsQuery.data ?? []

  // Seats and the list always change together, so always refresh both.
  const refresh = () => {
    workshopQuery.reload()
    registrationsQuery.reload()
  }

  if (workshopQuery.loading && !workshop) return <PageLoader />
  if (workshopQuery.error) {
    return (
      <Alert tone="error" title="Couldn't load this workshop">
        {workshopQuery.error.message} <Link to="/workshops" className="underline">Back to workshops</Link>
      </Alert>
    )
  }

  const counts = registrations.reduce((acc, r) => ({ ...acc, [r.status]: (acc[r.status] ?? 0) + 1 }), {})
  const visible = tab === 'ALL' ? registrations : registrations.filter((r) => r.status === tab)
  const canCancel = can('REGISTRATIONS_WRITE') && workshop.status !== 'COMPLETED'

  return (
    <div className="space-y-6">
      <Link to="/workshops" className="text-sm font-medium text-indigo-600 hover:underline">
        ← All workshops
      </Link>

      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold text-slate-900">{workshop.title}</h1>
              <WorkshopStatusBadge status={workshop.status} />
            </div>
            <p className="mt-1 text-sm text-slate-500">{workshop.code}</p>
          </div>
          {can('WORKSHOPS_WRITE') && (
            <Link to={`/workshops/${workshop.id}/edit`}>
              <Button variant="secondary">Edit workshop</Button>
            </Link>
          )}
        </div>

        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <Detail label="When">
            {formatDate(workshop.startsAt)}
            <br />
            {formatTimeRange(workshop.startsAt, workshop.endsAt)}
          </Detail>
          <Detail label="Where">{workshop.location.name}</Detail>
          <Detail label="Instructor">{workshop.instructor}</Detail>
          <Detail label="Seats">
            <SeatsIndicator workshop={workshop} />
          </Detail>
        </dl>

        {workshop.description && <p className="mt-5 whitespace-pre-line text-sm text-slate-700">{workshop.description}</p>}

        <p className="mt-5 text-xs text-slate-400">
          Created by {workshop.createdBy.name} on {formatDateTime(workshop.createdAt)}
          {workshop.updatedBy && ` · Last edited by ${workshop.updatedBy.name} on ${formatDateTime(workshop.updatedAt)}`}
        </p>
      </Card>

      {promotedNotice.length > 0 && (
        <Alert tone="success" title="Seat passed to the waitlist">
          {promotedNotice.map((r) => (
            <p key={r.id}>
              <strong>{r.attendeeName}</strong> ({r.attendeeEmail}) now has a seat. Please let them know.
            </p>
          ))}
          <button className="mt-2 text-sm font-medium underline" onClick={() => setPromotedNotice([])}>
            Done
          </button>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {can('REGISTRATIONS_WRITE') && (
          <div className="lg:col-span-1">
            <RegisterAttendeeForm workshop={workshop} onRegistered={refresh} />
          </div>
        )}

        <Card className={can('REGISTRATIONS_WRITE') ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <div className="flex flex-wrap gap-1 border-b border-slate-200 px-2 pt-2" role="tablist">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`rounded-t-lg border-b-2 px-3 py-2 text-sm font-medium ${
                  tab === t.id ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {t.label}
                <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 text-xs text-slate-600">
                  {t.id === 'ALL' ? registrations.length : counts[t.id] ?? 0}
                </span>
              </button>
            ))}
          </div>

          {registrationsQuery.error && <Alert tone="error" className="m-4">{registrationsQuery.error.message}</Alert>}
          {registrationsQuery.loading && !registrationsQuery.data ? (
            <PageLoader />
          ) : visible.length === 0 ? (
            <EmptyState title={tab === 'WAITLISTED' ? 'Nobody is waiting' : 'No registrations here yet'} />
          ) : (
            <ul className="divide-y divide-slate-100">
              {visible.map((r) => (
                <RegistrationRow key={r.id} registration={r} canCancel={canCancel} onCancel={() => setCancelling(r)} />
              ))}
            </ul>
          )}
        </Card>
      </div>

      {cancelling && (
        <CancelRegistrationDialog
          registration={cancelling}
          onClose={() => setCancelling(null)}
          onCancelled={(result) => {
            setCancelling(null)
            setPromotedNotice(result?.promoted ?? [])
            refresh()
          }}
        />
      )}

      {workshop.status !== 'OPEN' && (
        <p className="text-center text-xs text-slate-400">
          Status: {WORKSHOP_STATUS[workshop.status]?.label}. Registrations are only taken while a workshop is open.
        </p>
      )}
    </div>
  )
}

function Detail({ label, children }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-slate-900">{children}</dd>
    </div>
  )
}

function RegistrationRow({ registration: r, canCancel, onCancel }) {
  const status = REGISTRATION_STATUS[r.status]
  const cancelled = r.status === 'CANCELLED'
  return (
    <li className={`flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center ${cancelled ? 'bg-slate-50/60' : ''}`}>
      <div className="min-w-0 flex-1">
        <p className={`font-medium ${cancelled ? 'text-slate-500 line-through decoration-slate-300' : 'text-slate-900'}`}>
          {r.waitlistPosition && <span className="mr-1 text-sky-700">#{r.waitlistPosition}</span>}
          {r.attendeeName}
        </p>
        <p className="truncate text-sm text-slate-500">{r.attendeeEmail}</p>
        <p className="mt-1 text-xs text-slate-500">
          {r.status === 'WAITLISTED' ? 'Waitlisted' : 'Registered'} by {r.registeredBy.name} · {formatDateTime(r.registeredAt)}
          {r.promotedAt && ` · Moved from waitlist ${formatDateTime(r.promotedAt)}`}
        </p>
        {cancelled && (
          <p className="text-xs text-slate-500">
            Cancelled by {r.cancelledBy?.name} · {formatDateTime(r.cancelledAt)}
            {r.cancelReason && ` · “${r.cancelReason}”`}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {r.promotedAt && !cancelled && <Badge tone="indigo">From waitlist</Badge>}
        <Badge tone={status.tone}>{status.label}</Badge>
        {canCancel && !cancelled && (
          <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </li>
  )
}
