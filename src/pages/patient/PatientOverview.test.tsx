import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { PatientOverview } from './PatientOverview'
import { renderApp } from '@/test/render'
import { json } from '@/lib/api'
import type { AppointmentView, PatientOverview as Overview } from '@shared/types'

vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api')>('@/lib/api')
  return {
    ...actual,
    json: {
      ...actual.json,
      get: vi.fn(),
    },
  }
})

const overview: Overview = {
  greetingName: 'David',
  nextAppointment: null,
  careSignal: {
    title: 'Prescription refill',
    body: 'Metformin has 2 refills remaining.',
    href: '/patient/prescriptions/rx_1',
  },
  week: [
    { date: '2026-08-17', label: '17', weekday: 'MON', slots: [] },
    { date: '2026-08-18', label: '18', weekday: 'TUE', slots: [] },
    { date: '2026-08-19', label: '19', weekday: 'WED', slots: [{ time: '10:30' }] },
    { date: '2026-08-20', label: '20', weekday: 'THU', slots: [] },
    { date: '2026-08-21', label: '21', weekday: 'FRI', slots: [] },
  ],
  activity: [
    {
      id: 'nt_1',
      userId: 'user_david',
      kind: 'appointment',
      title: 'Appointment confirmed',
      body: 'Your visit is on the calendar.',
      createdAt: '2026-08-18T10:42:00.000Z',
      read: false,
    },
  ],
}

const next: AppointmentView = {
  id: 'apt_1',
  patientId: 'user_david',
  doctorId: 'user_amara',
  startsAt: '2026-08-19T10:30:00.000Z',
  endsAt: '2026-08-19T11:00:00.000Z',
  type: 'video',
  reason: 'Follow-up',
  status: 'confirmed',
  createdAt: '2026-08-17T10:00:00.000Z',
  patient: { id: 'user_david', firstName: 'David', lastName: 'Daniel' },
  doctor: { id: 'user_amara', firstName: 'Amara', lastName: 'Okafor', specialty: 'Cardiology' },
}

describe('PatientOverview', () => {
  beforeEach(() => {
    vi.mocked(json.get).mockReset()
  })

  it('keeps the rest of the dashboard when appointments fail', async () => {
    vi.mocked(json.get).mockImplementation(async (path: string) => {
      if (path.includes('/overview')) return overview
      if (path.includes('/appointments')) throw new Error('network')
      throw new Error(path)
    })

    renderApp(<PatientOverview />)

    expect(await screen.findByText(/David/)).toBeInTheDocument()
    expect(await screen.findByText("We couldn't load your appointments.")).toBeInTheDocument()
    expect(screen.getByText('Your other care information is still available.')).toBeInTheDocument()
    expect(screen.getByText('Prescription refill')).toBeInTheDocument()
    expect(screen.getByText('Appointment confirmed')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })

  it('shows the next visit when appointments load', async () => {
    vi.mocked(json.get).mockImplementation(async (path: string) => {
      if (path.includes('/overview')) return overview
      if (path.includes('/appointments')) return { items: [next] }
      throw new Error(path)
    })

    renderApp(<PatientOverview />)

    expect(await screen.findByText('Dr. Amara Okafor')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View appointment' })).toBeInTheDocument()
  })

  it('retries a failed appointments request', async () => {
    vi.mocked(json.get).mockImplementation(async (path: string) => {
      if (path.includes('/overview')) return overview
      if (path.includes('/appointments')) throw new Error('network')
      throw new Error(path)
    })

    renderApp(<PatientOverview />)
    await screen.findByText("We couldn't load your appointments.")
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(vi.mocked(json.get).mock.calls.some(([path]) => String(path).includes('/appointments'))).toBe(true)
  })
})
