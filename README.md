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

---

## 🧭 운영 가이드 (A/B 동기화, 스케줄 스위치, 진단)

### A/B 저장소 동기화 구조

- B 저장소에서 커밋(push)하면 `.github/workflows/sync-to-a.yml`이 실행되어 A 저장소로 동기화합니다.
- 동기화 방식: rsync로 `publish/` 디렉터리를 만든 후, `sync-to-a.yml` 파일만 제외하고 나머지 전체를 포함해 A 저장소 `main`으로 일반 git push 합니다.
- 필수 전제: B 저장소에 Classic PAT 시크릿이 있어야 합니다.
  - 이름: `A_REPO_PAT`
  - 권한(scope): `repo` (필수). 필요하면 `workflow`도 추가 가능
- A 저장소에는 동기화 대상으로 `wakeup.yml`만 존재하도록 설계되어 있습니다. `sync-to-a.yml`은 A에 포함되지 않습니다.

### 필요한 Secrets / Variables 정리

- 공통(해당 저장소에 등록)
  - Secrets
    - `SLACK_WEBHOOK_URL`: Slack Incoming Webhook URL
    - `WAKEUP_URL`: 깨울 Render 서버 URL
  - Variables
    - `SERVER_ROLE`: 메시지 구분용 라벨. 예) A(운영)=`Prod Svr`, B(백업)=`Backup Svr`
    - `ENABLE_AUTOMATIC_WAKEUP`: 스케줄 on/off 스위치. `'true'`일 때만 스케줄이 동작

> Repository variables 위치: Settings → Secrets and variables → Actions → Variables

### wakeup 스케줄 스위치 방식

- 워크플로 파일: `/.github/workflows/wakeup.yml`
- 트리거
  - 수동 실행: `workflow_dispatch` (항상 가능)
  - 스케줄 실행: `*/10 * * * *` (10분 마다, UTC 기준)
- 조건문
  - `if: github.event_name == 'workflow_dispatch' || vars.ENABLE_AUTOMATIC_WAKEUP == 'true'`
  - 즉, 스케줄은 `ENABLE_AUTOMATIC_WAKEUP` 값이 정확히 `'true'`일 때만 실행됩니다.

### Slack 메시지에 역할/진단 포함

- `wakeup.js`는 다음 정보를 Slack으로 전송합니다.
  - 역할 라벨: `SERVER_ROLE` (예: `[Prod Svr]`, `[Backup Svr]`)
  - 시간(ISO), WAKEUP_URL, GitHub 실행 URL(있는 경우), 오류 메시지/HTTP 상태
- 설정 방법
  - `wakeup.yml`의 실행 스텝 env에 이미 `SERVER_ROLE: ${{ vars.SERVER_ROLE }}`가 설정됨

### 장애/오류 트러블슈팅 팁

- 스케줄이 가끔 안 보이는 경우
  - GitHub Actions 스케줄은 정확한 분 보장이 없고 몇 분 지연/skip될 수 있음
  - 워크플로파일을 처음 추가/수정 직후 첫 스케줄 반영이 늦어질 수 있음
  - `ENABLE_AUTOMATIC_WAKEUP` 값이 소문자 `'true'`인지 확인 (대소문자/공백 주의)
  - 저장소 Settings → Actions 정책이 실행을 제한하지 않는지 확인

- HTTP 오류 코드 확인법
  - Actions 로그의 `Run wakeup script` 단계에서 상태 코드(예: 503)를 확인할 수 있습니다.
  - Slack 알림에도 마지막 오류 메시지(예: `HTTP 503`)와 실행 URL이 포함됩니다.

- A에 워크플로가 처음 동기화된 직후
  - GitHub 정책상 “워크플로 파일을 처음 포함한 커밋”에서는 자동 실행되지 않고, 그 다음 푸시부터 실행됩니다.

### 운영 체크리스트 (요약)

1. B 저장소에 `A_REPO_PAT`(Classic PAT, `repo` 권한) 등록 완료
2. 각 저장소에 `SLACK_WEBHOOK_URL`, `WAKEUP_URL` Secrets 등록
3. 각 저장소에 `SERVER_ROLE`, 필요 시 `ENABLE_AUTOMATIC_WAKEUP` 변수 등록
4. B에서 커밋 → `Sync to A Repository` 성공 → A의 `wakeup.yml` 존재 확인
5. 스케줄이 필요하면 A의 `ENABLE_AUTOMATIC_WAKEUP`를 `'true'`로 설정

---

## 🧩 GitHub 설정 절차 (처음 보는 사람도 따라하기)

아래는 A/B 저장소 각각에 대해 Secrets, Variables, PAT를 어디에서 어떻게 설정하는지 클릭 순서대로 안내합니다.

### 1) A/B 저장소 구분

- A(운영) 저장소 예: `daniel-works0001/server-wakeup-bot`
- B(백업/커밋 원본) 저장소 예: `daniel-folio/server-wakeup-bot`

이 프로젝트는 B에서 커밋이 발생하면 B의 액션이 실행되어 A로 동기화하도록 설계되어 있습니다.

### 2) B 저장소에 Secrets 등록 (필수)

경로: `B 저장소 → Settings → Secrets and variables → Actions → Secrets`

등록 목록

1. `SLACK_WEBHOOK_URL`
   - 값: Slack Incoming Webhook URL (`https://hooks.slack.com/...`)
   - 발급: Slack → Apps → Incoming Webhooks → 채널 연결 → URL 복사
2. `WAKEUP_URL`
   - 값: 깨울 대상 서버의 URL (예: `https://<your-render>.onrender.com/git-wakeupbot`)
3. `A_REPO_PAT`
   - 값: Classic Personal Access Token
   - 권한(scope): `repo` (필수). 필요 시 `workflow`도 함께 체크 가능
   - 생성: GitHub 우상단 프로필 → `Settings` → `Developer settings` → `Personal access tokens (classic)` → `Generate new token (classic)`
   - 주의: 생성 직후 한 번만 전체 토큰이 보입니다. 바로 복사하여 B 저장소 Secrets에 저장하세요.

### 3) A/B 저장소에 Variables 등록 (권장)

경로: `해당 저장소 → Settings → Secrets and variables → Actions → Variables`

권장 값

- `ENABLE_AUTOMATIC_WAKEUP`
  - A(운영): `true` (스케줄 켜기)
  - B(백업): 비우거나 `false` (스케줄 끄기)
- `SERVER_ROLE`
  - A(운영): `Prod Svr` (또는 `prod` 등 명확한 라벨)
  - B(백업): `Backup Svr`

주의 사항

- `ENABLE_AUTOMATIC_WAKEUP`는 문자열 비교이므로 반드시 소문자 `'true'`여야 스케줄이 동작합니다.
- Variables는 비밀이 아닌 구성 값, Secrets는 민감 정보(URL, 토큰 등) 저장용입니다.

### 4) 워크플로 파일에서 변수 전달 확인

파일: `/.github/workflows/wakeup.yml` → `Run wakeup script` 스텝의 `env`

```yaml
env:
  SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
  WAKEUP_URL: ${{ secrets.WAKEUP_URL }}
  SERVER_ROLE: ${{ vars.SERVER_ROLE }}
```

### 5) 동기화 워크플로(B → A) 동작 확인

파일: `/.github/workflows/sync-to-a.yml`

- B에서 커밋 → 액션 실행 → rsync로 `publish/` 생성 (`sync-to-a.yml`만 제외) → plain git push로 A/main에 반영
- 테스트 절차
  1. B에서 `README.md`에 공백 한 줄 추가 후 커밋/푸시
  2. B의 Actions에서 `Sync to A Repository`가 성공했는지 확인
  3. A의 Code 탭에서 변경 파일과 `/.github/workflows/wakeup.yml` 존재 확인
  4. A의 Actions에서 `Server Wakeup`을 수동 실행하거나 스케줄 동작 확인

### 6) Render 자동 배포 연결(선택)

- A 저장소가 Render에 연결되어 있고 브랜치 트리거가 `main`이라면, B의 커밋 → A 반영 시 Render에서 자동 빌드/배포가 실행됩니다.
- Render 대시보드에서 연결 브랜치/빌드 명령을 확인하세요.