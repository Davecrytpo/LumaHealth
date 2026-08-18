import fs from 'node:fs'
import path from 'node:path'
import puppeteer from 'puppeteer-core'

const base = 'http://localhost:5173'
const out = path.resolve('qa-shots')
fs.mkdirSync(out, { recursive: true })
const issues = []
const note = (sev, title, extra = '') => {
  issues.push({ sev, title, extra })
  console.log(`[${sev}] ${title}${extra ? ' — ' + extra : ''}`)
}

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
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
  await new Promise((r) => setTimeout(r, 350))
}

async function shot(name) {
  await page.screenshot({ path: path.join(out, name), fullPage: true })
}

try {
  for (const w of [375, 390, 768, 1024, 1440]) {
    await page.setViewport({ width: w, height: w < 768 ? 844 : 900 })
    await page.goto(`${base}/`, { waitUntil: 'networkidle0' })
    const landing = await page.evaluate(() => ({
      signIn: [...document.querySelectorAll('header a')].some(
        (a) => /sign in/i.test(a.textContent ?? '') && a.offsetParent !== null,
      ),
      menu: [...document.querySelectorAll('header button')].some((b) => /menu/i.test(b.textContent ?? '')),
      desktopNav: [...document.querySelectorAll('header nav a')].some((a) => /For Patients/i.test(a.textContent ?? '') && a.offsetParent !== null),
    }))
    if (!landing.signIn) note('high', `Sign in missing at ${w}px`)
    if (w < 1024 && !landing.menu) note('high', `Public Menu missing at ${w}px`)
    if (w >= 1024 && !landing.desktopNav) note('high', `Desktop public nav missing at ${w}px`)
    await shot(`smoke-landing-${w}.png`)
  }

  await page.setViewport({ width: 390, height: 844 })
  await login('david@luma.health')
  if (!page.url().includes('/patient')) note('critical', 'Patient login failed', page.url())
  await page.click('button[aria-controls="account-menu"]')
  await new Promise((r) => setTimeout(r, 150))
  const patientAccount = await page.evaluate(() =>
    [...document.querySelectorAll('#account-menu a, #account-menu button')].map((el) => el.textContent?.trim()),
  )
  if (!patientAccount.includes('Profile') || !patientAccount.includes('Settings') || !patientAccount.includes('Sign out')) {
    note('high', 'Patient Account menu incomplete at 390px', patientAccount.join(', '))
  } else note('ok', 'Patient Account menu has Profile, Settings, Sign out')
  await shot('smoke-patient-account-390.png')

  const logo = await page.$eval('header a', (a) => a.getAttribute('href'))
  if (logo !== '/patient') note('medium', 'Patient wordmark is not /patient', logo ?? '')

  await page.goto(`${base}/doctor`, { waitUntil: 'networkidle0' })
  if (!page.url().includes('unauthorized')) note('critical', 'Patient reached /doctor')
  else note('ok', 'RBAC still blocks patient from /doctor')

  await page.setViewport({ width: 1440, height: 900 })
  await login('amara@luma.health')
  await page.goto(`${base}/doctor/schedule`, { waitUntil: 'networkidle0' })
  const apt = await page.$('a[href*="/doctor/appointments/"]')
  if (!apt) note('high', 'No clinician appointments on schedule')
  else {
    await page.goto(base + (await apt.evaluate((a) => a.getAttribute('href'))), { waitUntil: 'networkidle0' })
    const reschedule = await page.evaluate(() =>
      [...document.querySelectorAll('button')].some((b) => b.textContent?.trim() === 'Reschedule'),
    )
    if (!reschedule) note('medium', 'Reschedule not shown (visit may be completed)')
    else {
      await page.evaluate(() => {
        const b = [...document.querySelectorAll('button')].find((el) => el.textContent?.trim() === 'Reschedule')
        b?.click()
      })
      await new Promise((r) => setTimeout(r, 400))
      const dialog = await page.$('[role="dialog"]')
      const hasSlots = dialog
        ? await page.evaluate(() =>
            [...document.querySelectorAll('[role="dialog"] button')].some((b) => /^\d{2}:\d{2}$/.test(b.textContent?.trim() ?? '')),
          )
        : false
      if (!dialog) note('high', 'Clinician reschedule did not open a dialog')
      else if (!hasSlots) note('medium', 'Clinician reschedule dialog has no time slots')
      else note('ok', 'Clinician reschedule dialog shows real slots')
      await shot('smoke-doctor-reschedule.png')
      const cancel = await page.evaluate(() =>
        [...document.querySelectorAll('button')].some((b) => b.textContent?.trim() === 'Cancel'),
      )
      if (cancel) {
        await page.evaluate(() => {
          const b = [...document.querySelectorAll('button')].find((el) => el.textContent?.trim() === 'Cancel')
          b?.click()
        })
        await new Promise((r) => setTimeout(r, 200))
        const confirm = await page.evaluate(() =>
          [...document.querySelectorAll('[role="dialog"] button')].some((b) => /cancel appointment/i.test(b.textContent ?? '')),
        )
        if (!confirm) note('high', 'Clinician cancel is missing Keep/Cancel appointment pattern')
        else note('ok', 'Clinician cancel uses confirmation dialog')
      }
    }
  }

  await page.setViewport({ width: 390, height: 844 })
  await login('amara@luma.health')
  await page.click('button[aria-controls="account-menu"]')
  const docAccount = await page.evaluate(() =>
    [...document.querySelectorAll('#account-menu a, #account-menu button')].map((el) => el.textContent?.trim()),
  )
  if (!docAccount.includes('Profile') || !docAccount.includes('Availability') || !docAccount.includes('Sign out')) {
    note('high', 'Clinician Account menu incomplete', docAccount.join(', '))
  } else note('ok', 'Clinician Account menu has Profile, Availability, Sign out')
  await shot('smoke-doctor-account-390.png')

  await login('admin@luma.health')
  await page.click('button[aria-controls="account-menu"]')
  const adminAccount = await page.evaluate(() =>
    [...document.querySelectorAll('#account-menu a, #account-menu button')].map((el) => el.textContent?.trim()),
  )
  if (!adminAccount.includes('System') || !adminAccount.includes('Sign out')) {
    note('high', 'Admin Account menu incomplete', adminAccount.join(', '))
  } else note('ok', 'Admin Account menu has System and Sign out')
  await shot('smoke-admin-account-390.png')

  for (const w of [768, 1024, 1440]) {
    await page.setViewport({ width: w, height: 900 })
    await page.goto(`${base}/admin`, { waitUntil: 'networkidle0' })
    const side = await page.$eval('aside', (el) => getComputedStyle(el).display !== 'none').catch(() => false)
    if (!side) note('high', `Admin sidebar missing at ${w}px`)
    await shot(`smoke-admin-${w}.png`)
  }
} catch (err) {
  note('high', 'Smoke runner crashed', err.message)
} finally {
  const remaining = issues.filter((i) => i.sev !== 'ok')
  console.log(JSON.stringify({ remaining, all: issues }, null, 2))
  await browser.close()
  if (remaining.length) process.exitCode = 1
}
