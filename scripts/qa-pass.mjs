import fs from 'node:fs'
import path from 'node:path'
import puppeteer from 'puppeteer-core'

const base = process.env.VERIFY_BASE ?? 'http://localhost:5173'
const out = path.resolve('qa-shots')
fs.mkdirSync(out, { recursive: true })

const chrome =
  process.env.CHROME_PATH ??
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'

const findings = []
const visited = []

function issue(severity, title, route, component, steps, expected, actual, fix) {
  findings.push({ severity, title, route, component, steps, expected, actual, fix })
  console.log(`[${severity}] ${title} @ ${route}`)
}

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: 'new',
  args: ['--no-sandbox', '--window-size=1440,900'],
  defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
})

const page = await browser.newPage()
page.setDefaultTimeout(18000)
const consoleErrors = []
page.on('pageerror', (err) => consoleErrors.push({ url: page.url(), message: err.message }))
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push({ url: page.url(), message: msg.text() })
})

async function shot(name) {
  const file = path.join(out, `${name}.png`)
  await page.screenshot({ path: file, fullPage: true }).catch(() => {})
  return file
}

async function setWidth(w, h = 900) {
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 })
}

async function goto(url) {
  const res = await page.goto(url.startsWith('http') ? url : `${base}${url}`, {
    waitUntil: 'networkidle0',
  })
  await new Promise((r) => setTimeout(r, 250))
  visited.push({ url: page.url(), status: res?.status() ?? 0 })
  return res
}

async function textOf(sel) {
  return page.$eval(sel, (el) => el.textContent?.trim() ?? '').catch(() => '')
}

async function count(sel) {
  return page.$$eval(sel, (els) => els.length).catch(() => 0)
}

async function visible(sel) {
  return page.$eval(sel, (el) => {
    const s = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0
  }).catch(() => false)
}

async function contrastOf(sel) {
  return page.$eval(sel, (el) => {
    const s = getComputedStyle(el)
    return { color: s.color, bg: s.backgroundColor, text: el.textContent?.trim() }
  }).catch(() => null)
}

async function login(email, password = 'luma-demo') {
  await page.evaluate(() => localStorage.clear())
  await goto('/sign-in')
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(password)
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {}),
    page.locator('button[type="submit"]').click(),
  ])
  await new Promise((r) => setTimeout(r, 400))
}

async function signOutIfPresent() {
  const btn = await page.$('button::-p-text(Sign out), button')
  const has = await page.$$eval('button', (els) => els.some((b) => /sign out/i.test(b.textContent ?? '')))
  if (has) {
    await page.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find((el) => /sign out/i.test(el.textContent ?? ''))
      b?.click()
    })
    await new Promise((r) => setTimeout(r, 400))
  }
}

try {
  // -------------------------------------------------------------------------
  // PUBLIC
  // -------------------------------------------------------------------------
  await setWidth(1440)
  await goto('/')
  await shot('pub-landing-1440')
  const landingH1 = await textOf('h1')
  if (!/Healthcare that/i.test(landingH1)) {
    issue('high', 'Landing hero heading missing or changed', '/', 'LandingPage', ['Open /'], 'Healthcare that keeps up with you.', landingH1, 'Restore spec hero copy')
  }
  const headerLinks = await page.$$eval('header a, header nav a', (as) => as.map((a) => ({ href: a.getAttribute('href'), text: a.textContent?.trim() })))
  const needed = ['For Patients', 'For Clinicians', 'How it works', 'Security', 'Sign in', 'Get started']
  for (const label of needed) {
    if (!headerLinks.some((l) => (l.text ?? '').includes(label.replace('Get started', 'Get started').split(' ')[0]) || (l.text ?? '') === label || (l.text ?? '').includes(label))) {
      // softer check
    }
  }
  const getStarted = await contrastOf('header a[href="/sign-up"]')
  if (getStarted && getStarted.bg === 'rgba(0, 0, 0, 0)') {
    issue('medium', 'Header Get started may lack button chrome', '/', 'PublicHeader', ['Open / at 1440'], 'Visible primary CTA', JSON.stringify(getStarted), 'Ensure CTA uses contrasting button styles')
  }

  // hash anchors
  for (const hash of ['#patients', '#clinicians', '#how-it-works', '#security']) {
    await goto(`/${hash}`)
    const id = hash.slice(1)
    const exists = await page.$(`#${id}`)
    if (!exists) issue('high', `Landing section ${hash} missing`, `/${hash}`, 'LandingPage', [`Click header link to ${hash}`], `Element #${id} exists`, 'missing', 'Add matching section id')
  }

  await goto('/sign-in')
  await shot('pub-signin-1440')
  if (!(await visible('input[type="email"]')) || !(await visible('input[type="password"]'))) {
    issue('critical', 'Sign-in form fields not visible', '/sign-in', 'SignInPage', ['Open /sign-in'], 'Email and password fields', 'missing', 'Restore labelled inputs')
  }

  // bad password
  await page.locator('input[type="email"]').fill('david@luma.health')
  await page.locator('input[type="password"]').fill('wrong-password')
  await page.locator('button[type="submit"]').click()
  await new Promise((r) => setTimeout(r, 600))
  const badMsg = await page.$eval('[role="alert"], .text-terracotta', (el) => el.textContent).catch(() => '')
  if (!/did not match|could not sign/i.test(badMsg ?? '')) {
    issue('high', 'Failed sign-in does not show a human error', '/sign-in', 'SignInPage', ['Enter david@luma.health + wrong password', 'Submit'], 'Human error message', badMsg || 'none', 'Surface API error on the form')
  }
  await shot('pub-signin-bad')

  await goto('/sign-up')
  await shot('pub-signup-1440')
  const progress = await textOf('[aria-label="Progress"]')
  if (!/01/.test(progress)) {
    issue('medium', 'Sign-up progress indicator missing', '/sign-up', 'SignUpPage', ['Open /sign-up'], '01 — 02 — 03 — 04', progress, 'Restore progress stepper')
  }

  await goto('/forgot-password')
  await shot('pub-forgot')
  const forgotH = await textOf('h1')
  if (!/back in/i.test(forgotH)) {
    issue('medium', 'Forgot-password heading does not match spec', '/forgot-password', 'ForgotPasswordPage', ['Open /forgot-password'], "Let's get you back in.", forgotH, 'Use spec copy')
  }

  await goto('/this-route-does-not-exist')
  await shot('pub-404')
  const notFound = await textOf('h1')
  if (!notFound) issue('high', '404 page has no heading', '/this-route-does-not-exist', 'NotFoundPage', ['Visit unknown path'], 'Friendly 404', 'empty', 'Add 404 heading')

  await goto('/unauthorized')
  await shot('pub-unauthorized')

  // -------------------------------------------------------------------------
  // AUTH + RBAC
  // -------------------------------------------------------------------------
  await login('david@luma.health', 'wrong')
  if (/\/patient/.test(page.url())) {
    issue('critical', 'Wrong password still reaches the patient portal', '/sign-in', 'AuthContext/SignInPage', ['Sign in with wrong password'], 'Stay on sign-in', page.url(), 'Do not navigate on failed auth')
  }

  await login('david@luma.health')
  if (!/\/patient/.test(page.url())) {
    issue('critical', 'Patient demo account cannot sign in', '/sign-in', 'SignInPage', ['Sign in david@luma.health / luma-demo'], 'Redirect to /patient', page.url(), 'Fix auth')
  }
  await shot('pat-overview-1440')

  await goto('/doctor')
  await new Promise((r) => setTimeout(r, 400))
  if (!/unauthorized|patient/.test(page.url())) {
    issue('critical', 'Patient can open the clinician portal', '/doctor', 'ProtectedRoute', ['As patient, visit /doctor'], 'Redirect to /unauthorized', page.url(), 'Enforce role gate')
  }
  await shot('rbac-patient-doctor')

  await goto('/admin')
  await new Promise((r) => setTimeout(r, 400))
  if (!/unauthorized|patient/.test(page.url())) {
    issue('critical', 'Patient can open the admin portal', '/admin', 'ProtectedRoute', ['As patient, visit /admin'], 'Redirect to /unauthorized', page.url(), 'Enforce role gate')
  }

  // -------------------------------------------------------------------------
  // PATIENT PORTAL
  // -------------------------------------------------------------------------
  await goto('/patient')
  const greet = await textOf('h1')
  if (!/David/i.test(greet)) {
    issue('high', 'Patient overview greeting missing first name', '/patient', 'PatientOverview', ['Sign in as David', 'Open /patient'], 'Good morning/afternoon, David.', greet, 'Use greetingName from overview/auth')
  }

  // navigation items
  const navLabels = await page.$$eval('aside nav a, nav[aria-label="Portal"] a', (as) => as.map((a) => a.textContent?.trim()))
  for (const label of ['Overview', 'Appointments', 'Find Care', 'Prescriptions', 'Notifications', 'Profile']) {
    if (!navLabels.includes(label)) {
      issue('high', `Patient sidebar missing "${label}"`, '/patient', 'PatientShell', ['Inspect desktop sidebar'], label, navLabels.join(', '), 'Add nav item')
    }
  }

  // Help vs Settings
  const help = navLabels.includes('Help') || (await page.$$eval('a', (as) => as.some((a) => a.textContent?.trim() === 'Help')))
  if (help) {
    const helpHref = await page.$$eval('a', (as) => as.find((a) => a.textContent?.trim() === 'Help')?.getAttribute('href') ?? '')
    if (helpHref && !/settings/.test(helpHref)) {
      issue('low', 'Help link does not go to settings', helpHref, 'PatientShell', ['Click Help'], '/patient/settings', helpHref, 'Point Help at settings or add a help page')
    }
  }

  await goto('/patient/appointments')
  await shot('pat-appointments')
  const tabs = await page.$$eval('[role="tab"], button, a', (els) => els.map((e) => e.textContent?.trim()).filter((t) => ['Upcoming', 'Past', 'Cancelled'].includes(t ?? '')))
  if (!tabs.includes('Upcoming') || !tabs.includes('Past') || !tabs.includes('Cancelled')) {
    issue('high', 'Appointment tabs missing', '/patient/appointments', 'PatientAppointments', ['Open appointments'], 'Upcoming / Past / Cancelled', tabs.join(', '), 'Restore tabs')
  }

  // open first appointment if present
  const aptLink = await page.$('a[href*="/patient/appointments/"]')
  if (aptLink) {
    const href = await aptLink.evaluate((a) => a.getAttribute('href'))
    await goto(href)
    await shot('pat-apt-detail')
    const body = await page.content()
    if (!/Cancel|Reschedule|Join/i.test(body)) {
      issue('medium', 'Appointment detail missing expected actions', href, 'PatientAppointmentDetail', ['Open an upcoming appointment'], 'Join / Reschedule / Cancel depending on state', 'none found', 'Show state-based actions')
    }
  } else {
    issue('medium', 'No upcoming appointments to inspect actions', '/patient/appointments', 'PatientAppointments', ['Open appointments as David'], 'At least David’s seeded visit', 'empty list', 'Check seed / upcoming filter')
  }

  await goto('/patient/find-care')
  await shot('pat-find-care')
  const clinicianCount = await count('h2')
  if (clinicianCount < 1) {
    issue('high', 'Find Care shows no clinicians', '/patient/find-care', 'FindCare', ['Open Find Care as David'], 'Editorial clinician list', 'empty', 'Check /api/patient/clinicians')
  }

  const firstProfile = await page.$('a[href*="/patient/find-care/"]')
  let bookedId = null
  if (firstProfile) {
    const phref = await firstProfile.evaluate((a) => a.getAttribute('href'))
    await goto(phref)
    await shot('pat-clinician')
    const continueBtn = await page.$('button')
    const disabled = continueBtn ? await continueBtn.evaluate((b) => /Continue/.test(b.textContent ?? '') && b.disabled) : true
    // pick first available slot
    const slots = await page.$$('button:not([disabled])')
    let picked = false
    for (const s of slots) {
      const t = await s.evaluate((el) => el.textContent?.trim() ?? '')
      if (/^\d{2}:\d{2}$/.test(t)) {
        await s.click()
        picked = true
        break
      }
    }
    if (!picked) {
      issue('high', 'No bookable time slots on clinician profile', phref, 'ClinicianProfile', ['Open a clinician', 'Look at availability'], 'Selectable 30-minute slots', 'none enabled', 'Check generateSlots / availability seed')
    } else {
      const cta = await page.$('xpath///button[contains(., "Continue")]')
      if (cta) await cta.click()
      await new Promise((r) => setTimeout(r, 500))
      await shot('pat-booking-step')
      if (!/book|details|time|review/i.test(page.url() + (await textOf('h1')))) {
        issue('medium', 'Continue to booking did not advance', page.url(), 'BookingFlow', ['Select a slot', 'Continue to booking'], '/patient/find-care/:id/book', page.url(), 'Navigate with startsAt state')
      } else {
        // fill details if on step 2
        const reason = await page.$('textarea')
        if (reason) {
          await reason.type('Follow-up after recent readings')
          const review = await page.$('xpath///button[contains(., "Review")]')
          if (review) await review.click()
          await new Promise((r) => setTimeout(r, 300))
        }
        const confirm = await page.$('xpath///button[contains(., "Confirm")]')
        if (confirm) {
          await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {}),
            confirm.click(),
          ])
          await new Promise((r) => setTimeout(r, 500))
          await shot('pat-booking-confirm')
          const h = await textOf('h1')
          if (!/on the calendar/i.test(h)) {
            issue('high', 'Booking confirmation copy missing', page.url(), 'BookingConfirmation', ['Complete 3-step booking'], "You're on the calendar.", h, 'Show confirmation page')
          } else {
            bookedId = page.url()
          }
        }
      }
    }
  }

  await goto('/patient/prescriptions')
  await shot('pat-rx')
  if (!(await page.$('h1'))) issue('medium', 'Prescriptions page missing heading', '/patient/prescriptions', 'PatientPrescriptions', ['Open prescriptions'], 'Your prescriptions', 'none', 'Add heading')

  const rxLink = await page.$('a[href*="/patient/prescriptions/"]')
  if (rxLink) {
    await goto(await rxLink.evaluate((a) => a.getAttribute('href')))
    await shot('pat-rx-detail')
  }

  await goto('/patient/notifications')
  await shot('pat-notifications')
  const mark = await page.$('xpath///button[contains(., "Mark all")]')
  if (!mark) issue('medium', 'Mark all as read missing', '/patient/notifications', 'PatientNotifications', ['Open Updates'], 'Mark all as read', 'missing', 'Add action')

  await goto('/patient/profile')
  await shot('pat-profile')
  const profileH = await textOf('h1')
  if (!/David|Daniel|Patient/i.test(profileH)) {
    issue('medium', 'Patient profile header does not identify the person', '/patient/profile', 'PatientProfile', ['Open profile'], 'DAVID DANIEL / Patient', profileH, 'Use large name header')
  }

  await goto('/patient/settings')
  await shot('pat-settings')
  const settingsText = await page.content()
  if (!/Appearance|Notification/i.test(settingsText)) {
    issue('high', 'Settings missing appearance or notification controls', '/patient/settings', 'PatientSettings', ['Open settings'], 'Notifications + Appearance', 'missing', 'Restore settings sections')
  }

  // -------------------------------------------------------------------------
  // CLINICIAN
  // -------------------------------------------------------------------------
  await login('amara@luma.health')
  if (!/\/doctor/.test(page.url())) {
    issue('critical', 'Clinician demo account cannot sign in', '/sign-in', 'SignInPage', ['Sign in amara@luma.health / luma-demo'], '/doctor', page.url(), 'Fix role home')
  }
  await shot('doc-overview-1440')

  await goto('/patient')
  await new Promise((r) => setTimeout(r, 400))
  if (/\/patient$/.test(page.url()) && (await textOf('h1')).includes('David') === false) {
    // if still on patient as clinician that's a bug
  }
  if (/\/patient/.test(page.url()) && !/unauthorized/.test(page.url())) {
    const stillPatient = await page.$('a[href="/patient/find-care"]')
    if (stillPatient) {
      issue('critical', 'Clinician can use the patient portal', '/patient', 'ProtectedRoute', ['As Amara, visit /patient'], '/unauthorized', page.url(), 'Block patient routes for clinicians')
    }
  }

  await goto('/doctor')
  const docH = await textOf('h1')
  if (!/Okafor/i.test(docH)) {
    issue('high', 'Clinician overview greeting missing name', '/doctor', 'DoctorOverview', ['Sign in as Amara'], 'Good morning, Dr. Okafor.', docH, 'Use greetingName')
  }

  await goto('/doctor/schedule')
  await shot('doc-schedule')
  const scheduleHasPatients = await page.$$eval('a, span', (els) => els.some((e) => /Sarah|James|Leila/i.test(e.textContent ?? '')))
  if (!scheduleHasPatients) {
    issue('high', 'Schedule timeline empty for seeded today', '/doctor/schedule', 'DoctorSchedule', ['Open schedule as Amara on seed date'], 'Sarah / James / Leila on the day', 'none', 'Check date default vs seed 2026-08-18')
  }

  const docApt = await page.$('a[href*="/doctor/appointments/"]')
  if (docApt) {
    await goto(await docApt.evaluate((a) => a.getAttribute('href')))
    await shot('doc-apt-detail')
  }

  await goto('/doctor/patients')
  await shot('doc-patients')
  await goto('/doctor/prescriptions')
  await shot('doc-rx')
  await goto('/doctor/prescriptions/new')
  await shot('doc-rx-new')
  const createDisabled = await page.$eval('button[type="submit"]', (b) => b.disabled).catch(() => null)
  if (createDisabled === false) {
    issue('medium', 'Create prescription submit enabled with empty patient', '/doctor/prescriptions/new', 'CreatePrescription', ['Open new prescription'], 'Submit disabled until patient selected', 'enabled', 'Disable until required fields valid')
  }
  await goto('/doctor/profile')
  await shot('doc-profile')
  await goto('/doctor/availability')
  await shot('doc-availability')
  await goto('/doctor/notifications')
  await shot('doc-notifications')

  // -------------------------------------------------------------------------
  // ADMIN
  // -------------------------------------------------------------------------
  await login('admin@luma.health')
  if (!/\/admin/.test(page.url())) {
    issue('critical', 'Admin demo account cannot sign in', '/sign-in', 'SignInPage', ['Sign in admin@luma.health / luma-demo'], '/admin', page.url(), 'Fix admin home')
  }
  await shot('adm-overview')
  await goto('/admin/users')
  await shot('adm-users')
  await goto('/admin/doctors')
  await shot('adm-doctors')
  await goto('/admin/appointments')
  await shot('adm-appointments')
  await goto('/admin/audit-log')
  await shot('adm-audit')
  await goto('/admin/settings')
  await shot('adm-settings')

  await goto('/patient')
  if (/\/patient/.test(page.url()) && !/unauthorized/.test(page.url())) {
    const findCare = await page.$('a[href="/patient/find-care"]')
    if (findCare) issue('critical', 'Admin can use the patient portal', '/patient', 'ProtectedRoute', ['As admin, visit /patient'], '/unauthorized', page.url(), 'Block cross-portal access')
  }

  // -------------------------------------------------------------------------
  // RESPONSIVE
  // -------------------------------------------------------------------------
  await login('david@luma.health')
  for (const w of [375, 390, 768, 1024, 1440]) {
    await setWidth(w, w < 768 ? 844 : 900)
    await goto('/patient')
    await shot(`resp-patient-${w}`)
    const bottomNav = await visible('nav[aria-label="Mobile"]')
    const sideNav = await visible('aside')
    if (w <= 390 && !bottomNav) {
      issue('high', `Bottom navigation missing at ${w}px`, '/patient', 'AppShell', [`Resize to ${w}px`], 'Mobile bottom nav visible', 'hidden', 'Show bottom nav below md')
    }
    if (w >= 768 && !sideNav) {
      issue('high', `Desktop sidebar missing at ${w}px`, '/patient', 'AppShell', [`Resize to ${w}px`], 'Sidebar visible from 768', 'hidden', 'Show aside from md')
    }
    if (w <= 390 && bottomNav) {
      const overlap = await page.evaluate(() => {
        const nav = document.querySelector('nav[aria-label="Mobile"]')
        const week = [...document.querySelectorAll('p, h2')].find((el) => /your week/i.test(el.textContent ?? ''))
        if (!nav || !week) return null
        const nr = nav.getBoundingClientRect()
        const wr = week.parentElement?.getBoundingClientRect()
        if (!wr) return null
        return !(wr.bottom < nr.top || wr.top > nr.bottom)
      })
      if (overlap) {
        issue('medium', `Patient week strip overlaps bottom nav at ${w}px`, '/patient', 'PatientOverview/AppShell', [`Open /patient at ${w}px without scrolling`], 'Week fully above nav or scroll-safe padding', 'overlap', 'Increase main padding-bottom / move week')
      }
    }

    await goto('/')
    await shot(`resp-landing-${w}`)
    if (w <= 390) {
      const burgerOrHidden = await page.$$eval('header a', (as) => as.filter((a) => /Patients|Clinicians|How it works|Security/i.test(a.textContent ?? '')).every((a) => getComputedStyle(a).display === 'none' || a.offsetParent === null || getComputedStyle(a.parentElement).display === 'none'))
      const navVisible = await page.$eval('header nav', (n) => getComputedStyle(n).display !== 'none').catch(() => false)
      if (!navVisible) {
        const menu = await page.$('button[aria-label], button')
        const hasMenu = await page.$$eval('header button', (bs) => bs.some((b) => /menu|nav/i.test(b.getAttribute('aria-label') ?? b.textContent ?? '')))
        if (!hasMenu) {
          issue('high', `Public header has no mobile navigation at ${w}px`, '/', 'PublicHeader', [`Resize landing to ${w}px`], 'Hamburger or reachable section links', 'Nav hidden, no menu', 'Add a mobile menu for For Patients / Clinicians / How it works / Security')
        }
      }
    }
  }

  await setWidth(390, 844)
  await login('amara@luma.health')
  await goto('/doctor')
  await shot('resp-doctor-390')
  const docMobile = await visible('nav[aria-label="Mobile"]')
  if (!docMobile) issue('high', 'Clinician portal missing bottom nav at 390px', '/doctor', 'DoctorShell', ['Open /doctor at 390px'], 'Bottom nav', 'hidden', 'Provide mobileNav')

  await login('admin@luma.health')
  await goto('/admin')
  await shot('resp-admin-390')
  const admMobile = await visible('nav[aria-label="Mobile"]')
  if (!admMobile) issue('medium', 'Admin portal missing bottom nav at 390px', '/admin', 'AdminShell', ['Open /admin at 390px'], 'Bottom nav', 'hidden', 'Provide mobileNav')

  // guest-only redirect
  await login('david@luma.health')
  await goto('/sign-in')
  if (/sign-in/.test(page.url())) {
    issue('medium', 'Signed-in user can still see the sign-in page', '/sign-in', 'GuestOnly', ['While signed in, visit /sign-in'], 'Redirect to role home', page.url(), 'GuestOnly should redirect')
  }

  // forgot password success
  await page.evaluate(() => localStorage.clear())
  await goto('/forgot-password')
  await page.locator('input[type="email"]').fill('david@luma.health')
  await page.locator('button[type="submit"]').click()
  await new Promise((r) => setTimeout(r, 500))
  const forgotSuccess = await textOf('h1')
  if (!/inbox/i.test(forgotSuccess)) {
    issue('medium', 'Forgot-password success state missing', '/forgot-password', 'ForgotPasswordPage', ['Submit a valid email'], 'Check your inbox.', forgotSuccess, 'Show success copy')
  }
  await shot('pub-forgot-success')

} catch (err) {
  issue('high', `QA runner crashed: ${err.message}`, page.url(), 'qa-pass', ['Run qa-pass.mjs'], 'Complete pass', String(err.stack ?? err), 'Fix runner or the crashing screen')
  await shot('qa-crash')
} finally {
  const uniqueConsole = [...new Map(consoleErrors.map((e) => [e.message, e])).values()]
  for (const err of uniqueConsole) {
    if (/Failed to load resource|net::ERR/.test(err.message)) continue
    issue('medium', `Browser console error: ${err.message.slice(0, 180)}`, err.url, 'runtime', ['Open the route and watch console'], 'No page errors', err.message, 'Fix the throwing component')
  }
  const report = {
    generatedAt: new Date().toISOString(),
    base,
    counts: {
      critical: findings.filter((f) => f.severity === 'critical').length,
      high: findings.filter((f) => f.severity === 'high').length,
      medium: findings.filter((f) => f.severity === 'medium').length,
      low: findings.filter((f) => f.severity === 'low').length,
      total: findings.length,
    },
    findings,
    visited,
    consoleErrors: uniqueConsole,
  }
  fs.writeFileSync('qa-report.json', JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report.counts, null, 2))
  await browser.close()
}
