#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "========================================================================"
echo "               KHOI DONG VA CAP NHAT HE THONG AI ECOMMERCE"
echo "========================================================================"
echo

prompt_yn() {
    local prompt="$1"
    local default="${2:-Y}"
    local timeout="${3:-5}"
    local choice=""

    if [ "$default" = "Y" ]; then
        printf "%s (Tu dong Y sau %ss): " "$prompt" "$timeout"
    else
        printf "%s (Tu dong N sau %ss): " "$prompt" "$timeout"
    fi

    read -t "$timeout" -n 1 -r choice || choice="$default"
    echo
    choice="${choice:-$default}"
    case "$choice" in
        [yY]) return 0 ;;
        *) return 1 ;;
    esac
}

get_choice() {
    local prompt="$1"
    local default="${2:-1}"
    local timeout="${3:-5}"
    printf "%s (Tu dong chon [%s] sau %ss): " "$prompt" "$default" "$timeout"
    read -t "$timeout" -n 1 -r SELECTED_CHOICE || SELECTED_CHOICE="$default"
    echo
    SELECTED_CHOICE="${SELECTED_CHOICE:-$default}"
}

# --------------------------------------------------------------------------
# 1. KIEM TRA VA DONG BO CODE TU GITHUB
# --------------------------------------------------------------------------
if command -v git >/dev/null 2>&1; then
    if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
        echo "[1/5] Kiem tra dong bo ma nguon tu GitHub..."
        if prompt_yn "[?] Ban co muon dong bo (pull) code moi nhat tu GitHub khong? [Y/N]" "Y" 5; then
            echo "  [i] Dang tai ma nguon moi nhat..."
            if git pull origin main 2>/dev/null || git pull; then
                echo "  [+] Dong bo code thanh cong!"
            else
                echo "  [!] Khong the dong bo tu GitHub (co the do offline hoac trung lap file)."
                echo "  [i] He thong se tiep tuc su dung ma nguon hien tai."
            fi
        else
            echo "  [i] Da bo qua dong bo tu GitHub theo yeu cau."
        fi
    else
        echo "[1/5] Thu muc khong phai Git repository. Bo qua buoc dong bo."
    fi
else
    echo "[1/5] Git chua duoc cai dat. Bo qua buoc dong bo tu GitHub."
fi
echo

# --------------------------------------------------------------------------
# 2. KIEM TRA DOCKER DAEMON (CO CO CHE HOI RETRY)
# --------------------------------------------------------------------------
echo "[2/5] Kiem tra ung dung Docker Desktop..."
while ! docker info >/dev/null 2>&1; do
    echo
    echo "[X] Docker chua duoc bat hoac Docker Desktop chua khoi dong xong!"
    echo "[i] Vui long mo ung dung Docker Desktop va cho den khi bieu tuong chuyen sang mau xanh."
    echo
    if prompt_yn "[?] Ban co muon kiem tra lai Docker khong? [Y/N]" "Y" 10; then
        echo "[i] Dang kiem tra lai ket noi Docker..."
    else
        echo "[X] Da huy khoi dong vi khong co Docker."
        exit 1
    fi
done
echo "[+] Docker Desktop dang hoat dong tot!"
echo

# --------------------------------------------------------------------------
# 3. KIEM TRA VA GIAI MA BI MAT (.ENV)
# --------------------------------------------------------------------------
echo "[3/5] Kiem tra cac file cau hinh moi truong (.env)..."
if [ -f "secrets.enc" ]; then
    if [ -f "secret.txt" ]; then
        if prompt_yn "[?] Phat hien secrets.enc. Ban co muon giai ma lai cac file .env? [Y/N]" "Y" 4; then
            echo "  [i] Dang giai ma cac file .env tu secrets.enc..."
            if [ -f "scripts/decrypt_env.sh" ]; then
                bash "scripts/decrypt_env.sh" || {
                    echo
                    echo "  [!] Giai ma khong thanh cong!"
                    if ! prompt_yn "[?] Ban co muon bo qua va dung file .env hien tai / default khong? [Y/N]" "Y" 5; then
                        echo "[X] Dung khoi dong theo yeu cau de kiem tra lai secret.txt."
                        exit 1
                    fi
                }
            fi
        else
            echo "  [i] Bo qua giai ma, su dung cac file .env hien tai."
        fi
    else
        echo "  [!] Khong tim thay file secret.txt chua khoa giai ma."
    fi
fi

# Dam bao file .env va backend/.env luon ton tai
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp ".env.example" ".env"
        echo "  [+] Da tu dong tao .env tu .env.example"
    fi
fi
if [ ! -f "backend/.env" ]; then
    if [ -f "backend/.env.example" ]; then
        cp "backend/.env.example" "backend/.env"
        echo "  [+] Da tu dong tao backend/.env tu backend/.env.example"
    fi
fi
echo "[+] Cac file cau hinh moi truong da san sang."
echo

# --------------------------------------------------------------------------
# 4. HO TRO TUONG LUA (FIREWALL) CHO MANG LAN
# --------------------------------------------------------------------------
echo "[4/5] Kiem tra cau hinh mang LAN..."
echo "  [+] Socket noi bo san sang (Port 5173, 8081, 8000)."
echo

# --------------------------------------------------------------------------
# 5. KHOI DONG DOCKER CONTAINER (VOI MENU TUY CHON RO RANG)
# --------------------------------------------------------------------------
echo "[5/5] Khoi dong cac dich vu he thong qua Docker:"
echo "  [1] Uu tien tai ban pre-build tu GitHub (Nhanh nhat, tiet kiem RAM)"
echo "  [2] Tu build truc tiep tren may nay (Dung khi khong co mang hoac loi pre-build)"
echo "  [3] Khoi chay nhanh container da ton tai tren may (Khong pull / Khong rebuild)"
echo
get_choice "[?] Chon phuong thuc [1/2/3]" "1" 5
DOCKER_MODE="$SELECTED_CHOICE"

LAUNCH_SUCCESS=0

if [ "$DOCKER_MODE" = "1" ]; then
    echo
    echo "  [i] Dang tai ban pre-build tu GitHub Container Registry..."
    if docker compose pull; then
        echo "  [+] Tai ban pre-build thanh cong! Dang khoi dong cac container..."
        if docker compose up -d; then
            LAUNCH_SUCCESS=1
        fi
    else
        echo
        echo "  [!] Khong the tai ban pre-build tu GitHub (chua public package hoac loi mang)."
    fi

    if [ "$LAUNCH_SUCCESS" -eq 0 ]; then
        echo
        if prompt_yn "[?] Ban co muon chuyen sang tu build truc tiep tren may khong? [Y/N]" "Y" 5; then
            echo "  [i] Dang build truc tiep cac container tu ma nguon..."
            if docker compose up --build -d; then
                LAUNCH_SUCCESS=1
            fi
        else
            echo "[X] Da huy khoi dong."
            exit 1
        fi
    fi
elif [ "$DOCKER_MODE" = "2" ]; then
    echo
    echo "  [i] Dang build truc tiep cac container tren may nay (co the mat vai phut)..."
    if docker compose up --build -d; then
        LAUNCH_SUCCESS=1
    fi
elif [ "$DOCKER_MODE" = "3" ]; then
    echo
    echo "  [i] Dang khoi chay nhanh cac container hien co..."
    if docker compose up -d; then
        LAUNCH_SUCCESS=1
    else
        echo
        echo "  [!] Khoi chay that bai do chua co container san co."
        if prompt_yn "[?] Ban co muon build container ngay bay gio khong? [Y/N]" "Y" 5; then
            if docker compose up --build -d; then
                LAUNCH_SUCCESS=1
            fi
        else
            echo "[X] Da huy khoi dong."
            exit 1
        fi
    fi
fi

if [ "$LAUNCH_SUCCESS" -eq 0 ]; then
    echo
    echo "========================================================================"
    echo "[X] KHOI DONG DOCKER THAT BAI!"
    echo "========================================================================"
    if prompt_yn "[?] Ban co muon xem nhat ky loi (logs) cua cac container khong? [Y/N]" "Y" 5; then
        echo
        echo "------------------------ DOCKER LOGS ------------------------"
        docker compose logs --tail=40
        echo "-------------------------------------------------------------"
    fi
    echo
    exit 1
fi

# --------------------------------------------------------------------------
# 6. KIEM TRA TRANG THAI CAC CONTAINER
# --------------------------------------------------------------------------
echo
echo "[+] Cac container he thong:"
docker compose ps

# --------------------------------------------------------------------------
# 7. TIM DIA CHI IP LAN VA HIEN THI THONG TIN TRUY CAP
# --------------------------------------------------------------------------
LAN_IP="localhost"
if [[ "$OSTYPE" == "darwin"* ]]; then
    DEF_IFACE=$(route get default 2>/dev/null | awk '/interface:/{print $2}')
    if [ -n "$DEF_IFACE" ]; then
        LAN_IP=$(ipconfig getifaddr "$DEF_IFACE" 2>/dev/null || ipconfig getifaddr en0 2>/dev/null || echo "localhost")
    else
        LAN_IP=$(ipconfig getifaddr en0 2>/dev/null || echo "localhost")
    fi
else
    LAN_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")
fi
[ -z "$LAN_IP" ] && LAN_IP="localhost"

echo
echo "========================================================================"
echo "           HE THONG AI ECOMMERCE DA KHOI DONG THANH CONG!"
echo "========================================================================"
echo " [Truy cap tren MAY TINH NAY]:"
echo "   - Ung dung Mua xe (Web):   http://localhost:8081"
echo "   - Trang Admin Dashboard:   http://localhost:5173"
echo "   - FastAPI Backend Docs:    http://localhost:8000/docs"
echo
echo " [Truy cap tren DIEN THOAI (cung mang WiFi / LAN)]:"
echo "   - Ung dung Mua xe (Web):   http://${LAN_IP}:8081"
echo "   - Trang Admin Dashboard:   http://${LAN_IP}:5173"
echo "========================================================================"
echo
