@echo off
setlocal enabledelayedexpansion

REM Create Desktop Shortcut for Link Checker
REM This script creates a shortcut on the user's desktop for easy access

title Create Link Checker Desktop Shortcut

echo.
echo ============================================
echo  Create Desktop Shortcut
echo ============================================
echo.

REM Get the current directory (where the script is)
set "SCRIPT_DIR=%~dp0"
set "SCRIPT_FILE=%SCRIPT_DIR%LinkChecker.bat"
set "DESKTOP=%USERPROFILE%\Desktop"
set "SHORTCUT=%DESKTOP%\LinkChecker.lnk"

REM Check if the LinkChecker.bat exists
if not exist "%SCRIPT_FILE%" (
    echo [!] Error: LinkChecker.bat not found in the current directory
    echo.
    pause
    exit /b 1
)

REM Create the shortcut using PowerShell
echo [*] Creating shortcut on Desktop...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$WshShell = New-Object -ComObject WScript.Shell; " ^
  "$Shortcut = $WshShell.CreateShortcut('%SHORTCUT%'); " ^
  "$Shortcut.TargetPath = '%SCRIPT_FILE%'; " ^
  "$Shortcut.WorkingDirectory = '%SCRIPT_DIR%'; " ^
  "$Shortcut.Description = 'Link Accessibility Validation Utility'; " ^
  "$Shortcut.WindowStyle = 1; " ^
  "$Shortcut.Save();"

if %ERRORLEVEL% EQU 0 (
    echo [+] Success! Desktop shortcut created
    echo.
    echo You can now find 'LinkChecker' on your Desktop
    echo Just double-click it to run the tool
) else (
    echo [!] Failed to create shortcut
    echo.
    echo You can manually create a shortcut:
    echo   1. Right-click LinkChecker.bat
    echo   2. Select "Create shortcut"
    echo   3. Move it to your Desktop
)

echo.
pause
exit /b 0
