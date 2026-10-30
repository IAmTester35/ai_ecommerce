param (
    [string]$EncFile = "secrets.enc",
    [string]$SecretFile = "secret.txt"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $EncFile)) {
    Write-Host "[X] Khong tim thay file $EncFile" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $SecretFile)) {
    Write-Host "[X] Khong tim thay file $SecretFile" -ForegroundColor Yellow
    exit 1
}

$password = (Get-Content $SecretFile -Raw).Trim()
if ([string]::IsNullOrWhiteSpace($password)) {
    Write-Host "[X] File $SecretFile rong!" -ForegroundColor Red
    exit 1
}

# 1. Thu dung openssl truoc neu co san tu Git
$openssl = Get-Command openssl -ErrorAction SilentlyContinue
if (-not $openssl) {
    $gitCmd = Get-Command git -ErrorAction SilentlyContinue
    if ($gitCmd) {
        $gitDir = Split-Path (Split-Path $gitCmd.Source -Parent) -Parent
        $candidate = Join-Path $gitDir "usr\bin\openssl.exe"
        if (Test-Path $candidate) {
            $openssl = $candidate
        }
    }
}

if ($openssl) {
    Write-Host "[i] Dang giai ma bang OpenSSL..." -ForegroundColor Cyan
    $tempTar = [System.IO.Path]::GetTempFileName()
    & $openssl enc -d -aes-256-cbc -pbkdf2 -iter 100000 -pass "file:$SecretFile" -in $EncFile -out $tempTar
    tar -xf $tempTar
    Remove-Item -Force $tempTar
    Write-Host "[+] Giai ma va khoi phuc toan bo file .env thanh cong!" -ForegroundColor Green
    exit 0
}

# 2. Fallback sang pure .NET AES-256-CBC PBKDF2 neu khong co openssl
Write-Host "[i] Dang giai ma bang PowerShell .NET..." -ForegroundColor Cyan
$encBytes = [System.IO.File]::ReadAllBytes((Resolve-Path $EncFile))
if ($encBytes.Length -lt 16 -or [System.Text.Encoding]::ASCII.GetString($encBytes, 0, 8) -ne "Salted__") {
    Write-Host "[X] Dinh dang file $EncFile khong hop le!" -ForegroundColor Red
    exit 1
}

$salt = $encBytes[8..15]
$cipherBytes = $encBytes[16..($encBytes.Length - 1)]
$passBytes = [System.Text.Encoding]::UTF8.GetBytes($password)

$kdf = New-Object System.Security.Cryptography.Rfc2898DeriveBytes($passBytes, $salt, 100000, [System.Security.Cryptography.HashAlgorithmName]::SHA256)
$key = $kdf.GetBytes(32)
$iv = $kdf.GetBytes(16)

$aes = [System.Security.Cryptography.Aes]::Create()
$aes.Key = $key
$aes.IV = $iv
$aes.Mode = [System.Security.Cryptography.CipherMode]::CBC
$aes.Padding = [System.Security.Cryptography.PaddingMode]::PKCS7

$dec = $aes.CreateDecryptor()
$tarBytes = $dec.TransformFinalBlock($cipherBytes, 0, $cipherBytes.Length)

$tempTar = [System.IO.Path]::GetTempFileName()
[System.IO.File]::WriteAllBytes($tempTar, $tarBytes)

tar -xf $tempTar
Remove-Item -Force $tempTar

Write-Host "[+] Giai ma va khoi phuc toan bo file .env thanh cong!" -ForegroundColor Green
