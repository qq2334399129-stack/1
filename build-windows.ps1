$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Pool = Join-Path $Root "doubao-account-pool"
$Canvas = Join-Path $Root "Infinite-Canvas"

if (!(Test-Path $Pool)) { throw "找不到豆包账号池源码目录：$Pool" }
if (!(Test-Path $Canvas)) { throw "找不到大雄画布源码目录：$Canvas" }

$Node = Get-Command node -ErrorAction SilentlyContinue
$Npm = Get-Command npm -ErrorAction SilentlyContinue
if (!$Node -or !$Npm) {
  throw "请先安装 Node.js 20 或 22（安装后需包含 npm），然后重新运行本脚本。"
}

Push-Location $Pool
try {
  Write-Host "步骤 1/3：检查 Electron 项目依赖……" -ForegroundColor Cyan
  $TypeScriptBin = Join-Path $Pool "node_modules\typescript\bin\tsc"
  if (!(Test-Path $TypeScriptBin)) {
    Write-Host "未找到已安装依赖，开始执行 npm ci……" -ForegroundColor Yellow
    npm ci
    if ($LASTEXITCODE -ne 0) { throw "npm ci 失败。请检查网络和 npm registry。" }
  } else {
    Write-Host "检测到 node_modules，跳过重复安装。" -ForegroundColor Green
  }

  # Use the npmmirror Electron binary mirror for users whose access to GitHub is slow.
  $env:ELECTRON_MIRROR = "https://npmmirror.com/mirrors/electron/"
  $env:ELECTRON_BUILDER_BINARIES_MIRROR = "https://mirrors.huaweicloud.com/electron-builder-binaries/"

  Write-Host "步骤 2/3：执行 TypeScript/Vue 类型检查……" -ForegroundColor Cyan
  npm run typecheck
  if ($LASTEXITCODE -ne 0) { throw "项目类型检查失败。" }

  Write-Host "步骤 3/3：生成 Windows x64 Setup.exe……" -ForegroundColor Cyan
  npm run dist:win
  if ($LASTEXITCODE -ne 0) { throw "Windows 安装包构建失败。" }

  $Installer = Get-ChildItem (Join-Path $Pool "release") -Filter "*.exe" -File |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

  if (!$Installer) { throw "构建命令结束，但没有找到 EXE 安装包。" }
  Write-Host ""
  Write-Host "构建成功：" -ForegroundColor Green
  Write-Host $Installer.FullName -ForegroundColor Green
}
finally {
  Pop-Location
}
