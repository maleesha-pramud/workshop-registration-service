import { cx } from '../../utils/cx'

/**
 * A row of quick-pick buttons where one can be selected ("All · Active · Deactivated").
 * `options` is [{ id, label }]; `value` is the selected id.
 */
export function ChipGroup({ options, value, onChange, label, className }) {
  return (
    <div className={cx('flex flex-wrap gap-2', className)} role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          onClick={() => onChange(o)}
          className={cx(
            'rounded-full px-3 py-1.5 text-sm font-medium ring-1 transition-colors',
            value === o.id
              ? 'bg-indigo-600 text-white ring-indigo-600'
              : 'bg-white text-slate-700 ring-slate-300 hover:bg-slate-50',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
