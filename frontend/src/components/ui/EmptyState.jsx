/** "Nothing here" message. Add an `action` (a Button) so the next step is obvious. */
export function EmptyState({ title, children, action }) {
  return (
    <div className="px-6 py-12 text-center">
      <p className="font-medium text-slate-700">{title}</p>
      {children && <div className="mt-1 text-sm text-slate-500">{children}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
