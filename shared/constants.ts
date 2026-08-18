export const APP_NAME = 'LumaHealth'
export const TAGLINE = 'Care, connected.'

export const DEMO_PASSWORD = 'luma-demo'

export const DEMO_ACCOUNTS = {
  patient: { email: 'david@luma.health', name: 'David Daniel' },
  clinician: { email: 'amara@luma.health', name: 'Dr. Amara Okafor' },
  admin: { email: 'admin@luma.health', name: 'Luma Admin' },
} as const

export const SPECIALTIES = [
  'Cardiology',
  'Family medicine',
  'Dermatology',
  'Endocrinology',
  'Psychiatry',
  'Orthopedics',
] as const

export const LANGUAGES = [
  'English',
  'German',
  'Igbo',
  'French',
  'Spanish',
  'Yoruba',
] as const

export const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const
