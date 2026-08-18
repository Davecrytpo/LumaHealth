import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import type { AvailabilityWindow } from '@shared/types'
import { json } from '@/lib/api'
import { DAY_NAMES } from '@shared/constants'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/context/ToastContext'

export function AvailabilityEditor() {
  const toast = useToast()
  const query = useQuery({
    queryKey: ['doctor', 'availability'],
    queryFn: () => json.get<{ windows: AvailabilityWindow[] }>('/api/doctor/availability'),
  })
  const [windows, setWindows] = useState<AvailabilityWindow[]>([])

  useEffect(() => {
    if (query.data) setWindows(query.data.windows)
  }, [query.data])

  const save = useMutation({
    mutationFn: () =>
      json.put('/api/doctor/availability', {
        windows: windows.map((w) => ({ dayOfWeek: w.dayOfWeek, start: w.start, end: w.end })),
      }),
    onSuccess: () => toast.push('Availability saved.'),
    onError: () => toast.push('Those hours could not be saved.', 'error'),
  })

  if (query.isLoading) {
    return (
      <div className="lh-page">
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }
  if (query.isError) {
    return (
      <div className="lh-page">
        <ErrorState title="We couldn't load your hours." body="Please try again." onRetry={() => void query.refetch()} />
      </div>
    )
  }

  const weekdays = [1, 2, 3, 4, 5]

  return (
    <div className="lh-page max-w-xl">
      <h1 className="lh-display">Availability</h1>
      <div className="mt-10 space-y-10">
        {weekdays.map((day) => {
          const dayWindows = windows.filter((w) => w.dayOfWeek === day)
          return (
            <section key={day} className="border-t border-line pt-5">
              <p className="lh-kicker">{DAY_NAMES[day]}</p>
              <div className="mt-4 space-y-3">
                {dayWindows.map((w) => (
                  <div key={w.id} className="flex items-center gap-3">
                    <Input
                      label="Start"
                      hideLabel
                      value={w.start}
                      onChange={(e) =>
                        setWindows((prev) => prev.map((x) => (x.id === w.id ? { ...x, start: e.target.value } : x)))
                      }
                    />
                    <span className="text-muted">—</span>
                    <Input
                      label="End"
                      hideLabel
                      value={w.end}
                      onChange={(e) =>
                        setWindows((prev) => prev.map((x) => (x.id === w.id ? { ...x, end: e.target.value } : x)))
                      }
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setWindows((prev) => prev.filter((x) => x.id !== w.id))}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  variant="tertiary"
                  onClick={() =>
                    setWindows((prev) => [
                      ...prev,
                      { id: `local_${Math.random()}`, doctorId: '', dayOfWeek: day, start: '09:00', end: '12:00' },
                    ])
                  }
                >
                  Add availability
                </Button>
              </div>
            </section>
          )
        })}
      </div>
      <div className="mt-10">
        <Button onClick={() => save.mutate()} loading={save.isPending}>
          Save hours
        </Button>
      </div>
    </div>
  )
}
