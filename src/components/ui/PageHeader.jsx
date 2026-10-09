import { usePageTitle } from '../../hooks/usePageTitle'

/** Page heading. Also sets the browser tab title, so people with several tabs can tell them apart. */
export function PageHeader({ title, subtitle, actions }) {
  usePageTitle(title)
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
