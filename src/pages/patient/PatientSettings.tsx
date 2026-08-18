import { useMutation, useQuery } from '@tanstack/react-query'
import type { Appearance, PatientProfile, PublicUser } from '@shared/types'
import { json } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { useToast } from '@/context/ToastContext'
import { cn } from '@/lib/cn'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'

export function PatientSettings() {
  const { setUser } = useAuth()
  const { appearance, setAppearance } = useTheme()
  const toast = useToast()
  const query = useQuery({
    queryKey: ['patient', 'profile'],
    queryFn: () => json.get<{ user: PublicUser; profile: PatientProfile }>('/api/patient/profile'),
  })
  const prefs = query.data?.profile.notifications

  const save = useMutation({
    mutationFn: (body: { appearance?: Appearance; notifications?: PatientProfile['notifications'] }) =>
      json.patch<{ user: PublicUser & { appearance: Appearance } }>('/api/auth/settings', body),
    onSuccess: (data) => {
      setUser({ ...data.user })
      toast.push('Settings saved.')
      void query.refetch()
    },
    onError: () => toast.push('Those settings could not be saved.', 'error'),
  })

  function toggle(key: keyof NonNullable<typeof prefs>) {
    if (!prefs) return
    const next = { ...prefs, [key]: !prefs[key] }
    save.mutate({ notifications: next })
  }

  if (query.isError) {
    return (
      <div className="lh-page">
        <ErrorState title="We couldn't load your settings." body="Please try again." onRetry={() => void query.refetch()} />
      </div>
    )
  }

  if (query.isLoading) {
    return (
      <div className="lh-page">
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  return (
    <div className="lh-page max-w-xl">
      <h1 className="lh-display">Help & settings</h1>
      <section className="mt-12 border-t border-line pt-6">
        <h2 className="text-sm font-medium">Help</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Appointments, prescriptions, and care updates live in the menu. If something looks wrong,
          try again from the page, or sign out and back in.
        </p>
      </section>
      <section className="mt-10 border-t border-line pt-6">
        <h2 className="text-sm font-medium">Notifications</h2>
        <ul className="mt-5 divide-y divide-line">
          {[
            ['appointmentReminders', 'Appointment reminders'],
            ['prescriptionUpdates', 'Prescription updates'],
            ['careTeamMessages', 'Care team messages'],
          ].map(([key, label]) => (
            <li key={key} className="flex items-center justify-between py-4 text-sm">
              <span>{label}</span>
              <button
                type="button"
                className="text-muted"
                aria-pressed={Boolean(prefs?.[key as keyof NonNullable<typeof prefs>])}
                onClick={() => toggle(key as keyof NonNullable<typeof prefs>)}
              >
                {prefs?.[key as keyof NonNullable<typeof prefs>] ? 'On' : 'Off'}
              </button>
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-10 border-t border-line pt-6">
        <h2 className="text-sm font-medium">Appearance</h2>
        <div className="mt-4 flex gap-3">
          {(['system', 'light', 'dark'] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              className={cn(
                'rounded-lh border px-4 py-2 text-sm capitalize',
                appearance === opt ? 'border-ink' : 'border-line',
              )}
              onClick={() => {
                setAppearance(opt)
                save.mutate({ appearance: opt })
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      </section>
      <section className="mt-10 border-t border-line pt-6">
        <h2 className="text-sm font-medium">Privacy</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Your records stay inside your role. Clinicians only see people they already care for.
        </p>
      </section>
      <section className="mt-10 border-t border-line pt-6">
        <h2 className="text-sm font-medium">Security</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Sessions end when you sign out. Password reset is available from the sign-in screen.
        </p>
      </section>
    </div>
  )
}
