import puppeteer from 'puppeteer'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const OUT_DIR = './screenshots'
mkdirSync(OUT_DIR, { recursive: true })

const BASE = 'http://localhost:3000'
const EMAIL = process.env.CAPTURE_EMAIL || ''
const PASSWORD = process.env.CAPTURE_PASSWORD || ''

async function capture(page, name, waitFor) {
  if (waitFor) await page.waitForSelector(waitFor, { timeout: 8000 }).catch(() => {})
  else await new Promise(r => setTimeout(r, 1500))
  await page.screenshot({ path: join(OUT_DIR, `${name}.png`), fullPage: false })
  console.log(`✓ ${name}.png`)
}

;(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1440, height: 900 }
  })
  const page = await browser.newPage()

  // 1. 로그인 화면
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' })
  await capture(page, '01_login', 'form')

  if (EMAIL && PASSWORD) {
    // 로그인
    await page.type('input[type="email"]', EMAIL)
    await page.type('input[type="password"]', PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {})

    // 2. 개인 대시보드 (클라이언트 렌더링 대기)
    await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle2' })
    await page.waitForFunction(() => !document.body.innerText.includes('로딩 중'), { timeout: 15000 }).catch(() => {})
    await new Promise(r => setTimeout(r, 2000))
    await capture(page, '02_dashboard', null)

    // 3. 민원 목록
    await page.goto(`${BASE}/counsel`, { waitUntil: 'networkidle2' })
    await capture(page, '03_counsel_list', null)

    // 4. 민원 상세 (첫 번째 민원)
    const firstLink = await page.$('a[href^="/counsel/"]')
    if (firstLink) {
      await firstLink.click()
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {})
      await capture(page, '04_counsel_detail', null)
    }

    // 5. 관리자 대시보드
    await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle2' })
    await capture(page, '05_admin_dashboard', null)

    // 6. 담당자 관리
    await page.goto(`${BASE}/admin/staff`, { waitUntil: 'networkidle2' })
    await capture(page, '06_admin_staff', null)
  } else {
    console.log('⚠ CAPTURE_EMAIL / CAPTURE_PASSWORD 미설정 — 로그인 화면만 캡처')
  }

  await browser.close()
  console.log('\n완료! ./screenshots/ 폴더를 확인하세요.')
})()
