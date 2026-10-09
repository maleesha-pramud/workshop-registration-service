import { cx } from '../../utils/cx'

/** Search box with a clear (×) button, so starting over is one click. */
export function SearchInput({ value, onChange, placeholder, label, className, autoFocus }) {
  return (
    <div className={cx('relative w-full', className)}>
      <input
        type="search"
        autoFocus={autoFocus}
        placeholder={placeholder}
        aria-label={label ?? placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full rounded-lg border-0 px-3 py-2 pr-9 text-sm ring-1 ring-slate-300 focus:ring-2 focus:ring-indigo-600 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute inset-y-0 right-0 grid w-9 place-items-center text-slate-400 hover:text-slate-700"
        >
          ✕
        </button>
      )}
    </div>
  )
}
