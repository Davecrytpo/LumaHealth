import { Link } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import type { DoctorProfile as Profile } from '@shared/types'
import { json } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/context/ToastContext'
import { useState } from 'react'

interface Response {
  user: { id: string; firstName: string; lastName: string; email: string }
  profile: Profile
}

export function DoctorProfile() {
  const toast = useToast()
  const query = useQuery({
    queryKey: ['doctor', 'profile'],
    queryFn: () => json.get<Response>('/api/doctor/profile'),
  })
  const [bio, setBio] = useState<string | null>(null)
  const save = useMutation({
    mutationFn: () => json.patch('/api/doctor/profile', { bio: bio ?? query.data?.profile.bio }),
    onSuccess: () => toast.push('Profile saved.'),
  })

  if (query.isError) {
    return (
      <div className="lh-page">
        <ErrorState title="We couldn't load your profile." body="Please try again." onRetry={() => void query.refetch()} />
      </div>
    )
  }
  if (query.isLoading || !query.data) {
    return (
      <div className="lh-page">
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  const { user, profile } = query.data
  return (
    <div className="lh-page max-w-2xl">
      <h1 className="font-display text-4xl">
        Dr. {user.firstName} {user.lastName}
      </h1>
      <p className="mt-2 text-sm text-muted">{user.email}</p>
      <div className="mt-12 space-y-10">
        <section className="border-t border-line pt-6">
          <p className="lh-kicker">Professional profile</p>
          <div className="mt-4">
            <Textarea label="About" value={bio ?? profile.bio} onChange={(e) => setBio(e.target.value)} />
            <div className="mt-4">
              <Button size="sm" onClick={() => save.mutate()} loading={save.isPending}>
                Save
              </Button>
            </div>
          </div>
        </section>
        <section className="border-t border-line pt-6">
          <p className="lh-kicker">Specialties</p>
          <p className="mt-3 text-sm">{profile.specialty}</p>
        </section>
        <section className="border-t border-line pt-6">
          <p className="lh-kicker">Experience</p>
          <p className="mt-3 text-sm">{profile.yearsExperience} years</p>
        </section>
        <section className="border-t border-line pt-6">
          <p className="lh-kicker">Languages</p>
          <p className="mt-3 text-sm">{profile.languages.join(' · ')}</p>
        </section>
        <section className="border-t border-line pt-6">
          <p className="lh-kicker">Consultation types</p>
          <p className="mt-3 text-sm">
            {profile.consultationTypes.map((t) => (t === 'video' ? 'Video' : 'In person')).join(' · ')}
          </p>
        </section>
        <section className="border-t border-line pt-6">
          <p className="lh-kicker">Availability</p>
          <Link to="/doctor/availability" className="mt-3 inline-block text-sm hover:underline">
            Edit published hours →
          </Link>
        </section>
      </div>
    </div>
  )
}
