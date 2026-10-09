import { usersApi } from '../../api/endpoints'
import { useToast } from '../../hooks/useToast'
import { StatusToggle } from '../ui'

/** Activate / deactivate an account, with a confirmation. Admins can't deactivate themselves. */
export function UserStatusToggle({ user, isSelf, onChanged }) {
  const { notify } = useToast()

  return (
    <StatusToggle
      checked={user.isActive}
      label={`${user.isActive ? 'Deactivate' : 'Activate'} ${user.name}`}
      disabledReason={isSelf ? "You can't deactivate your own account" : undefined}
      confirm={(next) =>
        next
          ? {
              title: `Activate ${user.name}?`,
              confirmLabel: 'Activate',
              message: <p>{user.name} will be able to sign in again with their existing password.</p>,
            }
          : {
              title: `Deactivate ${user.name}?`,
              confirmLabel: 'Deactivate',
              tone: 'danger',
              message: (
                <p>
                  {user.name} will be signed out immediately and unable to sign in. Their history is kept and
                  you can activate the account again at any time.
                </p>
              ),
            }
      }
      onToggle={async (next) => {
        await usersApi.update(user.id, { isActive: next })
        notify(`${user.name} ${next ? 'activated' : 'deactivated'}`)
      }}
      onDone={onChanged}
    />
  )
}
