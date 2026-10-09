import { cx } from '../../utils/cx'

const TONES = {
  error: 'bg-red-50 text-red-800 ring-red-200',
  warning: 'bg-amber-50 text-amber-900 ring-amber-200',
  success: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  info: 'bg-sky-50 text-sky-800 ring-sky-200',
}

/** tone: error | warning | success | info */
export function Alert({ tone = 'info', title, children, className }) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cx('rounded-lg p-3 text-sm ring-1', TONES[tone], className)}
    >
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className={title ? 'mt-1' : ''}>{children}</div>}
    </div>
  )
}
