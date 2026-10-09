/** "5 of 20 seats left" with a fill bar; colour warns as the workshop fills up. */
export function SeatsIndicator({ workshop, compact = false }) {
  const { capacity, activeCount, seatsLeft, waitlistCount } = workshop
  const pct = Math.min(100, Math.round((activeCount / capacity) * 100))
  const tone =
    seatsLeft === 0
      ? 'bg-red-500'
      : seatsLeft <= Math.max(2, capacity * 0.2)
        ? 'bg-amber-500'
        : 'bg-emerald-500'

  return (
    <div className={compact ? 'w-36' : 'w-full max-w-xs'}>
      <div className="flex items-baseline justify-between text-sm">
        <span className={seatsLeft === 0 ? 'font-semibold text-red-600' : 'font-medium text-slate-900'}>
          {seatsLeft === 0 ? 'Full' : `${seatsLeft} ${seatsLeft === 1 ? 'seat' : 'seats'} left`}
        </span>
        <span className="text-xs text-slate-500">
          {activeCount}/{capacity}
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200" aria-hidden="true">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
      {waitlistCount > 0 && <p className="mt-1 text-xs text-sky-700">{waitlistCount} on waitlist</p>}
    </div>
  )
}
