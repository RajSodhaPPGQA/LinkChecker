@echo off
setlocal enabledelayedexpansion

REM LinkChecker - Advanced Launcher with Node.js Auto-Download
REM This file will attempt to run the Link Checker and automatically download
REM a portable Node.js if one is not found in the system

title Link Checker - Launcher

REM Color codes for output
color 0A

echo.
echo ============================================
echo    LINK CHECKER - Launcher
echo    Link Accessibility Validation Utility
echo ============================================
echo.

REM Check if Node.js is available
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    if exist "%~dp0node-portable\node.exe" (
        set "PATH=%~dp0node-portable;%PATH%"
    ) else (
        echo [!] Node.js not found in PATH
        echo.
        echo Would you like to download a portable Node.js?
        echo (This will be extracted to the current folder)
        echo.
        set /p download="Download portable Node.js? (Y/N): "
        
        if /i "!download!"=="Y" (
            call :DownloadPortableNode
        ) else (
            echo.
            echo ERROR: Node.js is required to run Link Checker
            echo Please install Node.js from: https://nodejs.org/
            echo.
            pause
            exit /b 1
        )
    )
)

REM Change to script directory
cd /d "%~dp0"

REM Check if urls.xlsx exists
if not exist "urls.xlsx" (
    echo.
    echo ============================================
    echo ERROR: urls.xlsx file not found
    echo ============================================
    echo.
    echo Please make sure urls.xlsx is in the same folder as this script.
    echo The file should contain:
    echo   Column A: Client Name
    echo   Column B: URL
    echo.
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo [*] Installing dependencies... (this may take a minute)
    call npm install
    if !ERRORLEVEL! NEQ 0 (
        echo.
        echo ERROR: Failed to install dependencies
        echo.
        pause
        exit /b 1
    )
)

REM Run the link checker
echo.
echo ============================================
echo [*] Starting Link Checker...
echo ============================================
echo.

node check-links.js

echo.
echo ============================================
echo [+] Link checking completed!
echo [*] Check the 'logs' folder for results.
echo ============================================
echo.
pause
exit /b 0

:DownloadPortableNode
echo.
echo [*] Downloading Node.js v20.11.0 (portable)...
echo.

REM Create a temp directory for download
if not exist "%TEMP%\node-download" mkdir "%TEMP%\node-download"

REM Download Node.js portable binary
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $ProgressPreference = 'SilentlyContinue'; Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.11.0/node-v20.11.0-win-x64.zip' -OutFile '%TEMP%\node-download\node.zip' -ErrorAction Stop; Write-Host '[+] Downloaded successfully' } catch { Write-Host '[!] Download failed'; exit 1 }"

if !ERRORLEVEL! NEQ 0 (
    echo [!] Failed to download Node.js
    echo.
    pause
    exit /b 1
)

REM Extract the zip file
echo [*] Extracting Node.js...
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Expand-Archive -Path '%TEMP%\node-download\node.zip' -DestinationPath '%CD%\node-portable' -Force -ErrorAction Stop; Write-Host '[+] Extracted successfully' } catch { Write-Host '[!] Extraction failed'; exit 1 }"

if !ERRORLEVEL! NEQ 0 (
    echo [!] Failed to extract Node.js
    echo.
    pause
    exit /b 1
)

REM Move the node folder contents up one level
setlocal
set SOURCE=%CD%\node-portable\node-v20.11.0-win-x64
set DEST=%CD%\node-portable
if exist "%SOURCE%" (
    for /D %%A in ("%SOURCE%\*") do (
        move "%%A" "%DEST%\" >nul
    )
    for %%A in ("%SOURCE%\*") do (
        move "%%A" "%DEST%\" >nul
    )
    rmdir "%SOURCE%" >nul 2>&1
)
endlocal

REM Add to PATH
set "PATH=%CD%\node-portable;%PATH%"

REM Clean up download
rmdir /s /q "%TEMP%\node-download" >nul 2>&1

echo [+] Node.js portable installed successfully!
echo.

exit /b 0
