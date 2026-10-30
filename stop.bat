@echo off
title AI Ecommerce - Dung he thong
cd /d %~dp0

docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Docker Desktop chua bat hoac khong chay. Cac container co the da tat san.
    pause
    exit /b 0
)

echo Dang dung va don dep toan bo container...
docker compose down
if %errorlevel% equ 0 (
    echo.
    echo [+] Da dung toan bo he thong thanh cong!
) else (
    echo.
    echo [!] Co loi xay ra khi dung container. Vui long kiem tra Docker Desktop!
)
pause
