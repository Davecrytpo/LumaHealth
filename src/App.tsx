import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { GuestOnly, ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { PatientShell } from '@/components/layout/PatientShell'
import { DoctorShell } from '@/components/layout/DoctorShell'
import { AdminShell } from '@/components/layout/AdminShell'
import { LandingPage } from '@/pages/public/LandingPage'
import { SignInPage } from '@/pages/public/SignInPage'
import { SignUpPage } from '@/pages/public/SignUpPage'
import { ForgotPasswordPage } from '@/pages/public/ForgotPasswordPage'
import { NotFoundPage } from '@/pages/public/NotFoundPage'
import { UnauthorizedPage } from '@/pages/public/UnauthorizedPage'
import { PatientOverview } from '@/pages/patient/PatientOverview'
import { PatientAppointments } from '@/pages/patient/PatientAppointments'
import { PatientAppointmentDetail } from '@/pages/patient/PatientAppointmentDetail'
import { FindCare } from '@/pages/patient/FindCare'
import { ClinicianProfile } from '@/pages/patient/ClinicianProfile'
import { BookingFlow } from '@/pages/patient/BookingFlow'
import { BookingConfirmation } from '@/pages/patient/BookingConfirmation'
import { PatientPrescriptions } from '@/pages/patient/PatientPrescriptions'
import { PrescriptionDetail } from '@/pages/patient/PrescriptionDetail'
import { PatientNotifications } from '@/pages/patient/PatientNotifications'
import { PatientProfile } from '@/pages/patient/PatientProfile'
import { PatientSettings } from '@/pages/patient/PatientSettings'
import { DoctorOverview } from '@/pages/doctor/DoctorOverview'
import { DoctorSchedule } from '@/pages/doctor/DoctorSchedule'
import { DoctorAppointmentDetail } from '@/pages/doctor/DoctorAppointmentDetail'
import { DoctorPatients } from '@/pages/doctor/DoctorPatients'
import { ClinicalProfile } from '@/pages/doctor/ClinicalProfile'
import { DoctorPrescriptions } from '@/pages/doctor/DoctorPrescriptions'
import { CreatePrescription } from '@/pages/doctor/CreatePrescription'
import { DoctorProfile } from '@/pages/doctor/DoctorProfile'
import { AvailabilityEditor } from '@/pages/doctor/AvailabilityEditor'
import { DoctorNotifications } from '@/pages/doctor/DoctorNotifications'
import { AdminOverview } from '@/pages/admin/AdminOverview'
import { AdminUsers } from '@/pages/admin/AdminUsers'
import { AdminDoctors } from '@/pages/admin/AdminDoctors'
import { AdminAppointments } from '@/pages/admin/AdminAppointments'
import { AdminAuditLog } from '@/pages/admin/AdminAuditLog'
import { AdminSettings } from '@/pages/admin/AdminSettings'

export default function App() {
  const { user } = useAuth()
  return (
    <ThemeProvider appearance={user?.appearance ?? 'system'}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/sign-in"
          element={
            <GuestOnly>
              <SignInPage />
            </GuestOnly>
          }
        />
        <Route
          path="/sign-up"
          element={
            <GuestOnly>
              <SignUpPage />
            </GuestOnly>
          }
        />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        <Route
          path="/patient"
          element={
            <ProtectedRoute roles={['patient']}>
              <PatientShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<PatientOverview />} />
          <Route path="appointments" element={<PatientAppointments />} />
          <Route path="appointments/:id" element={<PatientAppointmentDetail />} />
          <Route path="appointments/:id/confirmed" element={<BookingConfirmation />} />
          <Route path="find-care" element={<FindCare />} />
          <Route path="find-care/:doctorId" element={<ClinicianProfile />} />
          <Route path="find-care/:doctorId/book" element={<BookingFlow />} />
          <Route path="prescriptions" element={<PatientPrescriptions />} />
          <Route path="prescriptions/:id" element={<PrescriptionDetail />} />
          <Route path="notifications" element={<PatientNotifications />} />
          <Route path="profile" element={<PatientProfile />} />
          <Route path="settings" element={<PatientSettings />} />
        </Route>

        <Route
          path="/doctor"
          element={
            <ProtectedRoute roles={['clinician']}>
              <DoctorShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<DoctorOverview />} />
          <Route path="schedule" element={<DoctorSchedule />} />
          <Route path="appointments/:id" element={<DoctorAppointmentDetail />} />
          <Route path="patients" element={<DoctorPatients />} />
          <Route path="patients/:id" element={<ClinicalProfile />} />
          <Route path="prescriptions" element={<DoctorPrescriptions />} />
          <Route path="prescriptions/new" element={<CreatePrescription />} />
          <Route path="notifications" element={<DoctorNotifications />} />
          <Route path="profile" element={<DoctorProfile />} />
          <Route path="availability" element={<AvailabilityEditor />} />
        </Route>

        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminOverview />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="doctors" element={<AdminDoctors />} />
          <Route path="appointments" element={<AdminAppointments />} />
          <Route path="audit-log" element={<AdminAuditLog />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        <Route path="/app" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ThemeProvider>
  )
}
