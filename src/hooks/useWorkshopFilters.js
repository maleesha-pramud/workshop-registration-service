import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { addDays, endOfDay, endOfWeek, startOfDay, toDateInput } from '../utils/dates'

const today = () => toDateInput(new Date())

/** One-click answers to the questions the front desk asks most. */
export const PRESETS = [
  {
    id: 'week-seats',
    label: 'This week · has seats',
    params: () => ({ from: today(), to: toDateInput(endOfWeek()), hasSeats: '1' }),
  },
  { id: 'today', label: 'Today', params: () => ({ from: today(), to: today() }) },
  {
    id: 'next7',
    label: 'Next 7 days',
    params: () => ({ from: today(), to: toDateInput(addDays(new Date(), 6)) }),
  },
  { id: 'upcoming', label: 'All upcoming', params: () => ({ from: today() }) },
  { id: 'all', label: 'Include past', params: () => ({ from: '' }) },
]

const FILTER_KEYS = ['q', 'from', 'to', 'status', 'locationId', 'hasSeats']

/** Turns the UI's filter values into query parameters for GET /workshops. */
export function toApiParams(f) {
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

/**
 * Workshop list filters, kept in the URL so the back button works, a refresh keeps the
 * view, and a filtered list can be bookmarked or shared with a colleague.
 *
 * Returns:
 *   filters        current values (strings; '' means "not set")
 *   update(changes, { resetPage })   change one or more filters
 *   applyPreset(preset)              replace all filters with a quick preset
 *   activePreset                     id of the preset matching the current filters, if any
 *   search, setSearch                the search box value, applied to the URL after a short pause
 */
export function useWorkshopFilters() {
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
      // `from` is always written, so an empty value ("include past") survives a refresh.
      if (k === 'from' || (v !== '' && v != null && !(k === 'page' && v === 1))) params.set(k, v)
    }
    setSearchParams(params, { replace: true })
  }

  // Debounce typing in the search box so we don't query on every keystroke.
  const [search, setSearch] = useState(filters.q)
  useEffect(() => {
    if (search === filters.q) return
    const t = setTimeout(() => update({ q: search }), 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const applyPreset = (preset) => {
    setSearch('')
    setSearchParams(new URLSearchParams(preset.params()), { replace: true })
  }

  const activePreset = PRESETS.find((p) => {
    const values = p.params()
    return FILTER_KEYS.every((k) => (values[k] ?? '') === filters[k])
  })?.id

  return { filters, update, applyPreset, activePreset, search, setSearch }
}
