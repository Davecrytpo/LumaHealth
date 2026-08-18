import puppeteer from 'puppeteer-core'

const base = 'http://localhost:5173'
const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  defaultViewport: { width: 1440, height: 900 },
})
const page = await browser.newPage()
page.setDefaultTimeout(20000)

await page.goto(`${base}/sign-in`, { waitUntil: 'networkidle0' })
await page.evaluate(() => localStorage.clear())
await page.reload({ waitUntil: 'networkidle0' })
await page.locator('input[type="email"]').fill('amara@luma.health')
await page.locator('input[type="password"]').fill('luma-demo')
await Promise.all([
  page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {}),
  page.click('button[type="submit"]'),
])

for (const id of ['apt_sarah_today', 'apt_james_today', 'apt_leila_pending']) {
  await page.goto(`${base}/doctor/appointments/${id}`, { waitUntil: 'networkidle0' })
  const title = await page.$eval('h1', (el) => el.textContent ?? '')
  const buttons = await page.$$eval('button', (bs) => bs.map((b) => b.textContent?.trim()))
  console.log(id, title, buttons)
  if (buttons.includes('Reschedule')) {
    await page.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find((el) => el.textContent?.trim() === 'Reschedule')
      b?.click()
    })
    await new Promise((r) => setTimeout(r, 500))
    const slots = await page.$$eval('[role="dialog"] button', (bs) =>
      bs.map((b) => b.textContent?.trim()).filter((t) => /^\d{2}:\d{2}$/.test(t ?? '')),
    )
    const keep = await page.evaluate(() =>
      [...document.querySelectorAll('[role="dialog"] button')].some((b) => /keep this time/i.test(b.textContent ?? '')),
    )
    await page.screenshot({ path: 'qa-shots/smoke-sarah-reschedule.png', fullPage: true })
    console.log(JSON.stringify({ id, slots: slots.slice(0, 8), keep, count: slots.length }))
    if (slots[0]) {
      await page.evaluate((time) => {
        const b = [...document.querySelectorAll('[role="dialog"] button')].find((el) => el.textContent?.trim() === time)
        b?.click()
      }, slots[0])
      await page.evaluate(() => {
        const b = [...document.querySelectorAll('[role="dialog"] button')].find((el) =>
          /save new time/i.test(el.textContent ?? ''),
        )
        b?.click()
      })
      await new Promise((r) => setTimeout(r, 700))
      const after = await page.$eval('h1', (el) => el.textContent ?? '')
      const timeText = await page.evaluate(() => document.body.innerText)
      console.log('after reschedule', { after, hasToast: /rescheduled/i.test(timeText) })
    }
    break
  }
}

await browser.close()
