import { cx } from '../../utils/cx'

export function Card({ className, children }) {
  return (
    <div className={cx('rounded-xl bg-white shadow-sm ring-1 ring-slate-200', className)}>{children}</div>
  )
}
