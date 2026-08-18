import puppeteer from 'puppeteer-core'

const base = 'http://localhost:5173'
const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  defaultViewport: { width: 390, height: 844, deviceScaleFactor: 2 },
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

await page.goto(`${base}/`, { waitUntil: 'networkidle0' })
await page.screenshot({ path: 'qa-shots/m-landing.png', fullPage: true })
await page.click('header button')
await new Promise((r) => setTimeout(r, 200))
await page.screenshot({ path: 'qa-shots/m-landing-menu.png' })

await page.goto(`${base}/sign-in`, { waitUntil: 'networkidle0' })
await page.screenshot({ path: 'qa-shots/m-signin.png', fullPage: true })

await page.goto(`${base}/sign-up`, { waitUntil: 'networkidle0' })
await page.screenshot({ path: 'qa-shots/m-signup.png', fullPage: true })

await login('david@luma.health')
await page.screenshot({ path: 'qa-shots/m-patient.png', fullPage: true })
await page.goto(`${base}/patient/find-care`, { waitUntil: 'networkidle0' })
await page.screenshot({ path: 'qa-shots/m-findcare.png', fullPage: true })
await page.goto(`${base}/patient/appointments`, { waitUntil: 'networkidle0' })
await page.screenshot({ path: 'qa-shots/m-appts.png', fullPage: true })

await login('amara@luma.health')
await page.screenshot({ path: 'qa-shots/m-doctor.png', fullPage: true })
await page.click('button[aria-controls="account-menu"]')
await new Promise((r) => setTimeout(r, 200))
await page.screenshot({ path: 'qa-shots/m-doctor-account.png' })

await login('admin@luma.health')
await page.goto(`${base}/admin/users`, { waitUntil: 'networkidle0' })
await page.screenshot({ path: 'qa-shots/m-admin-users.png', fullPage: true })

console.log('shots ok')
await browser.close()
