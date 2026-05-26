@echo off
REM LinkChecker - Link Accessibility Validation Utility
REM Simply double-click this file to run the tool

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ============================================
    echo ERROR: Node.js is not installed or not found in PATH
    echo ============================================
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo.
    pause
    exit /b 1
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
    echo.
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies... (this may take a minute)
    call npm install
)

REM Run the link checker
echo.
echo ============================================
echo Starting Link Checker...
echo ============================================
echo.

node check-links.js

echo.
echo ============================================
echo Link checking completed!
echo Check the 'logs' folder for results.
echo ============================================
echo.
pause
