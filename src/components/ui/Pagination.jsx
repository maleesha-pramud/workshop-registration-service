import { Button } from './Button'

/** Expects the `meta` object the API returns: { page, pageSize, totalPages, total }. */
export function Pagination({ meta, onPage }) {
  if (!meta || meta.totalPages <= 1) return null
  const first = (meta.page - 1) * meta.pageSize + 1
  const last = Math.min(meta.page * meta.pageSize, meta.total)
  return (
    <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm text-slate-600">
      <span>
        Showing {first}–{last} of {meta.total}
      </span>
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>
          ← Previous
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={meta.page >= meta.totalPages}
          onClick={() => onPage(meta.page + 1)}
        >
          Next →
        </Button>
      </div>
    </div>
  )
}
