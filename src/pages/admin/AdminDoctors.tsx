import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { VerificationStatus } from '@shared/types'
import { json } from '@/lib/api'
import { UserStatusBadge, VerificationBadge } from '@/components/ui/StatusIndicator'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/context/ToastContext'

interface DoctorRow {
  id: string
  firstName: string
  lastName: string
  specialty: string
  verificationStatus: VerificationStatus
  status: 'active' | 'invited' | 'suspended'
  appointments: number
}

export function AdminDoctors() {
  const toast = useToast()
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: ['admin', 'doctors'],
    queryFn: () => json.get<{ items: DoctorRow[] }>('/api/admin/doctors'),
  })
  const update = useMutation({
    mutationFn: ({ id, verificationStatus }: { id: string; verificationStatus: VerificationStatus }) =>
      json.patch(`/api/admin/doctors/${id}`, { verificationStatus }),
    onSuccess: () => {
      toast.push('Clinician updated.')
      void qc.invalidateQueries({ queryKey: ['admin'] })
    },
  })

  return (
    <div className="lh-page">
      <h1 className="lh-display">Doctors</h1>
      <div className="mt-8">
        {query.isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : query.isError ? (
          <ErrorState title="We couldn't load clinicians." body="Please try again." onRetry={() => void query.refetch()} />
        ) : (
          <>
          <ul className="divide-y divide-line border-t border-line md:hidden">
            {query.data?.items.map((d) => (
              <li key={d.id} className="py-4">
                <p className="text-sm">
                  Dr. {d.firstName} {d.lastName}
                </p>
                <p className="mt-1 text-xs text-muted">{d.specialty}</p>
                <div className="mt-3 flex items-center justify-between">
                  <button
                    type="button"
                    className="min-h-11"
                    onClick={() =>
                      update.mutate({
                        id: d.id,
                        verificationStatus: d.verificationStatus === 'verified' ? 'pending' : 'verified',
                      })
                    }
                  >
                    <VerificationBadge status={d.verificationStatus} />
                  </button>
                  <UserStatusBadge status={d.status} />
                </div>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-[11px] uppercase tracking-[0.14em] text-muted">
              <tr>
                <th className="py-3 font-medium">Doctor</th>
                <th className="font-medium">Specialty</th>
                <th className="font-medium">Verification</th>
                <th className="font-medium">Status</th>
                <th className="font-medium">Appointments</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line border-t border-line">
              {query.data?.items.map((d) => (
                <tr key={d.id}>
                  <td className="py-4">
                    Dr. {d.firstName} {d.lastName}
                  </td>
                  <td>{d.specialty}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() =>
                        update.mutate({
                          id: d.id,
                          verificationStatus: d.verificationStatus === 'verified' ? 'pending' : 'verified',
                        })
                      }
                    >
                      <VerificationBadge status={d.verificationStatus} />
                    </button>
                  </td>
                  <td>
                    <UserStatusBadge status={d.status} />
                  </td>
                  <td>{d.appointments}</td>
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
