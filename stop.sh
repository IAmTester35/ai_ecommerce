#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "========================================================================"
echo "                   DỪNG VÀ DỌN DẸP HỆ THỐNG AI ECOMMERCE"
echo "========================================================================"
echo

if ! docker info >/dev/null 2>&1; then
    echo "[!] Docker Desktop chưa bật hoặc không chạy. Các container có thể đã tắt sẵn."
    exit 0
fi

echo "Đang dừng và dọn dẹp toàn bộ container..."
if docker compose down; then
    echo
    echo "[+] Đã dừng toàn bộ hệ thống thành công!"
else
    echo
    echo "[!] Có lỗi xảy ra khi dừng container. Vui lòng kiểm tra Docker Desktop!"
    exit 1
fi
