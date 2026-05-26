const { chromium } = require('playwright');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

// =====================================
// START TIMER
// =====================================

const executionStartTime = Date.now();

const TOOL_VERSION = '1.0';

const defaultConfig = {
    headless: false,
    inputFile: 'urls.xlsx',
    logsFolder: 'logs',
    outputFilePrefix: 'results',
    timeout: 60000,
    retryCount: 2,
    waitAfterLoad: 15000,
    cookieClickTimeout: 3000,
    screenshotTimeout: 10000,
    captureScreenshots: true,
    browserRestartThreshold: 50,
    warnOnHttp: true
};

const configPath = path.join(process.cwd(), 'config.json');
let config = { ...defaultConfig };
let configWarnings = [];

if (fs.existsSync(configPath)) {
    try {
        const loadedConfig = JSON.parse(fs.readFileSync(configPath, 'utf8')) || {};
        config = { ...defaultConfig, ...loadedConfig };
    } catch (err) {
        console.error('Invalid config.json syntax; using default configuration.');
    }
} else {
    try {
        fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
        configWarnings.push('No config.json found; created default config.json.');
    } catch (err) {
        console.error('Unable to create default config.json:', err.message);
    }
}

const HEADLESS = process.env.HEADLESS === 'true' || process.argv.includes('--headless') || config.headless;
const NAVIGATION_TIMEOUT = Number(config.timeout) || defaultConfig.timeout;
const PAGE_IDLE_TIMEOUT = Number(config.waitAfterLoad) || defaultConfig.waitAfterLoad;
const COOKIE_CLICK_TIMEOUT = Number(config.cookieClickTimeout) || defaultConfig.cookieClickTimeout || 3000;
const SCREENSHOT_TIMEOUT = Number(config.screenshotTimeout) || defaultConfig.screenshotTimeout || 10000;
const BROWSER_RESTART_THRESHOLD = Number(config.browserRestartThreshold) || defaultConfig.browserRestartThreshold;

// =====================================
// TIMESTAMP FOR RUN
// =====================================

const now = new Date();

const runTimestamp = `${now.getFullYear()}-${
    String(now.getMonth() + 1).padStart(2, '0')
}-${
    String(now.getDate()).padStart(2, '0')
}_${
    String(now.getHours()).padStart(2, '0')
}-${
    String(now.getMinutes()).padStart(2, '0')
}-${
    String(now.getSeconds()).padStart(2, '0')
}`;

// =====================================
// RUN FOLDERS
// =====================================

const logsFolder = path.join(process.cwd(), config.logsFolder);
const inputFile = path.join(process.cwd(), config.inputFile);

const runFolder = path.join(logsFolder, runTimestamp);

fs.mkdirSync(runFolder, { recursive: true });

let screenshotFolderCreated = false;

const screenshotFolder = path.join(runFolder, 'screenshots');

// =====================================
// EXECUTION LOGGING
// =====================================

const logFilePath = path.join(runFolder, 'execution.log');

function log(...args) {
    const message = args.join(' ');
    const timestamp = new Date().toLocaleTimeString('en-US', {
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    const timestampedMessage = `[${timestamp}] ${message}`;
    console.log(timestampedMessage);
    fs.appendFileSync(logFilePath, timestampedMessage + '\n');
}

if (configWarnings.length > 0) {
    configWarnings.forEach((warning) => log('CONFIG WARNING:', warning));
}

// =====================================
// INPUT FILE
// =====================================

// =====================================
// HELPERS
// =====================================

function normalizeUrl(value) {

    if (!value) return value;

    const trimmed = String(value).trim();

    if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed)) {

        return trimmed;
    }

    return `https://${trimmed}`;
}

function isValidUrl(value) {

    try {

        new URL(normalizeUrl(value));

        return true;

    } catch {

        return false;
    }
}

// =====================================
// MAIN
// =====================================

(async () => {

    if (!fs.existsSync(inputFile)) {

        throw new Error(`Missing input file: ${inputFile}`);
    }

    // =====================================
    // READ INPUT EXCEL
    // =====================================

    const inputWorkbook = new ExcelJS.Workbook();

    await inputWorkbook.xlsx.readFile(inputFile);

    const worksheet = inputWorkbook.worksheets[0];

    if (!worksheet) {

        throw new Error('No worksheet found');
    }

    const inputHeaderRow = worksheet.getRow(1);
    const clientColumnHeader = String(inputHeaderRow.getCell(1).value || '').trim().toLowerCase();
    const urlColumnHeader = String(inputHeaderRow.getCell(2).value || '').trim().toLowerCase();

    if (!clientColumnHeader.includes('client') || !urlColumnHeader.includes('url')) {
        throw new Error('Input worksheet must include Client and URL headers in the first two columns.');
    }

    const data = [];

    worksheet.eachRow((row, rowNumber) => {

        // Skip header row
        if (rowNumber === 1) return;

        let client = row.getCell(1).value;
        let url = row.getCell(2).value;

        // Normalize client value (handle hyperlink objects and trim)
        if (typeof client === 'object' && client !== null) {
            client = String(client.text || client.hyperlink || '').trim();
        } else {
            client = client === undefined || client === null ? '' : String(client).trim();
        }

        // Normalize URL value (handle hyperlink objects and trim)
        if (typeof url === 'object' && url !== null) {
            url = String(url.hyperlink || url.text || '').trim();
        } else {
            url = url === undefined || url === null ? '' : String(url).trim();
        }

        // Skip completely blank rows
        if (!client && !url) return;

        data.push({
            Client: client,
            URL: url
        });
    });

    const duplicateUrls = new Set();
    const seenUrls = new Set();

    data.forEach((entry) => {
        const normalized = normalizeUrl(entry.URL || '');
        if (!normalized) return;
        if (seenUrls.has(normalized)) {
            duplicateUrls.add(normalized);
        } else {
            seenUrls.add(normalized);
        }
    });

    if (duplicateUrls.size > 0) {
        log('INPUT WARNING: Duplicate URLs detected:', Array.from(duplicateUrls).join(', '));
    }

    // =====================================
    // LAUNCH BROWSER
    // =====================================

    let browser = await chromium.launch({
        headless: HEADLESS
    });

    log(`Browser headless mode: ${HEADLESS}`);

    let processedCount = 0;

    let accessibleCount = 0;

    let restrictedCount = 0;

    const results = [];

    // =====================================
    // PROCESS URLS
    // =====================================

    for (const row of data) {

        // Restart browser every configured number of URLs
        if (processedCount > 0 && processedCount % BROWSER_RESTART_THRESHOLD === 0) {

            log('\nRestarting browser...\n');

            await browser.close();

            browser = await chromium.launch({
                headless: HEADLESS
            });
        }

        processedCount++;

        // Client and URL values are already normalized when reading the sheet
        const client = row.Client || 'Unknown';

        let url = row.URL || '';

        // If URL empty but client present, mark as RESTRICTED -> Empty URL
        if (!url) {

            const timestamp = new Date().toLocaleString();

            const status = 'RESTRICTED';

            const details = 'Empty URL';

            restrictedCount++;

            log('RESTRICTED:', details);

            results.push({
                Timestamp: timestamp,
                Client: client,
                URL: url,
                FinalURL: url,
                Status: status,
                Details: details,
                Screenshot: ''
            });

            continue;
        }

        const timestamp = new Date().toLocaleString();

        log('\n================================');
        log(`Checking: ${client}`);
        log(url);

        let context;

        let page;

        let status = 'ACCESSIBLE';

        let details = 'Publicly Accessible';

        let finalUrl = '';

        let screenshotPath = '';

        let response;
        let staticDownloadDetected = false;

        const warnings = [];

        try {

            if (!url || !isValidUrl(url)) {

                throw new Error('Invalid URL');
            }

            const normalizedUrl = normalizeUrl(url);
            const staticFileUrlPattern = /\.(pdf|png|jpg|jpeg|webp|svg)(\?.*)?$/i;
            const isDownloadableStaticFile = staticFileUrlPattern.test(normalizedUrl);

            if (config.warnOnHttp && normalizedUrl.startsWith('http://')) {
                warnings.push('HTTP URL detected; consider HTTPS');
            }

            // =====================================
            // CONTEXT
            // =====================================

            context = await browser.newContext({
                ignoreHTTPSErrors: true
            });

            page = await context.newPage();

            // =====================================
            // RETRY LOGIC
            // =====================================

            for (let attempt = 1; attempt <= 2; attempt++) {

                try {

                    log(`Attempt ${attempt}`);

                    response = await page.goto(normalizedUrl, {
                        timeout: NAVIGATION_TIMEOUT,
                        waitUntil: 'domcontentloaded'
                    });

                    break;

                } catch (retryErr) {

                    log(`Attempt ${attempt} failed`);

                    const retryMessage = String(retryErr || '').toLowerCase();

                    if (isDownloadableStaticFile && retryMessage.includes('download is starting')) {
                        log('Download file detected; treating static file as accessible');
                        response = { status: () => 200 };
                        finalUrl = normalizedUrl;
                        staticDownloadDetected = true;
                        break;
                    }

                    if (attempt === 2) {

                        throw retryErr;
                    }

                    await page.waitForTimeout(5000);
                }
            }

            // =====================================
            // WAIT FOR PAGE ACTIVITY TO SETTLE
            // =====================================

            await page.waitForLoadState('networkidle', {
                timeout: PAGE_IDLE_TIMEOUT
            }).catch(async () => {
                await page.waitForTimeout(3000);
            });

            // =====================================
            // ONETRUST COOKIE HANDLER
            // =====================================

            try {

                const oneTrustButton =
                    page.locator('#onetrust-accept-btn-handler');

                if (await oneTrustButton.isVisible({ timeout: 3000 })) {

                    log('OneTrust popup detected');

                    await oneTrustButton.click();

                    await page.waitForLoadState('networkidle');

                    await page.waitForTimeout(5000);
                }

            } catch {}

            // =====================================
            // GENERIC COOKIE HANDLER
            // =====================================

            try {

                const cookieButtons = [

                    'button:has-text("Accept")',
                    'button:has-text("Accept All")',
                    'button:has-text("Allow All")',
                    'button:has-text("I Agree")',
                    'button:has-text("Agree")',
                    'button:has-text("Got it")'
                ];

                for (const selector of cookieButtons) {

                    const button = page.locator(selector).first();

                    if (await button.isVisible({ timeout: 2000 })) {

                        log('Cookie popup detected');

                        await button.click();

                        await page.waitForLoadState('networkidle');

                        await page.waitForTimeout(5000);

                        break;
                    }
                }

            } catch {}

            // =====================================
            // PAGE DATA
            // =====================================

            await page.waitForLoadState('domcontentloaded');

            let pageTitle = '';
            let pageContent = '';

            if (!staticDownloadDetected) {
                finalUrl = page.url().toLowerCase();

                pageTitle = (
                    await page.title()
                ).toLowerCase();

                pageContent = (
                    await page.content()
                ).toLowerCase().replace(/\s+/g, ' ');

                log('Final URL:', finalUrl);
            } else {
                log('Static file download detected; skipping page metadata checks');
            }

            // =====================================
            // STATIC FILE DETECTION
            // =====================================

            const staticFileUrl =

                finalUrl.endsWith('.pdf') ||
                finalUrl.endsWith('.png') ||
                finalUrl.endsWith('.jpg') ||
                finalUrl.endsWith('.jpeg') ||
                finalUrl.endsWith('.webp') ||
                finalUrl.endsWith('.svg');

            // =====================================
            // DETECTIONS
            // =====================================

            const redirectedToLogin =

                finalUrl.includes('/login') ||
                finalUrl.includes('/signin') ||
                finalUrl.includes('/auth') ||
                finalUrl.includes('microsoftonline') ||
                finalUrl.includes('okta') ||
                finalUrl.includes('auth0') ||

                pageContent.includes('please sign in') ||
                pageContent.includes('authentication required') ||
                pageContent.includes('session expired') ||
                pageContent.includes('work or school account') ||

                await page.locator('input[type="password"]').count() > 0;

            const accessDenied =

                pageContent.includes('access denied') ||
                pageContent.includes('unauthorized') ||
                pageContent.includes('403 forbidden') ||
                pageContent.includes('permission denied') ||
                pageContent.includes("you don't have permission") ||
                pageContent.includes('you don’t have permission') ||
                pageContent.includes('directory listing denied');

            const captchaDetected =

                pageContent.includes('captcha') ||
                pageContent.includes('verify you are human');

            const maintenanceDetected =

                pageContent.includes('maintenance') ||
                pageContent.includes('temporarily unavailable') ||
                pageContent.includes('under maintenance');

            const pageNotFound =

                pageTitle.includes('404') ||
                pageContent.includes('page not found') ||
                pageContent.includes('does not exist');

            const spinnerVisible =

                (
                    pageContent.includes('loading') ||
                    pageContent.includes('please wait')
                ) &&
                pageContent.length < 1500;

            const isBlankPage =
                pageContent.length < 120;

            // =====================================
            // RESTRICTED CONDITIONS
            // =====================================

            if (redirectedToLogin) {

                status = 'RESTRICTED';

                details = 'Redirected to Login';
            }

            else if (accessDenied) {

                status = 'RESTRICTED';

                details = 'Access Denied';
            }

            else if (captchaDetected) {

                status = 'RESTRICTED';

                details = 'Bot Protection / CAPTCHA';
            }

            else if (maintenanceDetected) {

                status = 'RESTRICTED';

                details = 'Maintenance Page';
            }

            else if (pageNotFound) {

                status = 'RESTRICTED';

                details = 'Page Not Found';
            }

            else if (!response) {

                status = 'RESTRICTED';

                details = 'No Response';
            }

            else if (response.status() >= 400) {

                status = 'RESTRICTED';

                details = `HTTP ${response.status()}`;
            }

            else if (!staticFileUrl && spinnerVisible) {

                status = 'RESTRICTED';

                details = 'Infinite Loading / Spinner';
            }

            else if (!staticFileUrl && isBlankPage) {

                status = 'RESTRICTED';

                details = 'Blank/Empty Page';
            }

            // =====================================
            // SCREENSHOTS
            // =====================================

            if (status === 'RESTRICTED') {

                restrictedCount++;

                log('RESTRICTED:', details);

                if (config.captureScreenshots) {
                    if (!screenshotFolderCreated) {

                        fs.mkdirSync(screenshotFolder, {
                            recursive: true
                        });

                        screenshotFolderCreated = true;
                    }

                    const safeFileName =
                        `${client.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.png`;

                    screenshotPath = path.join(
                        'screenshots',
                        safeFileName
                    );

                    try {

                        await page.screenshot({
                            path: path.join(runFolder, screenshotPath),
                            fullPage: true,
                            timeout: SCREENSHOT_TIMEOUT
                        });

                        log('Screenshot captured');

                    } catch {

                        log('Could not capture screenshot');
                    }
                }

            } else {

                accessibleCount++;

                log('ACCESSIBLE');
            }

        }

        catch (err) {

            status = 'RESTRICTED';

            restrictedCount++;

            if (String(err).includes('Timeout')) {

                details = 'Timeout / Environment Unreachable';

            } else {

                details = err.message || String(err);
            }

            log('ERROR:', details);

            if (!screenshotFolderCreated) {

                fs.mkdirSync(screenshotFolder, {
                    recursive: true
                });

                screenshotFolderCreated = true;
            }

            try {

                if (page && config.captureScreenshots) {

                    await page.waitForTimeout(3000);

                    const safeFileName =
                        `${client.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.png`;

                    screenshotPath = path.join(
                        'screenshots',
                        safeFileName
                    );

                    await page.screenshot({
                        path: path.join(runFolder, screenshotPath),
                        fullPage: true,
                        timeout: SCREENSHOT_TIMEOUT
                    });

                    log('Screenshot captured');
                }

            } catch {

                log('Could not capture screenshot');
            }
        }

        finally {

            if (context) {

                await context.close();
            }
        }

        // =====================================
        // SAVE RESULTS
        // =====================================

        results.push({
            Timestamp: timestamp,
            Client: client,
            URL: url,
            FinalURL: finalUrl || url,
            Status: status,
            Details: details,
            Screenshot: screenshotPath || '',
            Warnings: warnings.join('; ')
        });
    }

    await browser.close();

    // =====================================
    // EXECUTION SUMMARY
    // =====================================

    const executionEndTime = Date.now();

    const executionDurationMs =
        executionEndTime - executionStartTime;

    const executionMinutes =
        Math.floor(executionDurationMs / 60000);

    const executionSeconds =
        Math.floor((executionDurationMs % 60000) / 1000);

    const executionStartedString = new Date(executionStartTime).toLocaleString();
    const executionCompletedString = new Date(executionEndTime).toLocaleString();

    // Final log message to mark completion in execution.log
    log('\n================================');
    log('DONE');

    // =====================================
    // CREATE OUTPUT EXCEL
    // =====================================

    const workbook = new ExcelJS.Workbook();

    const resultsSheet =
        workbook.addWorksheet('Results');

    const summarySheet =
        workbook.addWorksheet('Summary');

    // =====================================
    // HEADERS
    // =====================================

    resultsSheet.columns = [

        { header: 'Timestamp', key: 'Timestamp', width: 25 },
        { header: 'Client', key: 'Client', width: 30 },
        { header: 'URL', key: 'URL', width: 50 },
        { header: 'FinalURL', key: 'FinalURL', width: 50 },
        { header: 'Status', key: 'Status', width: 18 },
        { header: 'Details', key: 'Details', width: 35 },
        { header: 'Screenshot', key: 'Screenshot', width: 40 },
        { header: 'Warnings', key: 'Warnings', width: 40 }
    ];

    // =====================================
    // STYLE HEADER ROW
    // =====================================

    const headerRow = resultsSheet.getRow(1);

    headerRow.font = {
        bold: true,
        color: { argb: 'FFFFFFFF' },
        size: 12
    };

    headerRow.alignment = {
        vertical: 'middle',
        horizontal: 'center'
    };

    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '1F4E78' }
    };

    headerRow.height = 22;

    // Freeze top row
    resultsSheet.views = [
        { state: 'frozen', ySplit: 1 }
    ];
    // Auto filter for results
    resultsSheet.autoFilter = {
        from: 'A1',
        to: 'G1'
    };
    

    // =====================================
    // ADD ROWS
    // =====================================

    results.forEach(result => {

        const row = resultsSheet.addRow(result);

        // Full-row coloring based on status
        const accessibleFill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFC6EFCE' }
        };

        const restrictedFill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFC7CE' }
        };

        const fillToUse = result.Status === 'ACCESSIBLE' ? accessibleFill : restrictedFill;

        row.eachCell(cell => {
            cell.fill = fillToUse;
        });

        // Ensure the Status cell remains readable (bold)
        row.getCell('Status').font = { bold: true };

        // URL hyperlink (use normalized URL if possible)
        if (result.URL) {
            row.getCell('URL').value = {
                text: result.URL,
                hyperlink: normalizeUrl(result.URL)
            };
        }

        // FinalURL hyperlink
        if (result.FinalURL) {
            row.getCell('FinalURL').value = {
                text: result.FinalURL,
                hyperlink: normalizeUrl(result.FinalURL)
            };
        }

        // Screenshot hyperlink
        if (result.Screenshot) {

            row.getCell('Screenshot').value = {
                text: result.Screenshot,
                hyperlink: result.Screenshot
            };
        }
    });

    // =====================================
    // SUMMARY SHEET
    // =====================================

    summarySheet.addRow([
        'Execution Started',
        executionStartedString
    ]);

    summarySheet.addRow([
        'Execution Completed',
        executionCompletedString
    ]);

    summarySheet.addRow([
        'Total URLs',
        processedCount
    ]);

    summarySheet.addRow([
        'Accessible Count',
        accessibleCount
    ]);

    summarySheet.addRow([
        'Restricted Count',
        restrictedCount
    ]);

    summarySheet.addRow([
        'Execution Time',
        `${executionMinutes}m ${executionSeconds}s`
    ]);

    // Tool version
    summarySheet.addRow([
        'Tool Version',
        TOOL_VERSION
    ]);

    // Freeze top row of summary for better UX
    summarySheet.views = [
        { state: 'frozen', ySplit: 1 }
    ];

    // =====================================
    // FORMAT SUMMARY SHEET
    // =====================================

    // Column widths
    summarySheet.getColumn(1).width = 30;
    summarySheet.getColumn(2).width = 35;

    // Header styling for left column
    for (let i = 1; i <= summarySheet.rowCount; i++) {

        const labelCell = summarySheet.getCell(`A${i}`);
        const valueCell = summarySheet.getCell(`B${i}`);

        // Left label styling
        labelCell.font = {
            bold: true,
            color: { argb: 'FFFFFFFF' }
        };

        labelCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '1F4E78' }
        };

        // Value cell styling
        valueCell.font = {
            bold: true
        };

        valueCell.alignment = {
            horizontal: 'center'
        };

        // Borders
        labelCell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };

        valueCell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    }

    // =====================================
    // SAVE FILE
    // =====================================

    const excelFileName =
        `${config.outputFilePrefix || defaultConfig.outputFilePrefix}_${runTimestamp}.xlsx`;

    await workbook.xlsx.writeFile(
        path.join(runFolder, excelFileName)
    );

    log(`Run Folder: ${runFolder}`);
    log('================================');
    log('EXECUTION COMPLETED');
    log('================================');
    log(`Run Folder: ${runFolder}`);
    log(`Total URLs: ${processedCount}`);
    log(`ACCESSIBLE: ${accessibleCount}`);
    log(`RESTRICTED: ${restrictedCount}`);
    log(`Execution Started: ${new Date(executionStartTime).toLocaleString()}`);
    log(`Execution Completed: ${new Date(executionEndTime).toLocaleString()}`);
    log(`Execution Time: ${executionMinutes}m ${executionSeconds}s`);
    log('================================');

})();