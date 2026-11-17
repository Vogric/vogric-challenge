import { chromium } from 'playwright'
import lighthouse from 'lighthouse'
import { launch } from 'chrome-launcher'

const baseUrl = process.env.LIGHTHOUSE_BASE_URL || 'http://localhost:3000'
const url = `${baseUrl}/auth/login`
const budgets = {
  performance: 0.9,
  accessibility: 0.95,
  'best-practices': 0.9,
  seo: 0.9,
}

process.env.CHROME_PATH ??= chromium.executablePath()

const chrome = await launch({
  chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'],
})

try {
  const runner = await lighthouse(url, {
    port: chrome.port,
    output: 'json',
    logLevel: 'error',
    onlyCategories: Object.keys(budgets),
    formFactor: 'desktop',
    screenEmulation: { width: 1350, height: 940, deviceScaleFactor: 1, mobile: false },
  })

  if (!runner) throw new Error('Lighthouse did not return a result')

  const categories = runner.lhr.categories
  let failed = false
  console.log(`Lighthouse · ${url}`)
  for (const [key, minimum] of Object.entries(budgets)) {
    const score = categories[key]?.score ?? 0
    const pass = score >= minimum
    if (!pass) failed = true
    console.log(`${pass ? 'PASS' : 'FAIL'}  ${key}: ${Math.round(score * 100)} (minimum ${minimum * 100})`)
  }

  const metrics = runner.lhr.audits
  console.log(
    `INFO  FCP ${Math.round(metrics['first-contentful-paint'].numericValue)} ms · ` +
      `LCP ${Math.round(metrics['largest-contentful-paint'].numericValue)} ms · ` +
      `TBT ${Math.round(metrics['total-blocking-time'].numericValue)} ms`
  )

  if (failed) process.exitCode = 1
} finally {
  await chrome.kill()
}
