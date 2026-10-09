import { useId } from 'react'
import { cx } from '../../utils/cx'

const INPUT_CLASS =
  'block w-full rounded-lg border-0 px-3 py-2 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 ' +
  'placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 disabled:bg-slate-100'

/**
 * Label + control + hint/error, wired up for screen readers.
 * Children is a render function so the control receives the right id, aria and class props:
 *   <Field label="Email" error={errors.email}>{(p) => <input {...p} value={...} />}</Field>
 */
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
        className: cx(INPUT_CLASS, error && 'ring-red-400 focus:ring-red-500'),
      })}
      {(error || hint) && (
        <p id={`${id}-msg`} className={cx('mt-1 text-xs', error ? 'text-red-600' : 'text-slate-500')}>
          {error || hint}
        </p>
      )}
    </div>
  )
}
