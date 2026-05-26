# Link Checker - Standalone Distribution Package

## 📦 What's Inside

This folder contains everything needed to run the Link Checker as a standalone application on Windows.

### Files Overview

#### 🚀 Main Application Files
- **`LinkChecker.bat`** - Simple launcher (requires Node.js installed)
- **`LinkChecker-Advanced.bat`** - Smart launcher (auto-downloads Node.js if needed)
- **`Create-Shortcut.bat`** - Helper to create desktop shortcuts
- **`check-links.js`** - The main application script
- **`package.json`** - Dependencies configuration
- **`package-lock.json`** - Locked dependency versions

#### 📚 Documentation
- **`README.md`** - Quick start guide and features overview
- **`SETUP_GUIDE.md`** - Detailed step-by-step setup instructions for non-technical users
- **`DISTRIBUTION.md`** - This file (guide for sharing/deploying)

#### 📊 User Data
- **`urls.xlsx`** - Sample input file (users replace with their own)
- **`logs/`** - Folder where all results are saved (organized by date/time)

#### 📦 Dependencies
- **`node_modules/`** - All npm packages (playwright, exceljs, etc.)

---

## 🎯 Quick Start for End Users

### Absolute Simplest Way
1. Place their `urls.xlsx` file in this folder
2. **Double-click `LinkChecker.bat`**
3. Wait for results in the `logs` folder

OR if they don't have Node.js:
1. Place their `urls.xlsx` file in this folder
2. **Double-click `LinkChecker-Advanced.bat`**
3. Let it download Node.js automatically
4. Wait for results in the `logs` folder

---

## 📋 How to Distribute This Project

### Option 1: Simple Copy (Easiest)
1. Copy the entire LinkChecker folder
2. Users just double-click `LinkChecker.bat` or `LinkChecker-Advanced.bat`
3. No installation or setup required!

### Option 2: Create an Installer
To create a Windows installer (advanced):
```bash
# Install NSIS (Nullsoft Scriptable Install System)
# Create a .nsi file with installer configuration
# Build the .exe installer
```

### Option 3: Distribute via ZIP
1. Create a ZIP file of the folder
2. Users extract it
3. Users double-click the batch file

### Option 4: Create a Standalone EXE (Advanced)
Currently, there are limitations with bundling Node.js + Playwright at Node.js 24.x. 

Workaround options:
- Use `LinkChecker-Advanced.bat` (auto-downloads Node.js)
- Downgrade to Node.js 20 and use `pkg` or `nexe`
- Use Docker containerization

---

## 🔧 Deployment Scenarios

### Scenario 1: Individual User
**Best approach:** Simple Copy
- Copy the folder to their computer
- They double-click `LinkChecker.bat`
- Done!

### Scenario 2: Multiple Users in an Organization
**Best approach:** Distribute ZIP + Instructions
1. Create a ZIP file with the folder
2. Send SETUP_GUIDE.md separately
3. Users extract ZIP and follow guide
4. Users can create desktop shortcuts with `Create-Shortcut.bat`

### Scenario 3: Corporate Deployment
**Best approach:** Group Policy or Software Distribution
1. Package the folder as MSI or EXE installer (using NSIS)
2. Deploy via Group Policy or SCCM
3. Users have it pre-installed
4. Documentation available in Help section

### Scenario 4: Shared Network Drive
**Best approach:** Centralized Access
1. Place the folder on a shared network drive
2. Create shortcuts on each user's desktop pointing to the network location
3. No installation needed on individual machines
4. Updates are centralized

---

## 💼 For IT Administrators

### System Requirements
- **OS:** Windows 7 or later (64-bit)
- **Disk Space:** 500MB+ (for Node.js + dependencies)
- **RAM:** 4GB minimum, 8GB recommended
- **Internet:** Required for URL checking (and optional for downloading Node.js)
- **No elevation required** for normal use (unless you're in a locked-down environment)

### Network Configuration
The application needs outbound access to:
- URLs being checked (HTTP/HTTPS ports 80, 443)
- nodejs.org (if using Advanced launcher and Node.js not installed)
- GitHub (for downloading Node.js releases)

### Silent Installation
Users can run without prompts:
```batch
LinkChecker.bat
```
(Will still prompt for Node.js download if missing)

For fully silent operation, pre-install Node.js on all machines.

### Centralized Results Storage
Modify the script to save results to a network drive:
```javascript
// Edit check-links.js, change:
const runFolder = path.join('logs', runTimestamp);
// To:
const runFolder = path.join('\\\\servername\\share\\link-checker-logs', runTimestamp);
```

---

## 🆘 Troubleshooting for Distributors

### Issue: "Users say the batch file won't open"
**Solution:**
- Check Windows Execution Policy
- Might need Group Policy change to allow batch files
- Alternative: Rename .bat to .cmd (same thing, sometimes works better)

### Issue: "Some users can't download Node.js"
**Solution:**
- Pre-install Node.js on all machines
- Or host Node.js on internal download server
- Modify the Advanced batch file to use internal URL

### Issue: "Results aren't saving properly"
**Solution:**
- Check folder permissions
- Make sure the folder is writable
- Check available disk space
- Review execution.log for errors

### Issue: "Antivirus is blocking it"
**Solution:**
- This is common with dynamic script execution
- Users may need to whitelist Node.js
- Corporate antivirus might need policy exceptions
- Consider creating a signed executable

---

## 📈 Customization

### Customize Appearance
Edit `LinkChecker.bat`:
- Change the color (search "color 0A")
- Change the title
- Modify messages and prompts

### Customize Behavior
Edit `check-links.js`:
- Change screenshot options
- Adjust timeout values
- Modify logging format
- Add custom validation

### Add Company Branding
Add a banner or logo to the batch file:
```batch
@echo off
echo.
echo ============================================
echo    YOUR COMPANY NAME - Link Checker
echo    Version 1.0
echo ============================================
echo.
```

---

## 🔐 Security Considerations

- **User Data:** All data stays on the user's computer
- **No Cloud:** Results are saved locally, not transmitted
- **SSL/TLS:** URLs are checked securely
- **Credentials:** The tool cannot handle authentication (shows redirects to login instead)
- **Sensitive URLs:** Be careful with login URLs; they'll be checked publicly
- **Source Code:** Open source (check-links.js), fully transparent

---

## 📞 Support & Updates

### For Users
- Provide them with SETUP_GUIDE.md
- Check README.md for common issues

### For Developers
- Consult check-links.js for code
- Review package.json for dependencies
- Check Node.js / Playwright documentation

### Version Updates
To update:
1. Update `check-links.js` with new features
2. Update `package.json` if changing dependencies
3. Run `npm install` to update node_modules
4. Test thoroughly
5. Redeploy to users

---

## 📝 License & Attribution

- **playwright:** Apache 2.0
- **exceljs:** MIT
- **Node.js:** MIT / Custom

Check `node_modules` for full license details.

---

## 🎓 Advanced Topics

### Batch Processing
Create multiple input files and process them:
```batch
@echo off
node check-links.js urls1.xlsx
node check-links.js urls2.xlsx
node check-links.js urls3.xlsx
```

### Scheduled Tasks
Use Windows Task Scheduler:
1. Open Task Scheduler
2. Create Basic Task
3. Set trigger (daily, weekly, etc.)
4. Set action to run `LinkChecker.bat`

### Email Results
Modify batch file to email results:
```batch
REM After completion, email the results folder
REM (requires mail server configuration)
```

### Web Interface
For advanced use, create a web interface:
1. Build Express.js server
2. Frontend for uploading URLs
3. Backend runs check-links.js
4. Results displayed on web page

---

**Created:** May 26, 2026  
**Current Version:** 1.0  
**Node.js Version:** 20+  
**Playwright Version:** 1.53.0+

Questions or improvements? Check the README or SETUP_GUIDE files!
