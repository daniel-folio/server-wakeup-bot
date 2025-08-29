# 🤖 Render 서버 자동 복구 봇 (Render Server Auto-Heal Bot)

이 프로젝트는 Render.com의 무료 웹 서비스 플랜을 안정적으로 운영하기 위한 필수 유틸리티입니다. GitHub Actions와 Puppeteer를 사용하여, 서버가 다운되거나 휴면 상태에 빠졌을 때 이를 감지하고 자동으로 재시작시킵니다.

## 📜 목차

- [왜 이 봇이 필요한가요?](#-왜-이-봇이-필요한가요)
- [어떻게 작동하나요?](#-어떻게-작동하나요)
- [사전 준비물](#-사전-준비물)
- [설치 및 설정 가이드](#-설치-및-설정-가이드)
  - [1단계: GitHub 저장소 생성](#1단계-github-저장소-생성)
  - [2단계: 프로젝트 파일 준비](#2단계-프로젝트-파일-준비)
  - [3단계: GitHub Actions 워크플로우 설정](#3단계-github-actions-워크플로우-설정)
  - [4단계: GitHub에 업로드하여 활성화](#4단계-github에-업로드하여-활성화)
- [테스트 및 확인 방법](#-테스트-및-확인-방법)
- [참고 사항](#-참고-사항)

---

## 🤔 왜 이 봇이 필요한가요?

Render의 **무료(Free) 플랜**은 다음과 같은 특징 때문에 실제 서비스 운영 시 불안정한 모습을 보일 수 있습니다.

1.  **자동 휴면 (Spin Down)**: 15분 동안 트래픽이 없으면 서버가 잠자기 모드로 전환됩니다. 이로 인해 다음 접속 시 최대 30초 이상의 긴 로딩 시간이 발생합니다.
2.  **낮은 메모리 (RAM)**: 메모리가 부족하여 애플리케이션이 예기치 않게 다운(Crash)되는 현상이 잦습니다.
3.  **불완전한 복구**: 서버가 다운된 후 휴면 상태에 빠지면, `cron-job.org` 같은 간단한 Ping 서비스로는 서버를 다시 깨울 수 없는 문제가 있습니다.

이 봇은 특히 **3번 문제**를 해결하여, 서버가 어떤 이유로든 멈추었을 때 다시 온라인 상태로 되돌리는 **"심폐소생술"** 역할을 합니다.

---

## ⚙️ 어떻게 작동하나요?

이 봇은 **GitHub Actions**라는 무료 자동화 도구를 사용하여 15분마다 다음 작업을 수행합니다.

1.  가상 환경에 **Puppeteer**라는 도구를 설치합니다. Puppeteer는 실제 사람처럼 웹사이트와 상호작용할 수 있는 보이지 않는 크롬(Chromium) 브라우저입니다.
2.  이 가상 브라우저를 이용해 내 Render 서버 주소에 **실제로 방문**합니다.
3.  Render 플랫폼은 이 "실제 방문"을 감지하고, 서버가 잠들어 있거나 다운된 상태일 경우 **강제로 깨워서 재시작**시킵니다.

간단히 말해, **15분마다 로봇이 내 사이트에 방문해서 서버가 잠들지 않도록 관리**해주는 것과 같습니다.

---

## 📌 사전 준비물

-   **GitHub 계정**: 이 봇을 설정하고 실행할 GitHub 계정이 필요합니다.
-   **Render 서버 주소**: 깨우고 싶은 내 Render 서버의 URL (예: `https://my-app.onrender.com`)
-   **Node.js 및 npm**: 내 컴퓨터에 설치되어 있어야 합니다. ([Node.js 공식 홈페이지](https://nodejs.org/)에서 다운로드)

---

## 🚀 설치 및 설정 가이드

### 1단계: GitHub 저장소 생성

가장 먼저, 이 봇만을 위한 전용 GitHub 저장소를 새로 만듭니다.

-   **1-1.** GitHub에 로그인 후, [새 저장소 만들기](https://github.com/new) 페이지로 이동합니다.
-   **1-2.** 저장소 이름(Repository name)을 `server-wakeup-bot`과 같이 정합니다.
-   **1-3.** **Public(공개)** 또는 **Private(비공개)** 중 원하는 것을 선택합니다. (어느 것을 선택해도 무료로 작동합니다.)
-   **1-4.** `Create repository` 버튼을 눌러 저장소를 생성합니다.

### 2단계: 프로젝트 파일 준비

이제 내 컴퓨터에 봇을 실행할 코드를 준비합니다.

-   **2-1. 저장소 복제(Clone)**: 터미널을 열고 아래 명령어를 실행하여 방금 만든 저장소를 내 컴퓨터로 가져옵니다. (`<username>` 부분은 본인의 GitHub 아이디로 변경하세요.)
    ```bash
    git clone [https://github.com/](https://github.com/)<username>/server-wakeup-bot.git
    ```

-   **2-2. 폴더 이동 및 초기화**:
    ```bash
    cd server-wakeup-bot      # 방금 생성된 폴더로 이동
    npm init -y               # Node.js 프로젝트 초기화 (package.json 생성)
    npm install puppeteer     # Puppeteer 설치
    ```

-   **2-3. `wakeup.js` 스크립트 작성**: `server-wakeup-bot` 폴더 안에 `wakeup.js`라는 새 파일을 만들고, 아래 코드를 그대로 복사하여 붙여넣습니다.

    ```javascript
    // wakeup.js
    const puppeteer = require('puppeteer');

    async function wakeupServer() {
      console.log(' wakeup task start...');
      try {
        const browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        const page = await browser.newPage();
    
        // =================================================================
        // ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼ 이 부분만 수정해주세요! ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
        // =================================================================
        const targetUrl = '[https://portfolio-be-yslr.onrender.com/git-wakeupbot](https://portfolio-be-yslr.onrender.com/git-wakeupbot)';
        // =================================================================
        // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
        // =================================================================

        console.log(`- Accessing server: ${targetUrl}`);
        const response = await page.goto(targetUrl);
    
        if (response.ok()) {
          console.log(`- Success! Status: ${response.status()}`);
          console.log('- Server has been successfully woken up.');
        } else {
          throw new Error(`- Server response failed! Status: ${response.status()}`);
        }
    
        await browser.close();
      } catch (error) {
        console.error('- An error occurred while waking up the server:', error);
        process.exit(1);
      }
    }
    
    wakeupServer();
    ```
    > **⚠️ 중요**: 위 코드에서 `targetUrl` 변수의 값을 **자신의 Render 서버 주소**와 **전용 헬스 체크 경로**로 반드시 변경해야 합니다.

-   **2-4. 📝 백엔드 서버에 전용 경로 설정 (Strapi 기준)**:
    `wakeup.js`가 호출할 전용 경로들을 백엔드 서버에 만들어주어야 합니다. Strapi 프로젝트의 `src/index.ts` 파일 내 `bootstrap` 함수 안에 아래 코드를 추가합니다.

    ```javascript
    // src/index.ts

    export default {
      async bootstrap({ strapi }) {
        // ... 다른 bootstrap 코드 ...

        // 전역 헬스 체크 라우트 등록
        try {
          strapi.server.routes([
            {
              method: 'GET',
              path: '/git-wakeupbot',
              handler: (ctx: any) => {
                ctx.status = 200;
                ctx.body = { ok: true };
              },
              config: { auth: false },
            },
            {
              method: 'GET',
              path: '/cron-job',
              handler: (ctx: any) => {
                ctx.status = 200;
                ctx.body = { ok: true };
              },
              config: { auth: false },
            },
            {
              method: 'GET',
              path: '/uptimerobot',
              handler: (ctx: any) => {
                ctx.status = 200;
                ctx.body = { ok: true };
              },
              config: { auth: false },
            },
          ]);
          strapi.log.info('✅ Global health check routes registered.');
        } catch (e) {
          strapi.log.warn('⚠️ Failed to register global health check routes.');
        }
      },
    };
    ```

### 3단계: GitHub Actions 워크플로우 설정

GitHub가 정해진 시간에 이 스크립트를 실행하도록 스케줄을 설정합니다.

-   **3-1. 폴더 생성**: `server-wakeup-bot` 폴더 안에 `.github`라는 폴더를 만들고, 그 안에 `workflows`라는 폴더를 또 만듭니다.
    > 📂 server-wakeup-bot
    >  └ 📂 **.github**
    >     └ 📂 **workflows**

-   **3-2. `wakeup.yml` 파일 작성**: `workflows` 폴더 안에 `wakeup.yml`이라는 새 파일을 만들고, 아래 코드를 그대로 복사하여 붙여넣습니다.

    ```yaml
    # .github/workflows/wakeup.yml
    name: Server Wakeup
    
    on:
      workflow_dispatch: # Actions 탭에서 수동으로 실행할 수 있게 함
      schedule:
        # 15분마다 스크립트 실행 (UTC 기준)
        - cron: '*/15 * * * *'
    
    jobs:
      wakeup:
        runs-on: ubuntu-latest
        steps:
          - name: Checkout repository
            uses: actions/checkout@v3
          - name: Setup Node.js
            uses: actions/setup-node@v3
            with:
              node-version: '18'
          - name: Install dependencies
            run: npm install
          - name: Install Puppeteer Browsers (Chromium)
            run: npx puppeteer browsers install chrome
          - name: Run wakeup script
            run: node wakeup.js
    ```

### 4단계: GitHub에 업로드하여 활성화

이제 준비된 모든 파일을 GitHub에 업로드하여 봇을 활성화합니다.

-   터미널에서 아래 명령어들을 순서대로 실행합니다.
    ```bash
    git add .                                      # 모든 변경사항 추가
    git commit -m "feat: Add wakeup bot script"    # 변경 내용 기록
    git push origin main                           # GitHub에 업로드
    ```

---

## ✅ 테스트 및 확인 방법

설정이 완료되면 GitHub 저장소의 **Actions** 탭에서 봇이 잘 작동하는지 바로 테스트해 볼 수 있습니다.

1.  `server-wakeup-bot` GitHub 저장소 페이지로 이동하여 **`Actions`** 탭을 클릭합니다.
2.  왼쪽에서 **`Server Wakeup`** 워크플로우를 선택합니다.
3.  오른쪽에 나타나는 **`Run workflow`** 버튼을 클릭하여 즉시 테스트를 실행합니다.
4.  잠시 후 실행 목록이 나타나며, 작업이 성공하면 **초록색 체크(✅)** 아이콘이 표시됩니다. 작업 이름을 클릭하면 `wakeup.js`에서 작성한 로그를 실시간으로 확인할 수 있습니다.

---

## 📝 참고 사항

-   이 봇은 서버 다운 시 복구를 위한 훌륭한 해결책이지만, 서버 다운의 근본적인 원인(메모리 부족)을 해결하지는 않습니다. 가장 안정적인 운영을 위해서는 Render 유료 플랜으로 업그레이드하는 것을 권장합니다.
-   GitHub Actions의 `cron` 스케줄은 UTC 표준시를 기준으로 하므로, 한국 시간과는 9시간의 시차가 있습니다. 하지만 15분마다 실행되는 작업이므로 시간대는 크게 중요하지 않습니다.