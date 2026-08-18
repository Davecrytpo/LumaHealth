import { z } from 'zod'

export const roleSchema = z.enum(['patient', 'clinician', 'admin'])
export const appearanceSchema = z.enum(['system', 'light', 'dark'])
export const consultationTypeSchema = z.enum(['video', 'in-person'])
export const appointmentStatusSchema = z.enum([
  'confirmed',
  'pending',
  'completed',
  'cancelled',
])

export const signInSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
})

export const signUpSchema = z.object({
  role: z.enum(['patient', 'clinician']),
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
  dateOfBirth: z.string().optional(),
  sex: z.string().optional(),
  email: z.string().email('Enter a valid email address.'),
  phone: z.string().min(6, 'Enter a phone number.'),
  password: z.string().min(8, 'Use at least 8 characters.'),
  preferredLanguage: z.string().optional(),
  specialty: z.string().optional(),
  appearance: appearanceSchema.default('system'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
})

export const bookAppointmentSchema = z.object({
  doctorId: z.string().min(1),
  startsAt: z.string().min(1),
  type: consultationTypeSchema,
  reason: z.string().min(3, 'Share a short reason for the visit.'),
})

export const updateAppointmentSchema = z.object({
  status: appointmentStatusSchema.optional(),
  startsAt: z.string().optional(),
  type: consultationTypeSchema.optional(),
  reason: z.string().optional(),
})

export const createPrescriptionSchema = z.object({
  patientId: z.string().min(1, 'Select a patient.'),
  medication: z.string().min(1, 'Enter a medication.'),
  dosage: z.string().min(1, 'Enter a dosage.'),
  frequency: z.string().min(1, 'Enter a frequency.'),
  startDate: z.string().min(1, 'Choose a start date.'),
  endDate: z.string().min(1, 'Choose an end date.'),
  refills: z.coerce.number().int().min(0).max(12),
  instructions: z.string().min(1, 'Add brief instructions.'),
})

export const availabilityWindowSchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    start: z.string().regex(/^\d{2}:\d{2}$/),
    end: z.string().regex(/^\d{2}:\d{2}$/),
  })
  .refine((w) => w.start < w.end, { message: 'The end time needs to be after the start.' })

export const availabilityUpdateSchema = z.object({
  windows: z.array(availabilityWindowSchema),
})

export const patientProfileUpdateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().min(6).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  dateOfBirth: z.string().optional(),
  sex: z.string().optional(),
  preferredLanguage: z.string().optional(),
  emergencyContact: z
    .object({
      name: z.string().min(1),
      relationship: z.string().min(1),
      phone: z.string().min(6),
    })
    .optional(),
})

export const settingsUpdateSchema = z.object({
  appearance: appearanceSchema.optional(),
  notifications: z
    .object({
      appointmentReminders: z.boolean(),
      prescriptionUpdates: z.boolean(),
      careTeamMessages: z.boolean(),
    })
    .optional(),
})

export const doctorProfileUpdateSchema = z.object({
  bio: z.string().optional(),
  specialty: z.string().optional(),
  yearsExperience: z.number().int().min(0).optional(),
  languages: z.array(z.string()).optional(),
  consultationTypes: z.array(consultationTypeSchema).optional(),
})

export const adminUserUpdateSchema = z.object({
  status: z.enum(['active', 'invited', 'suspended']).optional(),
})

export const adminDoctorUpdateSchema = z.object({
  verificationStatus: z.enum(['verified', 'pending', 'rejected']).optional(),
  status: z.enum(['active', 'invited', 'suspended']).optional(),
})
