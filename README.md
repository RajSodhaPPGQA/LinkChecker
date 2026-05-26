# Link Checker - Standalone Executable Guide

## Overview
This project is a **Link Accessibility Validation Utility** that checks if URLs are accessible and takes screenshots. People can now run it by simply double-clicking a batch file - no command line knowledge needed!

## Quick Start - Two Options

### Option 1: Simple Launcher (Recommended if Node.js is installed)
**File:** `LinkChecker.bat`

1. Make sure you have **Node.js** installed on your system
2. Prepare your `urls.xlsx` file with URLs to check:
   - Column A: Client Name
   - Column B: URL
3. Place `urls.xlsx` in the same folder as `LinkChecker.bat`
4. **Double-click `LinkChecker.bat`**
5. The tool will run and create results in the `logs` folder

**System Requirements:**
- Windows 7 or later
- Node.js installed (download from https://nodejs.org/)

### Option 2: Advanced Launcher (Auto-downloads Node.js if needed)
**File:** `LinkChecker-Advanced.bat`

1. Prepare your `urls.xlsx` file with URLs to check:
   - Column A: Client Name
   - Column B: URL
2. Place `urls.xlsx` in the same folder as `LinkChecker-Advanced.bat`
3. **Double-click `LinkChecker-Advanced.bat`**
4. If Node.js is not found, it will offer to download a portable version
5. The tool will run and create results in the `logs` folder

**System Requirements:**
- Windows 7 or later
- Internet connection (if Node.js needs to be downloaded)

## Input File Format (urls.xlsx)

Your Excel file should have the following structure:

| Client Name | URL |
|---|---|
| Company A | https://example.com |
| Company B | example2.com |
| Company C | www.example3.com |

**Notes:**
- The first row is treated as a header and will be skipped
- URLs without `https://` or `http://` will be automatically prefixed with `https://`
- Both valid URLs and hyperlinked cells are supported

## Output

Results are saved in the `logs` folder, organized by date and time:
```
logs/
  2026-05-25_16-17-26/
    execution.log (detailed execution log)
    results.xlsx (results in Excel format)
    screenshots/ (browser screenshots for each URL)
```

## Features

✅ Automated link accessibility checking
✅ Browser automation with Playwright
✅ Screenshot capture for each URL
✅ Excel file input/output
✅ Detailed logging
✅ Restart browser every 50 URLs (for stability)

## Troubleshooting

### Error: "urls.xlsx file not found"
- Make sure you have created or placed a file named `urls.xlsx` in the same folder
- Check that the filename is exactly `urls.xlsx` (case-sensitive file extension)

### Error: "Node.js is not installed"
- **Option A:** Install Node.js from https://nodejs.org/ (LTS version recommended)
- **Option B:** Use `LinkChecker-Advanced.bat` instead, which can download Node.js automatically

### The script seems to hang or take a very long time
- This is normal! The tool takes screenshots of each URL, which can take time
- Each URL might take 10-30 seconds depending on page complexity
- For 100 URLs, expect 15-30 minutes of processing time

### Browser window opens and closes quickly
- This is normal - the browser is being controlled automatically
- Let the script finish; don't close any windows manually

## How It Works

1. **Reads** your Excel file (urls.xlsx)
2. **Launches** a Chromium browser (using Playwright)
3. **Visits** each URL and checks if it's accessible
4. **Captures** screenshots for documentation
5. **Logs** all results to both console and log file
6. **Exports** results to an Excel file

## System Requirements

- **OS:** Windows 7 or later (64-bit)
- **RAM:** 4GB minimum (8GB recommended)
- **Disk Space:** 500MB+ for dependencies and results
- **Internet:** Required to check URLs and (optionally) download Node.js

## Advanced Usage

### Command Line
If you prefer, you can also run from PowerShell or Command Prompt:
```
node check-links.js
```

### Custom Script Modifications
Edit `check-links.js` if you need to:
- Change browser settings
- Modify logging format
- Adjust timeout values
- Add custom validation logic

## Support & Feedback

For issues or improvements:
1. Check the execution log in `logs/[timestamp]/execution.log`
2. Verify urls.xlsx format
3. Ensure Node.js is properly installed
4. Check browser console output for specific errors

---

**Version:** 1.0  
**Last Updated:** May 26, 2026  
**Created with:** Playwright, ExcelJS, Node.js
