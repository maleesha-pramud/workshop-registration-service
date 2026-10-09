// Small, consistent building blocks so every screen looks and behaves the same.
import { useEffect, useId } from 'react'

const cx = (...classes) => classes.filter(Boolean).join(' ')

const BUTTON_VARIANTS = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:outline-indigo-600',
  secondary: 'bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600',
  ghost: 'text-slate-600 hover:bg-slate-100',
}

export function Button({ variant = 'primary', size = 'md', loading, disabled, className, children, ...props }) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'px-2.5 py-1.5 text-sm' : 'px-4 py-2 text-sm',
        BUTTON_VARIANTS[variant],
        className,
      )}
      {...props}
    >
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  )
}

export function Spinner({ className = 'h-6 w-6' }) {
  return (
    <svg className={cx('animate-spin text-current', className)} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  )
}

export function PageLoader() {
  return (
    <div className="flex justify-center py-16 text-indigo-600" role="status" aria-label="Loading">
      <Spinner className="h-8 w-8" />
    </div>
  )
}

const inputClass =
  'block w-full rounded-lg border-0 px-3 py-2 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 ' +
  'placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 disabled:bg-slate-100'

/** Label + control + hint/error, wired up for screen readers. */
export function Field({ label, error, hint, children, className }) {
  const id = useId()
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      {children({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': error || hint ? `${id}-msg` : undefined,
        className: cx(inputClass, error && 'ring-red-400 focus:ring-red-500'),
      })}
      {(error || hint) && (
        <p id={`${id}-msg`} className={cx('mt-1 text-xs', error ? 'text-red-600' : 'text-slate-500')}>
          {error || hint}
        </p>
      )}
    </div>
  )
}

export function Card({ className, children }) {
  return <div className={cx('rounded-xl bg-white shadow-sm ring-1 ring-slate-200', className)}>{children}</div>
}

const ALERT_TONES = {
  error: 'bg-red-50 text-red-800 ring-red-200',
  warning: 'bg-amber-50 text-amber-900 ring-amber-200',
  success: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  info: 'bg-sky-50 text-sky-800 ring-sky-200',
}

export function Alert({ tone = 'info', title, children, className }) {
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={cx('rounded-lg p-3 text-sm ring-1', ALERT_TONES[tone], className)}>
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className={title ? 'mt-1' : ''}>{children}</div>}
    </div>
  )
}

const BADGE_TONES = {
  gray: 'bg-slate-100 text-slate-700 ring-slate-200',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  amber: 'bg-amber-50 text-amber-800 ring-amber-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  blue: 'bg-sky-50 text-sky-700 ring-sky-200',
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
}

export function Badge({ tone = 'gray', children }) {
  return (
    <span className={cx('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', BADGE_TONES[tone])}>
      {children}
    </span>
  )
}

export function EmptyState({ title, children }) {
  return (
    <div className="px-6 py-12 text-center">
      <p className="font-medium text-slate-700">{title}</p>
      {children && <div className="mt-1 text-sm text-slate-500">{children}</div>}
    </div>
  )
}

export function Modal({ open, title, onClose, children, footer }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-label={title} className="relative w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">{footer}</div>}
      </div>
    </div>
  )
}

export function Pagination({ meta, onPage }) {
  if (!meta || meta.totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm text-slate-600">
      <span>
        Page {meta.page} of {meta.totalPages} · {meta.total} total
      </span>
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>
          Previous
        </Button>
        <Button size="sm" variant="secondary" disabled={meta.page >= meta.totalPages} onClick={() => onPage(meta.page + 1)}>
          Next
        </Button>
      </div>
    </div>
  )
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}
