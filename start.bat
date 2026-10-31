@echo off
setlocal enabledelayedexpansion
title AI Ecommerce - Khoi dong he thong 1-Click
cd /d %~dp0

echo ========================================================================
echo               KHOI DONG VA CAP NHAT HE THONG AI ECOMMERCE
echo ========================================================================
echo.

:: --------------------------------------------------------------------------
:: 1. KIEM TRA VA DONG BO CODE TU GITHUB
:: --------------------------------------------------------------------------
where git >nul 2>&1
if !errorlevel! equ 0 (
    git rev-parse --is-inside-work-tree >nul 2>&1
    if !errorlevel! equ 0 (
        echo [1/5] Kiem tra dong bo ma nguon tu GitHub...
        choice /c YN /t 5 /d Y /m "[?] Ban co muon dong bo (pull) code moi nhat tu GitHub khong? [Y/N] (Tu dong Y sau 5s): "
        if !errorlevel! equ 1 (
            echo   [i] Dang tai ma nguon moi nhat...
            git pull origin master 2>nul || git pull origin main 2>nul || git pull
            if !errorlevel! equ 0 (
                echo   [+] Dong bo code thanh cong!
            ) else (
                echo   [!] Khong the dong bo tu GitHub (co the do offline hoac trung lap file).
                echo   [i] He thong se tiep tuc su dung ma nguon hien tai.
            )
        ) else (
            echo   [i] Da bo qua dong bo tu GitHub theo yeu cau.
        )
    ) else (
        echo [1/5] Thu muc khong phai Git repository. Bo qua buoc dong bo.
    )
) else (
    echo [1/5] Git chua duoc cai dat tren may. Bo qua buoc dong bo tu GitHub.
)
echo.

:: --------------------------------------------------------------------------
:: 2. KIEM TRA DOCKER DAEMON (CO CO CHE HOI RETRY)
:: --------------------------------------------------------------------------
echo [2/5] Kiem tra ung dung Docker Desktop...
:check_docker
docker info >nul 2>&1
if !errorlevel! equ 0 goto docker_ready

echo.
echo [X] Docker chua duoc bat hoac Docker Desktop chua khoi dong xong!
echo [i] Vui long mo ung dung Docker Desktop tren Windows va cho den khi bieu tuong chuyen sang mau xanh.
echo.
choice /c YN /t 10 /d Y /m "[?] Ban co muon kiem tra lai Docker khong? [Y/N] (Tu dong thu lai sau 10s): "
if !errorlevel! equ 1 (
    echo [i] Dang kiem tra lai ket noi Docker...
    goto check_docker
)
echo [X] Da huy khoi dong vi khong co Docker.
pause
exit /b 1

:docker_ready
echo [+] Docker Desktop dang hoat dong tot!
echo.

:: --------------------------------------------------------------------------
:: 3. KIEM TRA VA GIAI MA BI MAT (.ENV)
:: --------------------------------------------------------------------------
echo [3/5] Kiem tra cac file cau hinh moi truong (.env)...
if exist "secrets.enc" (
    if exist "secret.txt" (
        choice /c YN /t 4 /d Y /m "[?] Phat hien secrets.enc. Ban co muon giai ma lai cac file .env? [Y/N] (Tu dong Y sau 4s): "
        if !errorlevel! equ 1 (
            echo   [i] Dang giai ma cac file .env tu secrets.enc...
            powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\decrypt_env.ps1"
            if !errorlevel! neq 0 (
                echo.
                echo   [!] Giai ma khong thanh cong!
                choice /c YN /m "[?] Ban co muon bo qua va dung file .env hien tai / default khong? [Y/N]: "
                if !errorlevel! equ 2 (
                    echo [X] Dung khoi dong theo yeu cau de kiem tra lai secret.txt.
                    pause
                    exit /b 1
                )
            )
        ) else (
            echo   [i] Bo qua giai ma, su dung cac file .env hien tai.
        )
    ) else (
        echo   [!] Khong tim thay file secret.txt chua khoa giai ma.
    )
)

:: Dam bao file .env va backend\.env luon ton tai
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo   [+] Da tu dong tao .env tu .env.example
    )
)
if not exist "backend\.env" (
    if exist "backend\.env.example" (
        copy "backend\.env.example" "backend\.env" >nul
        echo   [+] Da tu dong tao backend\.env tu backend\.env.example
    )
)
echo [+] Cac file cau hinh moi truong da san sang.
echo.

:: --------------------------------------------------------------------------
:: 4. HO TRO TUONG LUA (FIREWALL) CHO MANG LAN
:: --------------------------------------------------------------------------
echo [4/5] Kiem tra cau hinh Tuong lua (Firewall) cho mang LAN...
powershell -NoProfile -Command "if (-not (Get-NetFirewallRule -DisplayName 'AI_Ecommerce_LAN' -ErrorAction SilentlyContinue)) { try { New-NetFirewallRule -DisplayName 'AI_Ecommerce_LAN' -Direction Inbound -LocalPort 5173,8081,8000 -Protocol TCP -Action Allow -ErrorAction Stop | Out-Null; Write-Host '  [+] Da mo Firewall cho mang LAN (Port 5173, 8081, 8000).' } catch { Write-Host '  [i] Khong the tu tao Rule Firewall (Can quyen Administrator neu can thiet bi khac ket noi).' } }" 2>nul
echo.

:: --------------------------------------------------------------------------
:: 5. KHOI DONG DOCKER CONTAINER (VOI MENU TUY CHON RO RANG)
:: --------------------------------------------------------------------------
echo [5/5] Khoi dong cac dich vu he thong qua Docker:
echo   [1] Uu tien tai ban pre-build tu GitHub (Nhanh nhat, tiet kiem RAM)
echo   [2] Tu build truc tiep tren may nay (Dung khi khong co mang hoac loi pre-build)
echo   [3] Khoi chay nhanh container da ton tai tren may (Khong pull / Khong rebuild)
echo.
choice /c 123 /t 5 /d 1 /m "[?] Chon phuong thuc [1/2/3] (Tu dong chon [1] sau 5s): "
set "DOCKER_MODE=!errorlevel!"

set "LAUNCH_SUCCESS=0"

if "!DOCKER_MODE!"=="1" (
    echo.
    echo   [i] Dang tai ban pre-build tu GitHub Container Registry...
    docker compose pull
    if !errorlevel! equ 0 (
        echo   [+] Tai ban pre-build thanh cong! Dang khoi dong cac container...
        docker compose up -d
        if !errorlevel! equ 0 set "LAUNCH_SUCCESS=1"
    ) else (
        echo.
        echo   [!] Khong the tai ban pre-build tu GitHub (chua public package hoac loi mang).
    )

    if "!LAUNCH_SUCCESS!"=="0" (
        echo.
        choice /c YN /t 5 /d Y /m "[?] Ban co muon chuyen sang tu build truc tiep tren may khong? [Y/N] (Tu dong Y sau 5s): "
        if !errorlevel! equ 1 (
            echo   [i] Dang build truc tiep cac container tu ma nguon...
            docker compose up --build -d
            if !errorlevel! equ 0 set "LAUNCH_SUCCESS=1"
        ) else (
            echo [X] Da huy khoi dong.
            pause
            exit /b 1
        )
    )
)

if "!DOCKER_MODE!"=="2" (
    echo.
    echo   [i] Dang build truc tiep cac container tren may nay (co the mat vai phut)...
    docker compose up --build -d
    if !errorlevel! equ 0 set "LAUNCH_SUCCESS=1"
)

if "!DOCKER_MODE!"=="3" (
    echo.
    echo   [i] Dang khoi chay nhanh cac container hien co...
    docker compose up -d
    if !errorlevel! equ 0 (
        set "LAUNCH_SUCCESS=1"
    ) else (
        echo.
        echo   [!] Khoi chay that bai do chua co container san co.
        choice /c YN /m "[?] Ban co muon build container ngay bay gio khong? [Y/N]: "
        if !errorlevel! equ 1 (
            docker compose up --build -d
            if !errorlevel! equ 0 set "LAUNCH_SUCCESS=1"
        ) else (
            echo [X] Da huy khoi dong.
            pause
            exit /b 1
        )
    )
)

if "!LAUNCH_SUCCESS!"=="0" (
    echo.
    echo ========================================================================
    echo [X] KHOI DONG DOCKER THAT BAI!
    echo ========================================================================
    choice /c YN /m "[?] Ban co muon xem nhat ky loi (logs) cua cac container khong? [Y/N]: "
    if !errorlevel! equ 1 (
        echo.
        echo ------------------------ DOCKER LOGS ------------------------
        docker compose logs --tail=40
        echo -------------------------------------------------------------
    )
    echo.
    pause
    exit /b 1
)

:: --------------------------------------------------------------------------
:: 6. KIEM TRA TRANG THAI CAC CONTAINER
:: --------------------------------------------------------------------------
echo.
echo [+] Cac container he thong:
docker compose ps

:: --------------------------------------------------------------------------
:: 7. TIM DIA CHI IP LAN VA HIEN THI THONG TIN TRUY CAP
:: --------------------------------------------------------------------------
set "LAN_IP=localhost"
for /f "tokens=*" %%i in ('powershell -NoProfile -Command "$ip = (Get-NetRoute -DestinationPrefix '0.0.0.0/0' -ErrorAction SilentlyContinue | Sort-Object { $_.RouteMetric + $_.InterfaceMetric } | Select-Object -First 1 | Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue).IPAddress; if (-not $ip) { $ip = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.InterfaceAlias -notlike '*Loopback*' -and $_.InterfaceAlias -notlike '*vEthernet*' -and $_.InterfaceAlias -notlike '*Virtual*' -and $_.IPAddress -notlike '169.254.*' } | Select-Object -First 1).IPAddress }; if ($ip) { $ip } else { 'localhost' }" 2^>nul') do set "LAN_IP=%%i"

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
