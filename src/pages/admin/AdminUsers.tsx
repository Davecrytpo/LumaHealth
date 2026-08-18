import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { PublicUser, UserStatus } from '@shared/types'
import { json } from '@/lib/api'
import { formatShortDate } from '@/lib/dates'
import { Input } from '@/components/ui/Input'
import { UserStatusBadge } from '@/components/ui/StatusIndicator'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/context/ToastContext'

export function AdminUsers() {
  const [q, setQ] = useState('')
  const toast = useToast()
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: ['admin', 'users', q],
    queryFn: () => json.get<{ items: PublicUser[] }>(`/api/admin/users?q=${encodeURIComponent(q)}`),
  })
  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: UserStatus }) => json.patch(`/api/admin/users/${id}`, { status }),
    onSuccess: () => {
      toast.push('User updated.')
      void qc.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })

  return (
    <div className="lh-page">
      <h1 className="lh-display">Users</h1>
      <div className="mt-8 max-w-md">
        <Input label="Search users" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="mt-8">
        {query.isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : query.isError ? (
          <ErrorState title="We couldn't load users." body="Please try again." onRetry={() => void query.refetch()} />
        ) : (
          <>
          <ul className="divide-y divide-line border-t border-line md:hidden">
            {query.data?.items.map((u) => (
              <li key={u.id} className="flex items-start justify-between gap-3 py-4">
                <div>
                  <p className="text-sm">
                    {u.firstName} {u.lastName}
                  </p>
                  <p className="mt-1 text-xs capitalize text-muted">{u.role === 'clinician' ? 'Clinician' : u.role}</p>
                </div>
                <button
                  type="button"
                  className="min-h-11"
                  onClick={() => update.mutate({ id: u.id, status: u.status === 'active' ? 'suspended' : 'active' })}
                >
                  <UserStatusBadge status={u.status} />
                </button>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-[11px] uppercase tracking-[0.14em] text-muted">
              <tr>
                <th className="py-3 font-medium">Name</th>
                <th className="font-medium">Role</th>
                <th className="font-medium">Status</th>
                <th className="font-medium">Joined</th>
                <th className="font-medium">Last activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line border-t border-line">
              {query.data?.items.map((u) => (
                <tr key={u.id}>
                  <td className="py-4">
                    {u.firstName} {u.lastName}
                  </td>
                  <td className="capitalize">{u.role === 'clinician' ? 'Clinician' : u.role}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() =>
                        update.mutate({ id: u.id, status: u.status === 'active' ? 'suspended' : 'active' })
                      }
                    >
                      <UserStatusBadge status={u.status} />
                    </button>
                  </td>
                  <td>{formatShortDate(u.createdAt)}</td>
                  <td>{formatShortDate(u.lastActiveAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          </>
        )}
      </div>
    </div>
  )
}
