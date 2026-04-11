@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo === Node.js LTS 설치 (DistanceReply 분석 서버용) ===
echo.

where node >nul 2>&1
if not errorlevel 1 (
  echo 이미 설치됨:
  node -v
  where npm >nul 2>&1
  if not errorlevel 1 npm -v
  echo.
  echo 추가 설치가 필요 없으면 이 창을 닫고 start-localhost.bat 을 실행하세요.
  pause
  exit /b 0
)

where winget >nul 2>&1
if errorlevel 1 (
  echo winget 을 찾을 수 없습니다. 브라우저에서 Node.js LTS 를 받아 설치하세요.
  start "" "https://nodejs.org/ko/download"
  pause
  exit /b 1
)

echo winget 으로 OpenJS.NodeJS.LTS 설치를 시도합니다...
winget install -e --id OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
if errorlevel 1 (
  echo.
  echo 자동 설치가 실패했을 수 있습니다. 아래 페이지에서 LTS 설치 파일을 받으세요.
  start "" "https://nodejs.org/ko/download"
  pause
  exit /b 1
)

echo.
echo 설치가 끝나면 이 창을 닫고, 새 터미널을 연 뒤 proto 폴더에서 start-localhost.bat 을 다시 실행하세요.
echo ^(PATH 반영을 위해 터미널을 새로 여는 것이 중요합니다.^)
pause
exit /b 0
