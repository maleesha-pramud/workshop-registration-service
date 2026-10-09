import { useState } from 'react'
import { usersApi } from '../api/endpoints'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../hooks/useAuth'
import { Alert, Button, Card, EmptyState, PageHeader, PageLoader, Pagination } from '../components/ui'
import { UsersTable } from '../components/users/UsersTable'
import { CreateUserModal } from '../components/users/CreateUserModal'
import { EditUserModal } from '../components/users/EditUserModal'
import { ResetPasswordModal } from '../components/users/ResetPasswordModal'

/** Admin-only: create staff accounts, change roles, deactivate, reset passwords. */
export default function UsersPage() {
  const { user: me } = useAuth()
  const [params, setParams] = useState({ q: '', page: 1 })
  const {
    data: users,
    meta,
    loading,
    error,
    reload,
  } = useApi(() => usersApi.list({ q: params.q || undefined, page: params.page, pageSize: 20 }), [params])

  // Which dialog is open: { type: 'create' | 'edit' | 'password', user? }
  const [modal, setModal] = useState(null)
  const close = () => setModal(null)
  const done = () => {
    close()
    reload()
  }

  return (
    <>
      <PageHeader
        title="Staff accounts"
        subtitle="Create accounts for your team and choose what each person can do."
        actions={<Button onClick={() => setModal({ type: 'create' })}>Add staff member</Button>}
      />

      <Card>
        <div className="border-b border-slate-200 p-4">
          <input
            type="search"
            placeholder="Search by name or email"
            aria-label="Search staff"
            className="w-full max-w-sm rounded-lg border-0 px-3 py-2 text-sm ring-1 ring-slate-300 focus:ring-2 focus:ring-indigo-600"
            value={params.q}
            onChange={(e) => setParams({ q: e.target.value, page: 1 })}
          />
        </div>

        {error && (
          <Alert tone="error" className="m-4">
            {error.message}
          </Alert>
        )}
        {loading && !users ? (
          <PageLoader />
        ) : users?.length === 0 ? (
          <EmptyState title="No accounts found" />
        ) : (
          users && (
            <UsersTable
              users={users}
              currentUserId={me.id}
              onEdit={(user) => setModal({ type: 'edit', user })}
              onResetPassword={(user) => setModal({ type: 'password', user })}
            />
          )
        )}
        <Pagination meta={meta} onPage={(page) => setParams((p) => ({ ...p, page }))} />
      </Card>

      {modal?.type === 'create' && <CreateUserModal onClose={close} onDone={done} />}
      {modal?.type === 'edit' && (
        <EditUserModal user={modal.user} isSelf={modal.user.id === me.id} onClose={close} onDone={done} />
      )}
      {modal?.type === 'password' && <ResetPasswordModal user={modal.user} onClose={close} onDone={done} />}
    </>
  )
}
