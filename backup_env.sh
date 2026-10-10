#!/usr/bin/env bash
set -euo pipefail

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_ZIP="env_backup_${TIMESTAMP}.zip"

# Tìm tất cả file .env (loại trừ node_modules, .venv, .git)
ENV_FILES=$(find . -type f \( -name ".env*" -o -name "*.env" -o -name "*.env.*" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/.venv/*" \
  -not -path "*/.git/*")

if [ -z "$ENV_FILES" ]; then
  echo "Không tìm thấy file .env nào."
  exit 1
fi

echo "Đang nén các file .env giữ nguyên cấu trúc thư mục:"
echo "$ENV_FILES"

zip -r "$OUTPUT_ZIP" $ENV_FILES

echo "Tạo bản sao lưu thành công: $OUTPUT_ZIP"
