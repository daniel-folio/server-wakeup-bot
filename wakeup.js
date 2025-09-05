// wakeup.js
const puppeteer = require('puppeteer');
import axios from 'axios';

// 1. Wakeup Bot이 호출할 백엔드 서버의 주소
const WAKEUP_URL = process.env.WAKEUP_URL;
// 2. Slack에 알림을 보낼 Webhook URL (반드시 본인 값으로 변경)
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

async function wakeupServer() {
  console.log('✅ 서버 깨우기 작업을 시작합니다...');
  try {
    // 1. 브라우저를 실행합니다.
    const browser = await puppeteer.launch({
      headless: true, // true로 설정해야 UI 없이 백그라운드에서 실행됩니다.
      args: ['--no-sandbox', '--disable-setuid-sandbox'], // GitHub Actions 같은 환경에서 필요
    });

    // 2. 새 페이지를 엽니다.
    const page = await browser.newPage();

    // 3. 내 서버 URL로 접속합니다.
    console.log(`- 서버에 접속을 시도합니다: ${WAKEUP_URL}`);
    const response = await page.goto(WAKEUP_URL);

    // 4. 페이지 타이틀을 가져와서 성공 여부를 확인합니다.
    if (response.ok()) {
      console.log(`접속 성공! 상태 코드: ${response.status()}`);
      console.log('서버가 성공적으로 깨어났습니다.');
    } else {
      throw new Error(`서버 응답 실패! 상태 코드: ${response.status()}`);
    }

    // 5. 브라우저를 닫습니다.
    await browser.close();
  } catch (error) {
    console.error(`- 서버를 깨우는 중 오류가 발생했습니다: ${error.message}`);
    // 서버 접속 실패 시 슬랙 알림 전송
    try {
      const errorMessage = `📡 **서버 응답 없음 (Timeout 추정)** 🚨\nWakeup-bot이 서버에 접속하지 못했습니다. Render 플랫폼이 다음 요청 시 서버를 자동으로 재시작할 것입니다.`;
      await axios.post(SLACK_WEBHOOK_URL, { text: errorMessage });
      console.log('- 슬랙 알림을 성공적으로 보냈습니다.');
    } catch (slackError) {
      console.error(`- 슬랙 알림 전송에 실패했습니다: ${slackError.message}`);
    }
    
    // GitHub Actions 워크플로우를 실패 처리하여 로그 확인이 용이하도록 함
    process.exit(1); // 오류 발생 시 스크립트를 실패 처리
  }
}

wakeupServer();