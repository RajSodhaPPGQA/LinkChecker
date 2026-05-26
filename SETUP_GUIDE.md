# Setup Instructions for Link Checker

## For Non-Technical Users - Step by Step

### What You'll Need
- A Windows computer
- An Excel file with URLs to check (see format below)
- 30-60 minutes (depending on how many URLs)

---

## STEP 1: Prepare Your URLs File

1. Open **Microsoft Excel** (or Google Sheets, or any spreadsheet program)
2. Create a new spreadsheet
3. In the **first row**, add headers:
   - Column A: `Client Name`
   - Column B: `URL`

4. Starting from **row 2**, enter your data:

| Client Name | URL |
|---|---|
| Google | https://google.com |
| OpenAI | chatgpt.com |
| Microsoft | microsoft.com |

5. **Save the file** in the same folder as the batch files with the name: `urls.xlsx`

**Important:** 
- The file MUST be named exactly `urls.xlsx`
- Acceptable URL formats:
  - `https://example.com` ✓
  - `example.com` ✓ (will be converted to https://example.com)
  - `www.example.com` ✓
  - `example.com/path/page.html` ✓

---

## STEP 2: Install Node.js (if you don't have it)

### Check if you already have Node.js:
1. Press **Windows Key + R**
2. Type: `cmd` and press Enter
3. Type: `node --version` and press Enter
4. If you see a version number (like `v20.11.0`), **you already have it** - skip to Step 3

### If you don't have Node.js:
1. Go to **https://nodejs.org/**
2. Download the **LTS (Long Term Support)** version
3. Run the installer and follow the prompts
4. Restart your computer

---

## STEP 3: Run the Link Checker

### Option A: Simple Way (if Node.js is installed)
1. Make sure `urls.xlsx` is in the folder with the batch files
2. **Double-click `LinkChecker.bat`**
3. A command window will appear and start processing
4. Wait for it to finish (this may take 10-30 minutes depending on number of URLs)

### Option B: Automatic Way (doesn't need Node.js installed)
1. Make sure `urls.xlsx` is in the folder with the batch files
2. **Double-click `LinkChecker-Advanced.bat`**
3. If prompted, choose "Y" to automatically download Node.js
4. Wait for processing to complete

---

## OPTIONAL: Configure Runtime Settings

If you want to change behavior without editing the script, use `config.json` in the same folder as `check-links.js`.

A default `config.json` will be created automatically if it is missing.

Supported settings include:
- `inputFile`: input Excel filename (default `urls.xlsx`)
- `logsFolder`: destination folder for log runs (default `logs`)
- `outputFilePrefix`: output workbook prefix (default `results`)
- `timeout`: navigation timeout in milliseconds
- `retryCount`: number of navigation retries
- `captureScreenshots`: `true` or `false`
- `browserRestartThreshold`: restart browser after this many URLs
- `warnOnHttp`: show warnings for `http://` URLs

---

## STEP 4: Check Your Results

Results are saved in the **`logs`** folder by default:

```
logs/
  └─ 2026-05-26_16-13-02/          ← Latest run with date/time
      ├─ execution.log              ← Detailed log of what happened
      ├─ results_2026-05-26_16-13-02.xlsx ← Results in Excel format
      └─ screenshots/               ← Screenshots of each page
          ├─ Google.png
          ├─ ChatGPT.png
          └─ ... more images ...
```

The output filename is configurable with `outputFilePrefix` in `config.json`.

### Results File (results.xlsx)
The Excel file contains columns for each URL showing:
- **Status**: ACCESSIBLE or RESTRICTED
- **Final URL**: Where it ended up
- **Screenshot**: Whether a screenshot was taken
- **Timestamp**: When it was checked

---

## CREATING A DESKTOP SHORTCUT (Optional)

### To make it easier to run:

1. **Right-click on `LinkChecker.bat`**
2. Select **"Create shortcut"**
3. A new file `LinkChecker.bat - Shortcut.lnk` will be created
4. You can move this shortcut to:
   - Your **Desktop** (for quick access)
   - Your **Start Menu**
   - Your **Taskbar** (drag and drop)

---

## TROUBLESHOOTING

### Problem: "urls.xlsx file not found"
**Solution:**
- Make sure the file is named exactly `urls.xlsx` (with `.xlsx` extension)
- Make sure it's in the same folder as the batch files
- It should be visible in the folder

### Problem: "Node.js is not installed"
**Solution:**
- Use `LinkChecker-Advanced.bat` instead (it downloads Node.js automatically)
- OR manually install from https://nodejs.org/

### Problem: Nothing is happening / blank window appears
**Solution:**
- Wait! The script might still be working
- It can take 10-30 seconds per URL
- Don't close the window until you see "Press any key to continue"
- The script will open the final Excel report automatically when it finishes on Windows

### Problem: "The batch file won't open"
**Solution:**
- Make sure you're double-clicking (not right-clicking)
- Make sure the file isn't corrupted
- Try right-click → "Open" or "Run with" → Command Prompt

### Problem: Error about permissions
**Solution:**
- Run the batch file as Administrator:
  1. Right-click the `.bat` file
  2. Select "Run as administrator"
  3. Click "Yes" if prompted

---

## FREQUENTLY ASKED QUESTIONS

### Q: How long will it take?
**A:** Usually 10-30 seconds per URL, plus setup time. So 100 URLs = 20-50 minutes.

### Q: Can I close the window while it's running?
**A:** No! Let it finish. It will tell you when it's done.

### Q: Why does a browser window open?
**A:** The tool uses a real browser (Chromium) to check pages, just like you do. It's automated, so you can't interact with it.

### Q: Can I edit urls.xlsx while it's running?
**A:** No. Wait until it finishes, then you can edit for the next run.

### Q: What if a URL doesn't work properly?
**A:** Check the screenshot and log file. The tool will tell you if a page requires login, returns an error, etc.

### Q: Can I use this on Mac or Linux?
**A:** Yes! This guide is for Windows batch files, but the core tool (`check-links.js`) works on all systems. Adapt the batch file commands for your OS.

### Q: Is my data private?
**A:** Yes! Everything runs on your computer. No data is sent anywhere unless it's to the URLs being checked.

---

## GETTING HELP

If something goes wrong:
1. **Check the log file**: `logs/[date-time]/execution.log`
2. **Read the error message** carefully
3. **Check this guide** for solutions
4. **Try running as Administrator**

---

## ADVANCED USERS

### Running from Command Line:
```
node check-links.js
```

### Editing Settings:
Edit `check-links.js` to:
- Change browser settings
- Adjust timeout values
- Modify screenshot behavior
- Add custom validation logic

### Batch Operations:
Create a batch script to run the tool on a schedule:
```batch
@echo off
cd /d "%~dp0"
node check-links.js
```

---

**Version:** 1.0  
**Last Updated:** May 26, 2026  
**Support:** Check README.md for more information
