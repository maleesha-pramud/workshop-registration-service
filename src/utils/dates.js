// All dates travel as UTC ISO strings and are shown in the browser's local time.

const dateFmt = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})
const timeFmt = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' })
const dateTimeFmt = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
})

export const formatDate = (iso) => dateFmt.format(new Date(iso))
export const formatTime = (iso) => timeFmt.format(new Date(iso))
export const formatDateTime = (iso) => dateTimeFmt.format(new Date(iso))
export const formatTimeRange = (start, end) => `${formatTime(start)} – ${formatTime(end)}`

const pad = (n) => String(n).padStart(2, '0')

/** "YYYY-MM-DD" in local time, for <input type="date">. */
export function toDateInput(value) {
  const d = new Date(value)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** "HH:mm" in local time, for <input type="time">. */
export function toTimeInput(value) {
  const d = new Date(value)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Combines local date + time inputs into a UTC ISO string. */
export function combineDateTime(date, time) {
  if (!date || !time) return null
  const [y, m, d] = date.split('-').map(Number)
  const [hh, mm] = time.split(':').map(Number)
  return new Date(y, m - 1, d, hh, mm).toISOString()
}

export function startOfDay(date = new Date()) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function endOfDay(date = new Date()) {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

/** Sunday 23:59 of the current week (weeks run Monday–Sunday). */
export function endOfWeek(date = new Date()) {
  const d = endOfDay(date)
  const daysUntilSunday = (7 - d.getDay()) % 7
  d.setDate(d.getDate() + daysUntilSunday)
  return d
}

export function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`

/** "Today", "Tomorrow" or "Yesterday" when it applies, otherwise e.g. "Fri, 9 Oct 2026". */
export function formatDay(iso) {
  const d = new Date(iso)
  const now = new Date()
  if (dayKey(d) === dayKey(now)) return 'Today'
  if (dayKey(d) === dayKey(addDays(now, 1))) return 'Tomorrow'
  if (dayKey(d) === dayKey(addDays(now, -1))) return 'Yesterday'
  return formatDate(iso)
}

/** "just now", "5 min ago", "3 h ago", otherwise a short date and time. */
export function formatRelative(iso) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  if (minutes < 60 * 12) return `${Math.round(minutes / 60)} h ago`
  return formatDateTime(iso)
}
