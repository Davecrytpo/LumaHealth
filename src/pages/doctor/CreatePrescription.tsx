import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { json } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { DatePicker } from '@/components/ui/DatePicker'
import { ErrorState } from '@/components/ui/ErrorState'
import { useToast } from '@/context/ToastContext'
import { ApiError } from '@/lib/api'

interface PatientRow {
  id: string
  firstName: string
  lastName: string
}

export function CreatePrescription() {
  const navigate = useNavigate()
  const toast = useToast()
  const patients = useQuery({
    queryKey: ['doctor', 'patients', ''],
    queryFn: () => json.get<{ items: PatientRow[] }>('/api/doctor/patients'),
  })
  const [form, setForm] = useState({
    patientId: '',
    medication: '',
    dosage: '',
    frequency: '',
    startDate: '2026-08-18',
    endDate: '2026-11-18',
    refills: '2',
    instructions: '',
  })

  const create = useMutation({
    mutationFn: () =>
      json.post('/api/doctor/prescriptions', {
        ...form,
        refills: Number(form.refills),
      }),
    onSuccess: () => {
      toast.push('Prescription created.')
      navigate('/doctor/prescriptions')
    },
    onError: (err) => toast.push(err instanceof ApiError ? err.message : 'We could not create that prescription.', 'error'),
  })

  return (
    <div className="lh-page max-w-xl">
      <Link to="/doctor/prescriptions" className="text-sm text-muted hover:text-ink">
        ← Prescriptions
      </Link>
      <h1 className="mt-6 font-display text-4xl">Create prescription</h1>
      <form
        className="mt-10 space-y-5"
        onSubmit={(e) => {
          e.preventDefault()
          create.mutate()
        }}
      >
        {patients.isError ? (
          <ErrorState
            title="We couldn't load your patients."
            body="A prescription needs a person you already care for."
            onRetry={() => void patients.refetch()}
          />
        ) : (
          <Select
            label="Patient"
            value={form.patientId}
            onChange={(e) => setForm({ ...form, patientId: e.target.value })}
            options={[
              { value: '', label: patients.isLoading ? 'Loading patients…' : 'Select patient' },
              ...(patients.data?.items.map((p) => ({
                value: p.id,
                label: `${p.firstName} ${p.lastName}`,
              })) ?? []),
            ]}
          />
        )}
        <Input label="Medication" value={form.medication} onChange={(e) => setForm({ ...form, medication: e.target.value })} required />
        <Input label="Dosage" value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} required />
        <Input label="Frequency" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} required />
        <DatePicker label="Start date" value={form.startDate} onChange={(v) => setForm({ ...form, startDate: v })} />
        <DatePicker label="End date" value={form.endDate} onChange={(v) => setForm({ ...form, endDate: v })} />
        <Input label="Refills" type="number" min={0} max={12} value={form.refills} onChange={(e) => setForm({ ...form, refills: e.target.value })} />
        <Textarea label="Instructions" value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} required />
        <Button type="submit" loading={create.isPending} disabled={!form.patientId || patients.isError}>
          Create prescription
        </Button>
      </form>
    </div>
  )
}
