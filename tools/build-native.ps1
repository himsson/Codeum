# Собирает нативные части Codeum компилятором из Android NDK:
#   native/pty.c       -> app/src/main/jniLibs/<abi>/libcodeumpty.so   (PTY для терминала)
#   native/forkshim.c  -> app/src/main/assets/forkshim-x86_64.so       (прослойка fork -> clone)
# Запуск:  powershell -File tools/build-native.ps1 [-Ndk <путь к NDK>]
param([string]$Ndk = $env:ANDROID_NDK_HOME)

if (-not $Ndk) {
    $candidates = @(
        "$env:LOCALAPPDATA\Android\Sdk\ndk",
        "C:\Program Files (x86)\Android\AndroidNDK"
    )
    foreach ($c in $candidates) {
        $found = Get-ChildItem $c -Directory -ErrorAction SilentlyContinue | Sort-Object Name -Descending | Select-Object -First 1
        if ($found) { $Ndk = $found.FullName; break }
    }
}
if (-not $Ndk) { throw "Не найден Android NDK. Укажи путь: -Ndk C:\path\to\ndk" }

$clang = Join-Path $Ndk "toolchains\llvm\prebuilt\windows-x86_64\bin\clang.exe"
$root = Split-Path $PSScriptRoot -Parent
$targets = @{
    "arm64-v8a"   = "aarch64-linux-android26"
    "armeabi-v7a" = "armv7a-linux-androideabi26"
    "x86_64"      = "x86_64-linux-android26"
    "x86"         = "i686-linux-android26"
}

foreach ($abi in $targets.Keys) {
    $out = Join-Path $root "app\src\main\jniLibs\$abi"
    New-Item -ItemType Directory -Force $out | Out-Null
    & $clang --target=$($targets[$abi]) -O2 -fPIC -shared -Wall -o "$out\libcodeumpty.so" "$root\native\pty.c"
    if ($LASTEXITCODE -ne 0) { throw "pty.c ($abi) не собрался" }
    Write-Host "libcodeumpty.so -> $abi"
}

& $clang --target=x86_64-linux-musl -O2 -fPIC -shared -nostdlib -fno-stack-protector -fuse-ld=lld "-Wl,--hash-style=both" `
    -o "$root\app\src\main\assets\forkshim-x86_64.so" "$root\native\forkshim.c"
if ($LASTEXITCODE -ne 0) { throw "forkshim.c не собрался" }
Write-Host "forkshim-x86_64.so"

