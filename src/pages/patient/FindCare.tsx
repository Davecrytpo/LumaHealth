import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { ClinicianCard } from '@shared/types'
import { json } from '@/lib/api'
import { formatTime, relativeDayLabel } from '@/lib/dates'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { SPECIALTIES, LANGUAGES } from '@shared/constants'

export function FindCare() {
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [availability, setAvailability] = useState('')
  const [consultation, setConsultation] = useState('')
  const [language, setLanguage] = useState('')

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQ(q), 250)
    return () => window.clearTimeout(id)
  }, [q])

  const params = new URLSearchParams({ q: debouncedQ, specialty, availability, consultation, language })
  const query = useQuery({
    queryKey: ['clinicians', debouncedQ, specialty, availability, consultation, language],
    queryFn: () => json.get<{ items: ClinicianCard[] }>(`/api/patient/clinicians?${params}`),
  })

  return (
    <div className="lh-page">
      <h1 className="lh-display">Find the right care.</h1>
      <div className="mt-6 md:mt-8">
        <Input
          label="Search by name or specialty"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or specialty"
        />
        <details className="mt-4 md:hidden">
          <summary className="cursor-pointer py-2 text-sm text-ink">Filters</summary>
          <div className="mt-3 grid gap-3">
            <Select
              label="Specialty"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              options={[{ value: '', label: 'Any' }, ...SPECIALTIES.map((s) => ({ value: s, label: s }))]}
            />
            <Select
              label="Availability"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              options={[
                { value: '', label: 'Any' },
                { value: 'this-week', label: 'This week' },
              ]}
            />
            <Select
              label="Consultation"
              value={consultation}
              onChange={(e) => setConsultation(e.target.value)}
              options={[
                { value: '', label: 'Any' },
                { value: 'video', label: 'Video' },
                { value: 'in-person', label: 'In person' },
              ]}
            />
            <Select
              label="Language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              options={[{ value: '', label: 'Any' }, ...LANGUAGES.map((s) => ({ value: s, label: s }))]}
            />
          </div>
        </details>
        <div className="mt-4 hidden gap-4 md:grid md:grid-cols-2 lg:grid-cols-4">
          <Select
            label="Specialty"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            options={[{ value: '', label: 'Any' }, ...SPECIALTIES.map((s) => ({ value: s, label: s }))]}
          />
          <Select
            label="Availability"
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            options={[
              { value: '', label: 'Any' },
              { value: 'this-week', label: 'This week' },
            ]}
          />
          <Select
            label="Consultation"
            value={consultation}
            onChange={(e) => setConsultation(e.target.value)}
            options={[
              { value: '', label: 'Any' },
              { value: 'video', label: 'Video' },
              { value: 'in-person', label: 'In person' },
            ]}
          />
          <Select
            label="Language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            options={[{ value: '', label: 'Any' }, ...LANGUAGES.map((s) => ({ value: s, label: s }))]}
          />
        </div>
      </div>

      <div className="mt-12">
        {query.isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : query.isError ? (
          <ErrorState
            title="We couldn't load clinicians."
            body="Please try again in a moment."
            onRetry={() => void query.refetch()}
          />
        ) : !query.data?.items.length ? (
          <EmptyState title="No clinicians match this search." body="Try a wider specialty or clear a filter." />
        ) : (
          <ul className="divide-y divide-line border-t border-line">
            {query.data.items.map((doc) => (
              <li key={doc.id} className="py-6 md:py-8">
                <h2 className="text-[13px] font-medium uppercase tracking-[0.16em]">
                  {doc.firstName} {doc.lastName}
                </h2>
                <p className="mt-2 font-display text-2xl md:text-3xl">{doc.specialty}</p>
                <p className="mt-4 text-sm text-muted">
                  {doc.yearsExperience} years experience
                </p>
                <p className="text-sm text-muted">{doc.languages.join(' · ')}</p>
                <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="lh-kicker">Next available</p>
                    <p className="mt-2 text-sm">
                      {doc.nextAvailable
                        ? `${relativeDayLabel(doc.nextAvailable)} · ${formatTime(doc.nextAvailable)}`
                        : 'No open hours this fortnight'}
                    </p>
                  </div>
                  <Link to={`/patient/find-care/${doc.id}`} className="text-sm hover:underline">
                    View profile →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
