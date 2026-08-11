#!/usr/bin/env bash
set -e

echo "=== AutoMatch AI - Test & Type Verification Script ==="

if [ -d "ecommerce-car" ]; then
    echo "[+] Running TypeScript compilation check in ecommerce-car..."
    cd ecommerce-car
    npx tsc --noEmit
    cd ..
    echo "[+] Mobile app TypeScript check passed!"
fi

echo "=== All Verification Checks Passed ==="
