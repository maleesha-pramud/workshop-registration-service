import { useState } from 'react'
import { usersApi } from '../api/endpoints'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../hooks/useAuth'
import {
  Alert,
  Button,
  Card,
  ChipGroup,
  EmptyState,
  PageHeader,
  PageLoader,
  Pagination,
  SearchInput,
} from '../components/ui'
import { UsersTable } from '../components/users/UsersTable'
import { CreateUserModal } from '../components/users/CreateUserModal'
import { EditUserModal } from '../components/users/EditUserModal'
import { ResetPasswordModal } from '../components/users/ResetPasswordModal'

const STATUS_FILTERS = [
  { id: '', label: 'Everyone' },
  { id: 'active', label: 'Active' },
  { id: 'inactive', label: 'Deactivated' },
]

/** Admin-only: create staff accounts, change roles, deactivate, reset passwords. */
export default function UsersPage() {
  const { user: me } = useAuth()
  const [params, setParams] = useState({ q: '', status: '', page: 1 })
  const {
    data: users,
    meta,
    loading,
    error,
    reload,
  } = useApi(
    () =>
      usersApi.list({
        q: params.q || undefined,
        isActive: params.status ? String(params.status === 'active') : undefined,
        page: params.page,
        pageSize: 20,
      }),
    [params],
  )
  const filtered = Boolean(params.q || params.status)

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
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-4">
          <SearchInput
            className="max-w-sm"
            placeholder="Search by name or email"
            label="Search staff"
            value={params.q}
            onChange={(q) => setParams((p) => ({ ...p, q, page: 1 }))}
          />
          <ChipGroup
            label="Show"
            options={STATUS_FILTERS}
            value={params.status}
            onChange={(o) => setParams((p) => ({ ...p, status: o.id, page: 1 }))}
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
          <EmptyState
            title={filtered ? 'No accounts match your search' : 'No accounts yet'}
            action={
              filtered && (
                <Button variant="secondary" onClick={() => setParams({ q: '', status: '', page: 1 })}>
                  Clear search and filters
                </Button>
              )
            }
          />
        ) : (
          users && (
            <UsersTable
              users={users}
              currentUserId={me.id}
              onEdit={(user) => setModal({ type: 'edit', user })}
              onResetPassword={(user) => setModal({ type: 'password', user })}
              onChanged={reload}
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
