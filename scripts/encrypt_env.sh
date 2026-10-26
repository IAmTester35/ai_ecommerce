#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

SECRET_FILE="${REPO_ROOT}/secret.txt"
ENC_FILE="${REPO_ROOT}/secrets.enc"

# 1. Kiểm tra hoặc tự tạo secret.txt nếu chưa có
if [ ! -f "$SECRET_FILE" ]; then
    echo "[i] Chưa có secret.txt. Đang tạo khóa AES-256 ngẫu nhiên..."
    openssl rand -base64 24 | tr -d '\r\n' > "$SECRET_FILE"
    chmod 600 "$SECRET_FILE"
    echo "[+] Đã tạo file secret.txt thành công! (Lưu ý: File này đã nằm trong .gitignore)"
fi

# 2. Tìm tất cả file .env (loại trừ node_modules, .venv, .git, .example)
ENV_FILES=$(find . -type f \( -name ".env" -o -name ".env.local" \) \
    -not -path "*/node_modules/*" \
    -not -path "*/.venv/*" \
    -not -path "*/.git/*" \
    -not -name "*.example" | sort)

if [ -z "$ENV_FILES" ]; then
    echo "[!] Không tìm thấy file .env nào để mã hóa."
    exit 0
fi

echo "[1/2] Đang đóng gói các file .env:"
for f in $ENV_FILES; do
    echo "  -> $f"
done

# 3. Nén và mã hóa bằng AES-256-CBC PBKDF2 (100,000 iterations)
tar -cf - $ENV_FILES | openssl enc -aes-256-cbc -pbkdf2 -iter 100000 -salt -pass file:"$SECRET_FILE" -out "$ENC_FILE"

echo "[2/2] Mã hóa AES-256 thành công: secrets.enc"
echo "========================================================================"
echo " ĐÃ CẬP NHẬT: secrets.enc"
echo " Bạn chỉ cần gửi duy nhất file 'secret.txt' cho user tin cậy."
echo "========================================================================"
