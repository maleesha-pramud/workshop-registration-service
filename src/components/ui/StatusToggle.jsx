import { useState } from 'react'
import { cx } from '../../utils/cx'
import { ConfirmDialog } from './ConfirmDialog'

/**
 * A switch for flipping a record between two states (active/inactive, open/closed).
 * Clicking never changes anything directly: it opens a confirmation dialog first.
 *
 *   <StatusToggle
 *     checked={user.isActive}
 *     label="Deactivate Jane"
 *     confirm={(next) => ({ title, message, confirmLabel, tone })}
 *     onToggle={(next) => usersApi.update(user.id, { isActive: next })}
 *     onDone={reload}
 *   />
 *
 * `disabledReason` greys the switch out and explains why in a tooltip.
 */
export function StatusToggle({ checked, label, confirm, onToggle, onDone, disabledReason }) {
  const [pendingNext, setPendingNext] = useState(null) // the state being confirmed, or null
  const dialog = pendingNext === null ? null : confirm(pendingNext)

  return (
    <>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        title={disabledReason ?? label}
        disabled={Boolean(disabledReason)}
        onClick={() => setPendingNext(!checked)}
        className={cx(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600',
          'disabled:cursor-not-allowed disabled:opacity-50',
          checked ? 'bg-emerald-500' : 'bg-slate-300',
        )}
      >
        <span
          className={cx(
            'inline-block h-5 w-5 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-[22px]' : 'translate-x-0.5',
          )}
        />
      </button>

      {dialog && (
        <ConfirmDialog
          title={dialog.title}
          confirmLabel={dialog.confirmLabel}
          tone={dialog.tone}
          onClose={() => setPendingNext(null)}
          onConfirm={async () => {
            await onToggle(pendingNext)
            onDone?.()
          }}
        >
          {dialog.message}
        </ConfirmDialog>
      )}
    </>
  )
}
