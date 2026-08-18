import puppeteer from 'puppeteer-core'

const base = 'http://localhost:5173'
const chrome = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
const findings = []
const log = (sev, title, extra = '') => {
  findings.push({ sev, title, extra })
  console.log(`[${sev}] ${title}${extra ? ' — ' + extra : ''}`)
}

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: 'new',
  defaultViewport: { width: 1440, height: 900 },
})
const page = await browser.newPage()
page.setDefaultTimeout(20000)

async function login(email) {
  await page.goto(`${base}/sign-in`, { waitUntil: 'networkidle0' })
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'networkidle0' })
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill('luma-demo')
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {}),
    page.click('button[type="submit"]'),
  ])
  await new Promise((r) => setTimeout(r, 400))
}

try {
  await login('david@luma.health')
  if (!page.url().includes('/patient')) log('critical', 'Patient login failed', page.url())
  else log('ok', 'Patient login lands on /patient')

  // Sign out exists on desktop
  const hasSignOut = await page.$$eval('button', (bs) => bs.some((b) => /sign out/i.test(b.textContent ?? '')))
  if (!hasSignOut) log('high', 'Desktop Sign out missing')
  else log('ok', 'Desktop Sign out present')

  // Mobile sign out
  await page.setViewport({ width: 390, height: 844 })
  await page.goto(`${base}/patient`, { waitUntil: 'networkidle0' })
  const mobileSignOut = await page.$$eval('button', (bs) =>
    bs.some((b) => /sign out/i.test(b.textContent ?? '') && b.offsetParent !== null),
  )
  if (!mobileSignOut) log('high', 'No Sign out control is visible at 390px')
  else log('ok', 'Sign out visible at 390px')

  const mobileRx = await page.$$eval('nav[aria-label="Mobile"] a', (as) =>
    as.some((a) => /prescription/i.test(a.textContent ?? '')),
  )
  if (!mobileRx) log('medium', 'Prescriptions not in patient bottom nav at 390px')

  const mobileSignInLanding = await page.goto(`${base}/`, { waitUntil: 'networkidle0' })
  const signInVisible = await page.$$eval('header a', (as) =>
    as.some((a) => /sign in/i.test(a.textContent ?? '') && a.offsetParent !== null),
  )
  if (!signInVisible) log('high', 'Sign in is not visible in the public header at 390px')

  await page.setViewport({ width: 1440, height: 900 })
  await login('david@luma.health')

  // Cancel flow
  await page.goto(`${base}/patient/appointments`, { waitUntil: 'networkidle0' })
  const first = await page.$('a[href*="/patient/appointments/"]')
  if (!first) log('high', 'No appointment links on Upcoming')
  else {
    const href = await first.evaluate((a) => a.getAttribute('href'))
    await page.goto(`${base}${href}`, { waitUntil: 'networkidle0' })
    const cancelBtn = await page.evaluateHandle(() =>
      [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Cancel'),
    )
    if (!(await cancelBtn.asElement())) log('high', 'Cancel button missing on appointment detail')
    else {
      await cancelBtn.asElement().click()
      await new Promise((r) => setTimeout(r, 200))
      const dialog = await page.$('[role="dialog"]')
      if (!dialog) log('high', 'Cancel does not open a confirmation dialog')
      else {
        const keep = await page.evaluate(() =>
          [...document.querySelectorAll('button')].some((b) => /keep appointment/i.test(b.textContent ?? '')),
        )
        if (!keep) log('medium', 'Cancel dialog missing Keep appointment')
        await page.evaluate(() => {
          const b = [...document.querySelectorAll('button')].find((el) => /cancel appointment/i.test(el.textContent ?? ''))
          b?.click()
        })
        await new Promise((r) => setTimeout(r, 800))
        if (!page.url().includes('/patient/appointments')) log('medium', 'After cancel, not returned to list', page.url())
        else log('ok', 'Cancel + confirm returns to appointments')
      }
    }
  }

  // Book flow
  await page.goto(`${base}/patient/find-care/user_amara`, { waitUntil: 'networkidle0' })
  const slot = await page.evaluateHandle(() =>
    [...document.querySelectorAll('button')].find((b) => /^\d{2}:\d{2}$/.test(b.textContent?.trim() ?? '') && !b.disabled),
  )
  if (!(await slot.asElement())) log('high', 'No enabled time slots on Amara profile')
  else {
    await slot.asElement().click()
    await page.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find((el) => /continue to booking/i.test(el.textContent ?? ''))
      b?.click()
    })
    await new Promise((r) => setTimeout(r, 500))
    if (!page.url().includes('/book')) log('high', 'Continue to booking did not navigate', page.url())
    else {
      const ta = await page.$('textarea')
      if (ta) {
        await ta.type('QA booking pass')
        await page.evaluate(() => {
          const b = [...document.querySelectorAll('button')].find((el) => /review/i.test(el.textContent ?? ''))
          b?.click()
        })
        await new Promise((r) => setTimeout(r, 300))
        await page.evaluate(() => {
          const b = [...document.querySelectorAll('button')].find((el) => /confirm appointment/i.test(el.textContent ?? ''))
          b?.click()
        })
        await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {})
        await new Promise((r) => setTimeout(r, 400))
        const h = await page.$eval('h1', (el) => el.textContent ?? '').catch(() => '')
        if (/on the calendar/i.test(h)) log('ok', 'Booking confirmation shown', h)
        else log('high', 'Booking did not show confirmation', `${page.url()} h1=${h}`)
      } else log('high', 'Booking step 2 textarea missing', page.url())
    }
  }

  // Reschedule lands on booking
  await page.goto(`${base}/patient/appointments`, { waitUntil: 'networkidle0' })
  const link = await page.$('a[href*="/patient/appointments/"]')
  if (link) {
    await page.goto(base + (await link.evaluate((a) => a.getAttribute('href'))), { waitUntil: 'networkidle0' })
    await page.evaluate(() => {
      const a = [...document.querySelectorAll('a')].find((el) => /reschedule/i.test(el.textContent ?? ''))
      a?.click()
    })
    await new Promise((r) => setTimeout(r, 600))
    if (!page.url().includes('/book')) log('medium', 'Reschedule did not open booking flow', page.url())
    else log('ok', 'Reschedule opens booking flow', page.url())
  }

  // Doctor cancel has no dialog
  await login('amara@luma.health')
  await page.goto(`${base}/doctor/schedule`, { waitUntil: 'networkidle0' })
  const dlink = await page.$('a[href*="/doctor/appointments/"]')
  if (dlink) {
    await page.goto(base + (await dlink.evaluate((a) => a.getAttribute('href'))), { waitUntil: 'networkidle0' })
    const hasCancel = await page.evaluate(() =>
      [...document.querySelectorAll('button')].some((b) => b.textContent?.trim() === 'Cancel'),
    )
    if (hasCancel) {
      const dialogsBefore = await page.$$('[role="dialog"]')
      await page.evaluate(() => {
        const b = [...document.querySelectorAll('button')].find((el) => el.textContent?.trim() === 'Cancel')
        b?.click()
      })
      await new Promise((r) => setTimeout(r, 250))
      const dialogsAfter = await page.$$('[role="dialog"]')
      if (dialogsAfter.length <= dialogsBefore.length) {
        log('high', 'Clinician Cancel has no confirmation dialog and fires immediately')
      } else log('ok', 'Clinician cancel is confirmed')
    } else log('ok', 'Opened a completed/non-cancellable visit (no Cancel)')
  }

  // RBAC
  await login('david@luma.health')
  await page.goto(`${base}/doctor`, { waitUntil: 'networkidle0' })
  if (!page.url().includes('unauthorized')) log('critical', 'Patient reached /doctor', page.url())
  else log('ok', 'Patient blocked from /doctor')
  await page.goto(`${base}/admin`, { waitUntil: 'networkidle0' })
  if (!page.url().includes('unauthorized')) log('critical', 'Patient reached /admin', page.url())
  else log('ok', 'Patient blocked from /admin')

  await login('amara@luma.health')
  await page.goto(`${base}/patient`, { waitUntil: 'networkidle0' })
  if (!page.url().includes('unauthorized')) log('critical', 'Clinician reached /patient', page.url())
  else log('ok', 'Clinician blocked from /patient')

  await login('admin@luma.health')
  await page.goto(`${base}/doctor`, { waitUntil: 'networkidle0' })
  if (!page.url().includes('unauthorized')) log('critical', 'Admin reached /doctor', page.url())
  else log('ok', 'Admin blocked from /doctor')

  // GuestOnly
  await page.goto(`${base}/sign-in`, { waitUntil: 'networkidle0' })
  if (page.url().includes('sign-in')) log('medium', 'Signed-in admin still sees /sign-in')
  else log('ok', 'GuestOnly redirected signed-in admin', page.url())

  // Portal wordmark
  await page.goto(`${base}/admin`, { waitUntil: 'networkidle0' })
  const logoHref = await page.$eval('header a', (a) => a.getAttribute('href'))
  if (logoHref === '/') log('medium', 'Portal wordmark navigates to the public marketing site, not the portal home')
} catch (e) {
  log('high', 'Flow runner crashed', e.message)
} finally {
  console.log(JSON.stringify(findings, null, 2))
  await browser.close()
}
