import fs from 'node:fs'
import path from 'node:path'
import puppeteer from 'puppeteer-core'

const base = process.env.VERIFY_BASE ?? 'http://localhost:5173'
const out = path.resolve('verify-shots')
fs.mkdirSync(out, { recursive: true })

const chrome =
  process.env.CHROME_PATH ??
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: 'new',
  args: ['--no-sandbox', '--window-size=1440,900'],
  defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
})

const page = await browser.newPage()
page.setDefaultTimeout(20000)

async function shot(name) {
  await page.waitForNetworkIdle({ idleTime: 500, timeout: 12000 }).catch(() => {})
  await new Promise((r) => setTimeout(r, 350))
  const file = path.join(out, `${name}.png`)
  await page.screenshot({ path: file, fullPage: true })
  console.log('saved', file)
}

async function login(email) {
  await page.goto(`${base}/sign-in`, { waitUntil: 'networkidle0' })
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill('luma-demo')
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle0' }),
    page.locator('button[type="submit"]').click(),
  ])
}

try {
  await page.goto(base, { waitUntil: 'networkidle0' })
  await shot('01-landing-desktop')

  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 })
  await page.goto(base, { waitUntil: 'networkidle0' })
  await shot('02-landing-mobile')

  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 })
  await page.goto(`${base}/sign-in`, { waitUntil: 'networkidle0' })
  await shot('03-sign-in')

  await page.goto(`${base}/sign-up`, { waitUntil: 'networkidle0' })
  await shot('04-sign-up')

  await login('david@luma.health')
  await shot('05-patient-overview')
  await page.goto(`${base}/patient/find-care`, { waitUntil: 'networkidle0' })
  await shot('06-patient-find-care')
  await page.goto(`${base}/patient/appointments`, { waitUntil: 'networkidle0' })
  await shot('07-patient-appointments')
  await page.goto(`${base}/patient/prescriptions`, { waitUntil: 'networkidle0' })
  await shot('08-patient-prescriptions')

  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 })
  await page.goto(`${base}/patient`, { waitUntil: 'networkidle0' })
  await shot('09-patient-overview-mobile')

  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 })
  await page.goto(`${base}/sign-in`, { waitUntil: 'networkidle0' })
  // already signed in as patient — sign out first via localStorage
  await page.evaluate(() => localStorage.clear())
  await login('amara@luma.health')
  await shot('10-doctor-overview')
  await page.goto(`${base}/doctor/schedule`, { waitUntil: 'networkidle0' })
  await shot('11-doctor-schedule')

  await page.evaluate(() => localStorage.clear())
  await login('admin@luma.health')
  await shot('12-admin-overview')
  await page.goto(`${base}/admin/audit-log`, { waitUntil: 'networkidle0' })
  await shot('13-admin-audit')

  console.log('ok')
} catch (err) {
  console.error(err)
  await page.screenshot({ path: path.join(out, 'error.png'), fullPage: true }).catch(() => {})
  process.exitCode = 1
} finally {
  await browser.close()
}
