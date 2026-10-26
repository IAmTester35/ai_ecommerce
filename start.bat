@echo off
setlocal enabledelayedexpansion
title AI Ecommerce - Khoi dong 1-Click
cd /d %~dp0

echo ========================================================================
echo               KHOI DONG VA CAP NHAT HE THONG AI ECOMMERCE
echo ========================================================================
echo.

:: 1. Kiem tra va tu dong cai dat Git neu chua co
where git >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Git chua duoc cai dat tren may tinh.
    where choco >nul 2>&1
    if %errorlevel% equ 0 (
        echo [i] Phat hien Chocolatey. Dang tien hanh tu dong cai dat Git...
        choco install git -y --no-progress
        set "PATH=%PATH%;C:\Program Files\Git\cmd;C:\Program Files\Git\bin"
        where git >nul 2>&1
        if !errorlevel! neq 0 (
            echo [!] Da cai xong Git, vui long khoi dong lai script nay de cap nhat PATH!
            pause
            exit /b 1
        )
        echo [+] Cai dat Git thanh cong!
    ) else (
        echo [X] Khong tim thay Git hoac Chocolatey. Vui long cai dat Git: https://git-scm.com/
        pause
        exit /b 1
    )
)

:: 2. Kiem tra Docker Daemon
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] Docker chua duoc bat hoac Docker Desktop chua san sang.
    echo [i] Vui long mo ung dung Docker Desktop tren Windows roi chay lai script!
    pause
    exit /b 1
)

:: 3. Tu dong dong bo code moi nhat
git rev-parse --is-inside-work-tree >nul 2>&1
if %errorlevel% equ 0 (
    echo [1/3] Dang dong bo code moi nhat tu GitHub...
    git pull origin main 2>nul || git pull
) else (
    echo [1/3] Bo qua dong bo Git (thu muc khong phai Git repository).
)

:: 4. Tu dong giai ma .env neu may co file secret.txt
if exist "secrets.enc" (
    if exist "secret.txt" (
        echo [i] Phat hien secrets.enc va secret.txt. Dang tu dong giai ma cac file .env...
        powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\decrypt_env.ps1"
    ) else (
        echo [!] Khong tim thay file secret.txt chua khoa giai ma.
        if not exist "backend\.env" (
            if exist "backend\.env.example" copy "backend\.env.example" "backend\.env" >nul
        )
    )
) else (
    if not exist "backend\.env" (
        if exist "backend\.env.example" copy "backend\.env.example" "backend\.env" >nul
    )
)

:: 4. Ho tro tu dong cho phep Firewall cho mang LAN (neu co quyen Admin)
echo [2/3] Kiem tra cau hinh mang noi bo (Firewall)...
powershell -NoProfile -Command "if (-not (Get-NetFirewallRule -DisplayName 'AI_Ecommerce_LAN' -ErrorAction SilentlyContinue)) { try { New-NetFirewallRule -DisplayName 'AI_Ecommerce_LAN' -Direction Inbound -LocalPort 5173,8081,8000 -Protocol TCP -Action Allow -ErrorAction Stop | Out-Null; Write-Host '  [+] Da tu dong mo Firewall cho mang LAN (Port 5173, 8081, 8000).' } catch { Write-Host '  [i] Khong the tu tao Rule Firewall (Can quyen Administrator neu can thiet bi khac ket noi).' } }" 2>nul

:: 5. Khoi dong Docker: uu tien tai ban pre-build tu GitHub de tiet kiem CPU/RAM cho may
echo [3/3] Dang cap nhat va khoi dong he thong...
docker compose pull 2>nul
if %errorlevel% equ 0 (
    echo   [+] Da tai ban pre-build tu GitHub thanh cong. Dang khoi chay...
    docker compose up -d
) else (
    echo   [i] Dang build truc tiep cac container tren may...
    docker compose up --build -d
)
if %errorlevel% neq 0 (
    echo.
    echo [X] Khoi dong Docker that bai! Vui long kiem tra loi phia tren.
    pause
    exit /b 1
)

:: 6. Tim dia chi IP LAN cua may
set "LAN_IP=localhost"
for /f "tokens=*" %%i in ('powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike '*Loopback*' -and $_.IPAddress -notlike '169.254.*' -and $_.IPAddress -notlike '172.*' -and $_.IPAddress -notlike '10.*' } | Select-Object -First 1).IPAddress" 2^>nul') do set "LAN_IP=%%i"

echo.
echo ========================================================================
echo            HE THONG AI ECOMMERCE DA KHOI DONG THANH CONG!
echo ========================================================================
echo  [Truy cap tren MAY TINH NAY]:
echo    - Ung dung Mua xe (Web):   http://localhost:8081
echo    - Trang Admin Dashboard:   http://localhost:5173
echo    - FastAPI Backend Docs:    http://localhost:8000/docs
echo.
echo  [Truy cap tren DIEN THOAI (cung mang WiFi / LAN)]:
echo    - Ung dung Mua xe (Web):   http://%LAN_IP%:8081
echo    - Trang Admin Dashboard:   http://%LAN_IP%:5173
echo ========================================================================
echo.
echo Nhan phim bat ky de dong cua so nay (he thong van chay ngam)...
pause >nul
