import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { workshopsApi } from '../api/endpoints'
import { useApi } from '../hooks/useApi'
import { useLocations } from '../hooks/useLocations'
import { useAuth } from '../context/AuthContext'
import { addDays, endOfDay, endOfWeek, formatDate, formatTimeRange, startOfDay, toDateInput } from '../utils/dates'
import { WORKSHOP_STATUS } from '../utils/labels'
import { SeatsIndicator, WorkshopStatusBadge } from '../components/workshop'
import { Alert, Button, Card, EmptyState, PageHeader, PageLoader, Pagination } from '../components/ui'

const today = () => toDateInput(new Date())

// One-click answers to the questions the front desk asks most.
const PRESETS = [
  { id: 'week-seats', label: 'This week · has seats', params: () => ({ from: today(), to: toDateInput(endOfWeek()), hasSeats: '1' }) },
  { id: 'today', label: 'Today', params: () => ({ from: today(), to: today() }) },
  { id: 'next7', label: 'Next 7 days', params: () => ({ from: today(), to: toDateInput(addDays(new Date(), 6)) }) },
  { id: 'upcoming', label: 'All upcoming', params: () => ({ from: today() }) },
  { id: 'all', label: 'Include past', params: () => ({ from: '' }) },
]

const FILTER_KEYS = ['q', 'from', 'to', 'status', 'locationId', 'hasSeats']

/**
 * Filters live in the URL, so the back button works, a refresh keeps the
 * view, and a filtered list can be bookmarked or shared with a colleague.
 */
function useWorkshopFilters() {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters = useMemo(() => {
    const f = Object.fromEntries(FILTER_KEYS.map((k) => [k, searchParams.get(k) ?? '']))
    // First visit: hide workshops that have already happened.
    if (!searchParams.has('from')) f.from = today()
    f.page = Number(searchParams.get('page')) || 1
    return f
  }, [searchParams])

  const update = (changes, { resetPage = true } = {}) => {
    const next = { ...filters, ...(resetPage && { page: 1 }), ...changes }
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries(next)) {
      if (k === 'from' || (v !== '' && v != null && !(k === 'page' && v === 1))) params.set(k, v)
    }
    setSearchParams(params, { replace: true })
  }

  const replaceAll = (params) => setSearchParams(new URLSearchParams(params), { replace: true })

  return { filters, update, replaceAll }
}

function toApiParams(f) {
  return {
    q: f.q || undefined,
    from: f.from ? startOfDay(new Date(`${f.from}T00:00`)).toISOString() : undefined,
    to: f.to ? endOfDay(new Date(`${f.to}T00:00`)).toISOString() : undefined,
    status: f.status || undefined,
    locationId: f.locationId || undefined,
    hasSeats: f.hasSeats ? 'true' : undefined,
    page: f.page,
    pageSize: 20,
  }
}

export default function WorkshopsPage() {
  const { can } = useAuth()
  const navigate = useNavigate()
  const locations = useLocations()
  const { filters, update, replaceAll } = useWorkshopFilters()
  const apiParams = toApiParams(filters)
  const { data: workshops, meta, loading, error } = useApi(() => workshopsApi.list(apiParams), [apiParams])

  // Debounce typing in the search box.
  const [search, setSearch] = useState(filters.q)
  useEffect(() => {
    if (search === filters.q) return
    const t = setTimeout(() => update({ q: search }), 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const activePreset = PRESETS.find((p) => {
    const pp = p.params()
    return FILTER_KEYS.every((k) => (pp[k] ?? '') === filters[k])
  })?.id

  const inputClass = 'rounded-lg border-0 px-3 py-2 text-sm ring-1 ring-slate-300 focus:ring-2 focus:ring-indigo-600'

  return (
    <>
      <PageHeader
        title="Workshops"
        subtitle="Find a workshop, check seats and register attendees."
        actions={can('WORKSHOPS_WRITE') && <Button onClick={() => navigate('/workshops/new')}>New workshop</Button>}
      />

      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Quick filters">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              setSearch('')
              replaceAll(p.params())
            }}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ring-1 transition-colors ${
              activePreset === p.id
                ? 'bg-indigo-600 text-white ring-indigo-600'
                : 'bg-white text-slate-700 ring-slate-300 hover:bg-slate-50'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <Card className="mb-4 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <input
            type="search"
            placeholder="Search code, title or instructor"
            aria-label="Search workshops"
            className={`${inputClass} lg:col-span-2`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <span className="shrink-0">From</span>
            <input type="date" className={`${inputClass} w-full`} value={filters.from} onChange={(e) => update({ from: e.target.value })} />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <span className="shrink-0">To</span>
            <input type="date" className={`${inputClass} w-full`} value={filters.to} min={filters.from || undefined} onChange={(e) => update({ to: e.target.value })} />
          </label>
          <select aria-label="Status" className={inputClass} value={filters.status} onChange={(e) => update({ status: e.target.value })}>
            <option value="">Any status</option>
            {Object.entries(WORKSHOP_STATUS).map(([value, { label }]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select aria-label="Location" className={inputClass} value={filters.locationId} onChange={(e) => update({ locationId: e.target.value })}>
            <option value="">All locations</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>
        <label className="mt-3 inline-flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-indigo-600"
            checked={Boolean(filters.hasSeats)}
            onChange={(e) => update({ hasSeats: e.target.checked ? '1' : '' })}
          />
          Only workshops I can still book (open, upcoming, seats left)
        </label>
      </Card>

      <Card>
        {error && <Alert tone="error" className="m-4">{error.message}</Alert>}
        {loading && !workshops ? (
          <PageLoader />
        ) : workshops?.length === 0 ? (
          <EmptyState title="No workshops match these filters">Try a wider date range or clear some filters.</EmptyState>
        ) : (
          <ul className={`divide-y divide-slate-100 ${loading ? 'opacity-60' : ''}`}>
            {workshops?.map((w) => (
              <li key={w.id}>
                <Link to={`/workshops/${w.id}`} className="flex flex-col gap-3 px-4 py-4 hover:bg-slate-50 sm:flex-row sm:items-center">
                  <div className="w-36 shrink-0 text-sm">
                    <p className="font-medium text-slate-900">{formatDate(w.startsAt)}</p>
                    <p className="text-slate-500">{formatTimeRange(w.startsAt, w.endsAt)}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900">
                      {w.title} <span className="ml-1 text-xs font-normal text-slate-500">{w.code}</span>
                    </p>
                    <p className="text-sm text-slate-500">
                      {w.instructor} · {w.location.name}
                    </p>
                  </div>
                  <WorkshopStatusBadge status={w.status} />
                  <SeatsIndicator workshop={w} compact />
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Pagination meta={meta} onPage={(page) => update({ page }, { resetPage: false })} />
      </Card>
    </>
  )
}
