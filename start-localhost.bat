@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo  브라우저 주소: http://127.0.0.1:8080/  ^(https 아님^)
echo  분석: OpenAI API — .env 파일에 OPENAI_API_KEY= 입력
echo  이 창을 닫으면 서버가 꺼집니다. 종료: Ctrl+C
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo [Node.js 없음] 이 폴더에서 install-node.bat 을 먼저 실행하세요.
  echo.
  pause
  exit /b 1
)

node -e "process.exit(Number(process.version.slice(1).split('.')[0])<18?1:0)" 2>nul
if errorlevel 1 (
  echo [버전] Node.js 18 이상이 필요합니다 ^(서버에서 fetch 사용^).
  echo install-node.bat 으로 LTS 를 설치하거나 https://nodejs.org 에서 업그레이드하세요.
  echo.
  pause
  exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
  echo [npm 없음] node server.mjs 로 실행합니다.
  node server.mjs
  exit /b %errorlevel%
)

call npm start
exit /b %errorlevel%
