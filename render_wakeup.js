const puppeteer = require('puppeteer');
const axios = require('axios');

// Env Vars
const WAKEUP_URL = process.env.WAKEUP_URL;
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const SERVER_ROLE = process.env.SERVER_ROLE || 'unknown';
const RENDER_SERVICE_NAME = process.env.RENDER_SERVICE_NAME || 'Render-Worker';

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

// Render 상시 가동 데몬 엔진
async function startAutobotDaemon() {
    console.log('🚀 [Render Worker] 서버 깨우기 무인 자동화 데몬 가동 시작...');
    console.log(`- URL: ${WAKEUP_URL}`);
    console.log(`- ROLE: ${SERVER_ROLE}`);

    if (!WAKEUP_URL) {
        console.error('❌ WAKEUP_URL 환경 변수가 누락되었습니다. 프로세스를 종료합니다.');
        process.exit(1);
    }

    // 14분(840,000ms) 주기 상시 루프
    const INTERVAL_MS = 14 * 60 * 1000;

    while (true) {
        console.log(`\n==============================================`);
        console.log(`🕐 정기 깨우기 사이클 시작: ${nowIso()}`);
        console.log(`==============================================`);

        const maxAttempts = 2;
        let success = false;
        let lastErr = null;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                console.log(`(시도 ${attempt}/${maxAttempts})`);
                const res = await wakeupOnce();
                console.log(`- [성공] 서버가 정상적으로 깨어있습니다. 상태 코드: ${res.status}`);
                success = true;
                break;
            } catch (e) {
                lastErr = e;
                console.error(`- [오류] (${attempt}/${maxAttempts}): ${e.message}`);
                if (attempt < maxAttempts) {
                    await new Promise(r => setTimeout(r, 3000)); // 3초 후 재시도
                }
            }
        }

        if (!success) {
            const details = [
                `🕐 시간: ${nowIso()}`,
                `🔗 URL: ${WAKEUP_URL}`,
                `🏷️ 역할: ${SERVER_ROLE}`,
                `📦 환경: ${RENDER_SERVICE_NAME}`,
                lastErr ? `⚠️ 오류: ${lastErr.message}` : null,
            ].filter(Boolean).join('\n');

            await sendSlack(`🚨 [Render] 서버 깨우기 연속 실패 알림\n${details}`);
        }

        console.log(`💤 다음 깨우기까지 14분 동안 백그라운드 대기 모드로 진입합니다...`);
        await new Promise(r => setTimeout(r, INTERVAL_MS));
    }
}

startAutobotDaemon();