import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { registrationsApi } from '../api/endpoints'
import { useApi } from '../hooks/useApi'
import { formatDateTime } from '../utils/dates'
import { REGISTRATION_STATUS } from '../utils/labels'
import {
  Alert,
  Badge,
  Card,
  EmptyState,
  PageHeader,
  PageLoader,
  Pagination,
  SearchInput,
} from '../components/ui'

/**
 * "Hi, I booked something but can't remember what": look a caller up by name
 * or email and see every booking they've had, including cancellations.
 */
export default function AttendeesPage() {
  const [input, setInput] = useState('')
  const [query, setQuery] = useState({ q: '', page: 1 })

  useEffect(() => {
    const t = setTimeout(() => setQuery({ q: input.trim(), page: 1 }), 300)
    return () => clearTimeout(t)
  }, [input])

  const enabled = query.q.length >= 2
  const { data, meta, loading, error } = useApi(
    () =>
      enabled
        ? registrationsApi.search({ q: query.q, page: query.page, pageSize: 20 })
        : Promise.resolve({ data: [] }),
    [query],
  )

  return (
    <>
      <PageHeader title="Attendee lookup" subtitle="Find every booking for a person, past and present." />

      <Card>
        <div className="border-b border-slate-200 p-4">
          <SearchInput
            autoFocus
            className="max-w-md"
            placeholder="Type a name or email"
            label="Search attendees"
            value={input}
            onChange={setInput}
          />
        </div>

        {error && (
          <Alert tone="error" className="m-4">
            {error.message}
          </Alert>
        )}
        {!enabled ? (
          <EmptyState title="Start typing to search">
            Enter at least 2 letters of a name or an email address.
          </EmptyState>
        ) : loading && !data?.length ? (
          <PageLoader />
        ) : data?.length === 0 ? (
          <EmptyState title={`No bookings found for "${query.q}"`}>
            Check the spelling, or try just the first few letters of the name or email.
          </EmptyState>
        ) : (
          <ul className="divide-y divide-slate-100">
            {data.map((r) => {
              const status = REGISTRATION_STATUS[r.status]
              return (
                <li key={r.id}>
                  <Link
                    to={`/workshops/${r.workshop.id}`}
                    className="flex flex-col gap-2 px-4 py-3 hover:bg-slate-50 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900">{r.attendeeName}</p>
                      <p className="text-sm text-slate-500">{r.attendeeEmail}</p>
                    </div>
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="font-medium text-slate-800">
                        {r.workshop.title}{' '}
                        <span className="text-xs font-normal text-slate-500">{r.workshop.code}</span>
                      </p>
                      <p className="text-slate-500">{formatDateTime(r.workshop.startsAt)}</p>
                    </div>
                    <div className="text-xs text-slate-500 sm:w-48">
                      {r.status === 'CANCELLED'
                        ? `Cancelled by ${r.cancelledBy?.name} · ${formatDateTime(r.cancelledAt)}`
                        : `Booked by ${r.registeredBy.name} · ${formatDateTime(r.registeredAt)}`}
                    </div>
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
        <Pagination meta={meta} onPage={(page) => setQuery((q) => ({ ...q, page }))} />
      </Card>
    </>
  )
}
