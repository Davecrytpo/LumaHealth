import puppeteer from 'puppeteer-core'

const base = 'http://localhost:5173'
const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  defaultViewport: { width: 390, height: 844 },
})
const page = await browser.newPage()
page.setDefaultTimeout(20000)

await page.goto(`${base}/`, { waitUntil: 'networkidle0' })
const landing = await page.evaluate(() => ({
  signIn: [...document.querySelectorAll('header a')].some(
    (a) => /sign in/i.test(a.textContent ?? '') && a.offsetParent !== null,
  ),
  menu: [...document.querySelectorAll('header button')].some((b) => /menu/i.test(b.textContent ?? '')),
}))
await page.click('header button')
await new Promise((r) => setTimeout(r, 200))
const menuOpen = await page.evaluate(() =>
  [...document.querySelectorAll('#public-menu a')].map((a) => a.textContent?.trim()),
)
await page.screenshot({ path: 'qa-shots/fix-landing-390.png', fullPage: true })

await page.goto(`${base}/sign-in`, { waitUntil: 'networkidle0' })
await page.locator('input[type="email"]').fill('david@luma.health')
await page.locator('input[type="password"]').fill('luma-demo')
await Promise.all([
  page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {}),
  page.click('button[type="submit"]'),
])
await new Promise((r) => setTimeout(r, 400))
const portal = await page.evaluate(() => ({
  url: location.pathname,
  signOut: [...document.querySelectorAll('button')].some(
    (b) => /sign out/i.test(b.textContent ?? '') && b.offsetParent !== null,
  ),
  logo: document.querySelector('header a')?.getAttribute('href'),
}))
await page.screenshot({ path: 'qa-shots/fix-patient-390.png', fullPage: true })

console.log(JSON.stringify({ landing, menuOpen, portal }, null, 2))
await browser.close()
