@echo off
setlocal
chcp 65001 >nul
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0build-windows.ps1"
if errorlevel 1 (
  echo.
  echo BUILD FAILED. Keep this window open and send a screenshot of the final error.
  pause
  exit /b 1
)
echo.
echo BUILD COMPLETED.
pause
