// wakeup.js
const puppeteer = require('puppeteer');

async function wakeupServer() {
  console.log('서버 깨우기 작업을 시작합니다...');
  try {
    // 1. 브라우저를 실행합니다.
    const browser = await puppeteer.launch({
      headless: true, // true로 설정해야 UI 없이 백그라운드에서 실행됩니다.
      args: ['--no-sandbox', '--disable-setuid-sandbox'], // GitHub Actions 같은 환경에서 필요
    });

    // 2. 새 페이지를 엽니다.
    const page = await browser.newPage();

    // 3. 내 서버 URL로 접속합니다.
    const targetUrl = 'https://portfolio-be-yslr.onrender.com/git-wakeupbot';
    console.log(`서버에 접속을 시도합니다: ${targetUrl}`);
    const response = await page.goto(targetUrl);

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
    console.error('서버를 깨우는 중 오류가 발생했습니다:', error);
    process.exit(1); // 오류 발생 시 스크립트를 실패 처리
  }
}

wakeupServer();