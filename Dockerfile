# Node.js 최신 롱텀서포트(LTS) 가벼운 버전 채택
FROM node:18-slim

# Puppeteer 구동에 필요한 리눅스 필수 그래픽/네트워크 패키지 일괄 설치
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    procps \
    libxss1 \
    libasound2 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libgconf-2-4 \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxtst6 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 의존성 장부 복사 및 설치
COPY package*.json ./
RUN npm install

# 깃허브 액션 yml에 있던 puppeteer 크로미움 수동 빌드 명령어를 도커 레이어에 박제
RUN npx puppeteer browsers install chrome

# 소스코드 전체 카피
COPY . .

# 상시 데몬 스크립트 실행
CMD ["node", "render_wakeup.js"]