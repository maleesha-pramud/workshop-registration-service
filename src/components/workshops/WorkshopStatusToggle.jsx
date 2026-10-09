import { workshopsApi } from '../../api/endpoints'
import { useToast } from '../../hooks/useToast'
import { StatusToggle } from '../ui'

/**
 * Open / close registration for a workshop, with a confirmation.
 * Only shown for OPEN and CLOSED workshops (cancelled and completed ones are final).
 */
export function WorkshopStatusToggle({ workshop, onChanged }) {
  const { notify } = useToast()
  const isOpen = workshop.status === 'OPEN'

  return (
    <StatusToggle
      checked={isOpen}
      label={`${isOpen ? 'Close' : 'Open'} registration for ${workshop.title}`}
      confirm={(next) =>
        next
          ? {
              title: `Open "${workshop.title}" for registration?`,
              confirmLabel: 'Open registration',
              message: <p>Front desk staff will be able to register attendees again.</p>,
            }
          : {
              title: `Close registration for "${workshop.title}"?`,
              confirmLabel: 'Close registration',
              tone: 'danger',
              message: (
                <p>
                  No new attendees can be registered or waitlisted. Existing registrations are kept, and you
                  can reopen registration at any time.
                </p>
              ),
            }
      }
      onToggle={async (next) => {
        await workshopsApi.update(workshop.id, { status: next ? 'OPEN' : 'CLOSED' })
        notify(`Registration ${next ? 'opened' : 'closed'} for ${workshop.title}`)
      }}
      onDone={onChanged}
    />
  )
}
