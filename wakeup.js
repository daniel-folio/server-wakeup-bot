// wakeup.js
const puppeteer = require('puppeteer');
const axios = require('axios');

// Env Vars
const WAKEUP_URL = process.env.WAKEUP_URL; // 필수
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL; // 필수
const SERVER_ROLE = process.env.SERVER_ROLE || 'unknown'; // 'prod' | 'backup' 등
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY || '';
const GITHUB_RUN_ID = process.env.GITHUB_RUN_ID || '';
const RUN_URL = GITHUB_REPOSITORY && GITHUB_RUN_ID
  ? `https://github.com/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}`
  : '';

function nowIso() {
  return new Date().toISOString();
}

async function sendSlack(text) {
  if (!SLACK_WEBHOOK_URL) return;
  try {
    await axios.post(SLACK_WEBHOOK_URL, { text });
    console.log('- 슬랙 알림을 성공적으로 보냈습니다.');
  } catch (slackError) {
    console.error(`- 슬랙 알림 전송에 실패했습니다: ${slackError.message}`);
  }
}

async function wakeupOnce() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const page = await browser.newPage();
    // 네비게이션 타임아웃을 명시적으로 설정
    await page.setDefaultNavigationTimeout(30_000);

    console.log(`- 접속 시도: ${WAKEUP_URL}`);
    const response = await page.goto(WAKEUP_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });

    const status = response ? response.status() : 'no-response';
    console.log(`- 응답 상태: ${status}`);

    if (!response || !response.ok()) {
      throw new Error(`HTTP ${status}`);
    }

    return { ok: true, status };
  } finally {
    await browser.close();
  }
}

async function wakeupServer() {
  console.log('✅ 서버 깨우기 작업을 시작합니다...');
  console.log(`- 시간: ${nowIso()}`);
  console.log(`- ROLE: ${SERVER_ROLE}`);
  console.log(`- REPO: ${GITHUB_REPOSITORY}`);
  console.log(`- RUN : ${RUN_URL || '(local)'}\n`);

  if (!WAKEUP_URL) {
    const msg = 'WAKEUP_URL is not set';
    console.error(msg);
    await sendSlack(`❌ [${SERVER_ROLE}] Wakeup 실패: ${msg}`);
    process.exit(1);
  }

  // 최대 2회 재시도
  const maxAttempts = 2;
  let lastErr = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`(시도 ${attempt}/${maxAttempts})`);
      const res = await wakeupOnce();
      console.log(`- 접속 성공! 상태 코드: ${res.status}`);
      return; // 성공 시 종료
    } catch (e) {
      lastErr = e;
      console.error(`- 오류 (${attempt}/${maxAttempts}): ${e.message}`);
      if (attempt < maxAttempts) {
        await new Promise(r => setTimeout(r, 3_000));
      }
    }
  }

  // 실패 시 상세 슬랙 메시지
  const details = [
    `🕐 시간: ${nowIso()}`,
    `🔗 URL: ${WAKEUP_URL}`,
    `🏷️ 역할: ${SERVER_ROLE}`,
    `📦 저장소: ${GITHUB_REPOSITORY}`,
    RUN_URL ? `🧪 실행: ${RUN_URL}` : null,
    lastErr ? `⚠️ 오류: ${lastErr.message}` : null,
  ].filter(Boolean).join('\n');

  await sendSlack(`📡 서버 깨우기 실패 🚨\n${details}`);
  process.exit(1);
}

wakeupServer();