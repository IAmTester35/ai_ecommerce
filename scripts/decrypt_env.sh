#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

SECRET_FILE="${REPO_ROOT}/secret.txt"
ENC_FILE="${REPO_ROOT}/secrets.enc"

if [ ! -f "$ENC_FILE" ]; then
    echo "[X] Không tìm thấy file secrets.enc!"
    exit 1
fi

if [ ! -f "$SECRET_FILE" ]; then
    echo "[X] Không tìm thấy file secret.txt chứa khóa giải mã!"
    exit 1
fi

echo "[1/2] Đang giải mã secrets.enc bằng khóa trong secret.txt..."
openssl enc -d -aes-256-cbc -pbkdf2 -iter 100000 -pass file:"$SECRET_FILE" -in "$ENC_FILE" | tar -xf -

echo "[2/2] Giải nén toàn bộ file .env thành công!"
