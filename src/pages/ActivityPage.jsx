import { useState } from 'react'
import { auditApi } from '../api/endpoints'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../hooks/useAuth'
import { formatDateTime, formatRelative } from '../utils/dates'
import {
  REGISTRATION_STATUS,
  ROLE_LABELS,
  WORKSHOP_STATUS,
  auditActionLabel,
  fieldLabel,
} from '../utils/labels'
import { Alert, Card, ChipGroup, EmptyState, PageHeader, PageLoader, Pagination } from '../components/ui'

// Each role sees the history of what it manages (enforced by the API too).
const FILTERS = {
  ADMIN: [{ id: '', label: 'All account changes' }],
  MANAGER: [
    { id: '', label: 'Everything' },
    { id: 'WORKSHOP', label: 'Workshops' },
    { id: 'REGISTRATION', label: 'Registrations' },
  ],
}

function formatValue(field, value) {
  if (value === null || value === undefined || value === '') return '—'
  if (field === 'startsAt' || field === 'endsAt') return formatDateTime(value)
  if (field === 'role') return ROLE_LABELS[value] ?? value
  if (field === 'status') return (WORKSHOP_STATUS[value] ?? REGISTRATION_STATUS[value])?.label ?? value
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}

/** Renders { field: { from, to } } diffs; other shapes are shown as key: value. */
function Changes({ changes }) {
  if (!changes || typeof changes !== 'object') return null
  // The headline already names the person and workshop, so skip repeated identity fields.
  const entries = Object.entries(changes).filter(
    ([k]) => !['workshopId', 'attendeeName', 'attendeeEmail'].includes(k),
  )
  if (!entries.length) return null
  return (
    <ul className="mt-1 space-y-0.5 text-xs text-slate-500">
      {entries.map(([field, v]) => (
        <li key={field}>
          <span className="font-medium text-slate-600">{fieldLabel(field)}:</span>{' '}
          {v && typeof v === 'object' && 'to' in v ? (
            <>
              {formatValue(field, v.from)} →{' '}
              <span className="text-slate-700">{formatValue(field, v.to)}</span>
            </>
          ) : (
            formatValue(field, v)
          )}
        </li>
      ))}
    </ul>
  )
}

export default function ActivityPage() {
  const { user } = useAuth()
  const filters = FILTERS[user.role] ?? FILTERS.ADMIN
  const [params, setParams] = useState({ entityType: '', page: 1 })
  const { data, meta, loading, error } = useApi(
    () => auditApi.list({ entityType: params.entityType || undefined, page: params.page, pageSize: 25 }),
    [params],
  )

  return (
    <>
      <PageHeader
        title="Activity log"
        subtitle={
          user.role === 'ADMIN'
            ? 'Who created, changed or deactivated staff accounts, and when.'
            : 'Who changed workshops and registrations, and when.'
        }
      />

      <Card>
        {filters.length > 1 && (
          <div className="border-b border-slate-200 p-4">
            <ChipGroup
              label="Show"
              options={filters}
              value={params.entityType}
              onChange={(f) => setParams({ entityType: f.id, page: 1 })}
            />
          </div>
        )}

        {error && (
          <Alert tone="error" className="m-4">
            {error.message}
          </Alert>
        )}
        {loading && !data ? (
          <PageLoader />
        ) : data?.length === 0 ? (
          <EmptyState title="Nothing recorded yet">
            Changes will appear here as soon as someone makes one.
          </EmptyState>
        ) : (
          <ul className={`divide-y divide-slate-100 ${loading ? 'opacity-60' : ''}`}>
            {data?.map((entry) => (
              <li key={entry.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:gap-6">
                <time
                  className="w-36 shrink-0 text-sm text-slate-500"
                  dateTime={entry.createdAt}
                  title={formatDateTime(entry.createdAt)}
                >
                  {formatRelative(entry.createdAt)}
                </time>
                <div className="min-w-0 flex-1 text-sm">
                  <p>
                    <span className="font-medium text-slate-900">{entry.actor.name}</span>{' '}
                    <span className="text-slate-600">{auditActionLabel(entry.action).toLowerCase()}</span>{' '}
                    <span className="font-medium text-slate-900">{entry.entityLabel}</span>
                  </p>
                  <Changes changes={entry.changes} />
                </div>
              </li>
            ))}
          </ul>
        )}
        <Pagination meta={meta} onPage={(page) => setParams((p) => ({ ...p, page }))} />
      </Card>
    </>
  )
}
