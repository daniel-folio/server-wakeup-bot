# 🤖 Render 서버 자동 복구 봇 (Render Server Auto-Heal Bot)

이 프로젝트는 Render.com의 무료 웹 서비스 플랜을 안정적으로 운영하기 위한 필수 유틸리티입니다. GitHub Actions와 Puppeteer를 사용하여, 서버가 다운되거나 휴면 상태에 빠졌을 때 이를 감지하고 자동으로 재시작시킵니다.

## 📜 목차 -

- [왜 이 봇이 필요한가요?](#-왜-이-봇이-필요한가요)
- [어떻게 작동하나요?](#-어떻게-작동하나요)
- [사전 준비물](#-사전-준비물)
- [설치 및 설정 가이드](#-설치-및-설정-가이드)
  - [1단계: Slack Webhook URL 발급](#1단계-slack-webhook-url-발급)
  - [2단계: GitHub 저장소 생성 및 Secrets 설정](#2단계-github-저장소-생성-및-secrets-설정)
  - [3단계: 프로젝트 파일 준비](#3단계-프로젝트-파일-준비)
  - [4단계: GitHub Actions 워크플로우 설정](#4단계-github-actions-워크플로우-설정)
  - [5단계: GitHub에 업로드하여 활성화](#5단계-github에-업로드하여-활성화)
- [테스트 및 확인 방법](#-테스트-및-확인-방법)

---

## 🤔 왜 이 봇이 필요한가요?

Render의 **무료(Free) 플랜**은 다음과 같은 특징 때문에 실제 서비스 운영 시 불안정한 모습을 보일 수 있습니다.

1.  **자동 휴면 (Spin Down)**: 무료 버전의 서버라서 15분 동안 트래픽이 없으면 서버가 잠자기 모드로 전환됩니다.
2.  **낮은 메모리 (RAM)**: 메모리가 부족하여 애플리케이션이 예기치 않게 다운(Crash)되는 현상이 잦습니다.
3.  **불완전한 복구**: 서버가 다운된 후 휴면 상태에 빠지면, 간단한 Ping 서비스로는 서버를 다시 깨울 수 없는 문제가 있습니다.

이 봇은 특히 **3번 문제**를 해결하여, 서버가 어떤 이유로든 멈추었을 때 다시 온라인 상태로 되돌리는 **"심폐소생술"** 역할을 합니다.

---

## ⚙️ 어떻게 작동하나요?

이 봇은 **GitHub Actions**라는 무료 자동화 도구를 사용하여 10~15분마다 다음 작업을 수행합니다.

1.  가상 환경에 **Puppeteer**라는 보이지 않는 크롬(Chromium) 브라우저를 실행시킵니다.
2.  이 브라우저를 이용해 내 Render 서버 주소에 **실제로 방문**합니다.
3.  **성공 시**: Render 서버의 휴면을 방지합니다.
4.  **실패 시**: 서버가 다운된 것으로 간주하고, **Slack으로 즉시 알림**을 보냅니다. 또한 이 접속 실패 자체가 Render 플랫폼이 서버를 재시작하도록 만드는 **강력한 신호**로 작용합니다.

---

## 📌 사전 준비물

-   **GitHub 계정**
-   **Slack 계정 및 Workspace**
-   깨우고 싶은 **Render 서버 주소**
-   **Node.js 및 npm** (로컬 컴퓨터에 설치)

## 🚀 설치 및 설정 가이드

### 1단계: Slack Webhook URL 발급

먼저, 봇이 알림 메시지를 보낼 수 있는 Slack의 전용 URL을 만듭니다.

-   **1-1.** [Slack 앱 생성 페이지](https://api.slack.com/apps)로 이동하여 `Create New App` > `From scratch`를 선택합니다.
-   **1-2.** 앱 이름(예: `Server Alert Bot`)과 Workspace를 선택하여 앱을 생성합니다.
-   **1-3.** `Incoming Webhooks` 기능을 선택하고 **On**으로 활성화합니다.
-   **1-4.** `Add New Webhook to Workspace` 버튼을 눌러 알림을 받을 채널을 선택하고 `Allow`를 클릭합니다.
-   **1-5.** 생성된 **Webhook URL** (`https://hooks.slack.com/...`)을 **복사**합니다. 이 주소는 비밀 정보이므로 외부에 노출하지 마세요.

### 2단계: GitHub 저장소 생성 및 Secrets 설정

다음으로, 이 봇만을 위한 GitHub 저장소를 만들고 복사한 Webhook URL을 안전하게 저장합니다.

-   **2-1.** GitHub에서 `server-wakeup-bot`과 같은 이름으로 새 저장소를 생성합니다.
-   **2-2.** 생성된 저장소의 `Settings` > `Secrets and variables` > `Actions` 메뉴로 이동합니다.
-   **2-3.** `New repository secret` 버튼을 클릭합니다.
-   **2-4.** **Name**에는 `SLACK_WEBHOOK_URL`을, **Secret**에는 1단계에서 복사한 **실제 Webhook URL**을 
붙여넣고 `Add secret`을 클릭하여 저장합니다.
-   **2-5.** `New repository secret` 버튼을 클릭합니다.
-   **2-6.** **Name**에는 `WAKEUP_URL`을, **Secret**에는 깨우고 싶은 **Render 서버 주소**를 붙여넣고 `Add secret`을 클릭하여 저장합니다.


### 3단계: 프로젝트 파일 준비

이제 내 컴퓨터에 봇을 실행할 코드를 준비합니다.

-   **3-1. 저장소 복제 및 초기화**: 터미널에서 아래 명령어를 실행합니다. (`<username>`은 본인 ID로 변경)
    ```bash
    git clone [https://github.com/](https://github.com/)<username>/server-wakeup-bot.git
    ```
    **3-2. 폴더 이동 및 초기화**:
    ```bash
    cd server-wakeup-bot        # 방금 생성된 폴더로 이동
    npm init -y                 # Node.js 프로젝트 초기화 (package.json 생성)
    npm install puppeteer axios # Puppeteer 설치
    ```

-   **3-3. `wakeup.js` 스크립트 작성**: `server-wakeup-bot` 폴더 안에 `wakeup.js`라는 새 파일을 만들고, 아래 코드를 그대로 복사하여 붙여넣습니다.

    ```javascript
    // wakeup.js
    import puppeteer from 'puppeteer';
    import axios from 'axios';
    
    // GitHub Secrets에서 Webhook URL을 가져옵니다.
    const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
    
    // 깨우고 싶은 백엔드 서버의 주소를 입력합니다.
    const WAKEUP_URL = process.env.WAKEUP_URL;
    
    async function wakeupServer() {
      console.log('✅ 서버 깨우기 작업을 시작합니다...');
      try {
        if (!SLACK_WEBHOOK_URL) {
          throw new Error('SLACK_WEBHOOK_URL is not defined. Please set it in GitHub Secrets.');
        }

        const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
        const page = await browser.newPage();
        
        console.log(`- 서버에 접속을 시도합니다: ${WAKEUP_URL}`);
        const response = await page.goto(WAKEUP_URL);
    
        if (!response.ok()) {
          throw new Error(`서버 응답 실패! 상태 코드: ${response.status()}`);
        }
    
        console.log(`- 접속 성공! 상태 코드: ${response.status()}`);
        console.log('- 서버가 정상적으로 응답했습니다.');
        
        await browser.close();
    
      } catch (error) {
        console.error(`- 서버를 깨우는 중 오류가 발생했습니다: ${error.message}`);
        
        try {
          const errorMessage = `📡 **서버 응답 없음 (Timeout 추정)** 🚨\nWakeup-bot이 서버에 접속하지 못했습니다. Render 플랫폼이 다음 요청 시 서버를 자동으로 재시작할 것입니다.`;
          await axios.post(SLACK_WEBHOOK_URL, { text: errorMessage });
          console.log('- 슬랙 알림을 성공적으로 보냈습니다.');
        } catch (slackError) {
          console.error(`- 슬랙 알림 전송에 실패했습니다: ${slackError.message}`);
        }
        
        process.exit(1);
      }
    }
    
    wakeupServer();
    ```
    > **⚠️ 중요**: 이 스크립트가 올바르게 작동하려면, **2단계**에서 설명한 대로 GitHub 저장소 Secrets에 **`SLACK_WEBHOOK_URL`**과 **`WAKEUP_URL`**을 반드시 설정해야 합니다.

-   **3-4. 📝 백엔드 서버에 전용 경로 설정 (Strapi 기준)**:
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
### 4단계: GitHub Actions 워크플로우 설정

GitHub가 정해진 시간에 이 스크립트를 실행하도록 스케줄을 설정하고, Secrets 값을 주입합니다.

-   **4-1. 폴더 및 파일 생성**: `server-wakeup-bot` 폴더 안에 `.github/workflows/wakeup.yml` 파일을 생성합니다.
-   **4-2. `wakeup.yml` 코드 작성**: 아래 코드를 그대로 복사하여 붙여넣습니다.

    ```yaml
    # .github/workflows/wakeup.yml
    name: Server Wakeup
    
    on:
      workflow_dispatch: # Actions 탭에서 수동으로 실행할 수 있게 함
      schedule:
        - cron: '*/10 * * * *' # 10분마다 실행
    
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
            env:
              SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
              WAKEUP_URL: ${{ secrets.WAKEUP_URL }}
    
    ```

### 5단계: GitHub에 업로드하여 활성화

이제 준비된 모든 파일을 GitHub에 업로드하여 봇을 활성화합니다.

-   터미널에서 아래 명령어들을 순서대로 실행합니다.
    ```bash
    git add .
    git commit -m "feat: Initial setup for wakeup bot with Slack integration"
    git push origin main
    ```

---

## ✅ 테스트 및 확인 방법

설정이 완료되면 GitHub 저장소의 **Actions** 탭에서 봇이 잘 작동하는지 바로 테스트해 볼 수 있습니다.

1.  `server-wakeup-bot` GitHub 저장소 페이지로 이동하여 **`Actions`** 탭을 클릭합니다.
2.  왼쪽에서 **`Server Wakeup`** 워크플로우를 선택합니다.
3.  오른쪽에 나타나는 **`Run workflow`** 버튼을 클릭하여 즉시 테스트를 실행합니다.
4.  작업이 성공하면 **초록색 체크(✅)** 아이콘이 표시됩니다. 작업 이름을 클릭하면 실행 로그를 확인할 수 있습니다.