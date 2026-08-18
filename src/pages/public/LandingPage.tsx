import { Link } from 'react-router-dom'
import { PublicHeader } from '@/components/layout/PublicHeader'
import { PublicFooter } from '@/components/layout/PublicFooter'
import { CareVisualization } from '@/components/care/CareVisualization'
import { Button } from '@/components/ui/Button'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <PublicHeader />
      <main>
        <section className="mx-auto grid max-w-page items-center gap-8 px-4 pb-14 pt-8 md:gap-12 md:px-8 md:pb-20 md:pt-10 lg:grid-cols-[1.1fr_0.9fr] lg:pt-16">
          <div>
            <p className="lh-kicker">Care, connected.</p>
            <h1 className="lh-display-lg mt-4 text-ink">
              Healthcare that
              <br />
              keeps up with you.
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted md:mt-6 md:text-base">
              One place to manage appointments, prescriptions, care updates, and the people helping
              you stay well.
            </p>
            <div className="lh-actions mt-7 md:mt-8">
              <Link to="/sign-up">
                <Button className="w-full md:w-auto">Book an appointment →</Button>
              </Link>
              <a href="#how-it-works">
                <Button variant="secondary" className="w-full md:w-auto">See how it works</Button>
              </a>
            </div>
          </div>
          <CareVisualization />
        </section>

        <section id="patients" className="border-t border-line">
          <div className="mx-auto max-w-page px-4 py-14 md:px-8 md:py-20">
            <p className="lh-kicker">Your care, in one view</p>
            <h2 className="lh-display mt-4 max-w-xl">
              A quieter dashboard for the things that actually matter.
            </h2>
            <div className="mt-12 grid gap-px border border-line bg-line lg:grid-cols-[1.4fr_0.8fr]">
              <div className="bg-surface p-5 md:p-8">
                <p className="lh-kicker">Next appointment</p>
                <p className="mt-4 font-display text-3xl md:mt-6 md:text-4xl">Tomorrow</p>
                <p className="mt-1 font-display text-3xl md:text-4xl">10:30 AM</p>
                <p className="mt-6 text-sm text-ink">Dr. Amara Okafor</p>
                <p className="text-sm text-muted">Cardiology · Video consultation</p>
              </div>
              <div className="flex flex-col justify-between bg-surface p-5 md:p-8">
                <div>
                  <p className="lh-kicker">Care signal</p>
                  <p className="mt-6 text-lg">Prescription refill</p>
                  <p className="mt-2 text-sm text-muted">Metformin has 2 refills remaining.</p>
                </div>
                <p className="text-sm text-muted">View prescription →</p>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="border-t border-line">
          <div className="mx-auto max-w-page px-4 py-14 md:px-8 md:py-20">
            <p className="lh-kicker">Appointment booking</p>
            <h2 className="lh-display mt-4">Three quiet steps.</h2>
            <ol className="mt-12 grid gap-10 md:grid-cols-3">
              {[
                { n: '01', t: 'Find a clinician', d: 'Search by name, specialty, language, or the next open hour.' },
                { n: '02', t: 'Choose a time', d: 'See real availability. Pick video or in person.' },
                { n: '03', t: "You're booked", d: 'Confirmation in plain language, not a ticket number.' },
              ].map((step, i) => (
                <li key={step.n} className="relative">
                  <p className="lh-kicker">{step.n}</p>
                  <h3 className="mt-3 font-display text-2xl md:mt-4 md:text-3xl">{step.t}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{step.d}</p>
                  {i < 2 ? <p className="mt-6 hidden text-muted md:block">↓</p> : null}
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="clinicians" className="border-t border-line">
          <div className="mx-auto grid max-w-page items-start gap-8 px-4 py-14 md:gap-12 md:px-8 md:py-20 lg:grid-cols-2">
            <div>
              <p className="lh-kicker">For clinicians</p>
              <h2 className="lh-display mt-4">A day that reads like a day.</h2>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-muted">
                The clinician portal is operational without becoming a control panel. Today’s list,
                a real timeline, and the people attached to each hour.
              </p>
            </div>
            <div className="space-y-0 border-t border-line">
              {[
                ['09:00', ''],
                ['09:30', ''],
                ['10:00', 'Sarah Miller'],
                ['10:30', 'James Wilson'],
                ['11:00', ''],
                ['11:30', 'Leila Hassan'],
              ].map(([time, name]) => (
                <div key={time} className="grid grid-cols-[4.5rem_1fr] border-b border-line py-3 text-sm">
                  <span className="text-muted">{time}</span>
                  <span className={name ? 'text-ink' : 'text-line'}>{name || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="security" className="border-t border-line">
          <div className="mx-auto max-w-page px-4 py-14 md:px-8 md:py-20">
            <p className="lh-kicker">Security</p>
            <h2 className="lh-display mt-4 max-w-xl">
              Access is narrow. Records stay where they belong.
            </h2>
            <div className="mt-12 grid gap-10 md:grid-cols-3">
              {[
                { t: 'Role-bound views', d: 'Patients, clinicians, and administrators see only the surfaces they need.' },
                { t: 'Session tokens', d: 'Signed-in access is short-lived and discarded on sign-out.' },
                { t: 'An audit trail', d: 'Sensitive actions are written down in language a person can read.' },
              ].map((item) => (
                <div key={item.t}>
                  <div className="mb-4 h-px w-12 bg-ink/40" />
                  <h3 className="text-sm font-medium">{item.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{item.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-line">
          <div className="mx-auto max-w-page px-4 py-16 md:px-8 md:py-24">
            <h2 className="lh-display-lg">Your next step starts here.</h2>
            <div className="mt-8">
              <Link to="/sign-up">
                <Button>Get started →</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  )
}
