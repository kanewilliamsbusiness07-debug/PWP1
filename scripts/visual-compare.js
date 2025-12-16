const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const pixelmatch = require('pixelmatch');
const { PNG } = require('pngjs');

async function captureSummaryScreenshot(url, outPath) {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 2000, deviceScaleFactor: 2 });
  await page.goto(url, { waitUntil: 'networkidle0' });
  // Wait a moment for fonts/animations
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: outPath, fullPage: true });
  await browser.close();
}

async function compareImages(imgAPath, imgBPath, diffPath) {
  const imgA = PNG.sync.read(fs.readFileSync(imgAPath));
  const imgB = PNG.sync.read(fs.readFileSync(imgBPath));
  const { width, height } = imgA;
  const diff = new PNG({ width, height });
  const numDiffPixels = pixelmatch(imgA.data, imgB.data, diff.data, width, height, { threshold: 0.1 });
  fs.writeFileSync(diffPath, PNG.sync.write(diff));
  return numDiffPixels;
}

(async function main(){
  const summaryUrl = process.argv[2] || 'http://localhost:3000/dashboard/summary';
  const pdfUrl = process.argv[3] || 'http://localhost:3000/api/pdf-generate?test=true';
  const tmpDir = path.join(__dirname, '..', 'tmp');
  if(!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
  const screenshotPath = path.join(tmpDir, 'summary-screenshot.png');
  const pdfPath = path.join(tmpDir, 'summary.pdf');
  const pdfAsPng = path.join(tmpDir, 'summary-pdf.png');
  const diffPath = path.join(tmpDir, 'summary-diff.png');

  console.log('Capturing on-screen Summary...');
  await captureSummaryScreenshot(summaryUrl, screenshotPath);

  console.log('Generating PDF from the live Summary page...');

  // Generate PDF directly from the live page using Puppeteer
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 2000, deviceScaleFactor: 3 });
  await page.goto(summaryUrl, { waitUntil: 'networkidle0' });
  // Wait for fonts/images
  await page.evaluate(async () => {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
    const root = document.querySelector('#summary-root') || document.body;
    const images = Array.from(root.querySelectorAll('img'));
    await Promise.all(images.map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise((res) => { img.onload = img.onerror = () => res(); });
    }));
  });

  await new Promise((r) => setTimeout(r, 400));
  const height = await page.evaluate(() => document.documentElement.scrollHeight);

  const pdfBuffer = await page.pdf({ printBackground: true, width: '1440px', height: `${height}px` });
  fs.writeFileSync(pdfPath, pdfBuffer);

  // Render the generated PDF back to PNG for pixel comparison
  const page2 = await browser.newPage();
  await page2.setViewport({ width: 1440, height: 2000, deviceScaleFactor: 2 });
  const dataUrl = 'data:application/pdf;base64,' + pdfBuffer.toString('base64');
  await page2.goto(dataUrl);
  await page2.waitForTimeout(500);
  await page2.screenshot({ path: pdfAsPng, fullPage: true });
  await browser.close();

  console.log('Comparing images...');
  const diffs = await compareImages(screenshotPath, pdfAsPng, diffPath);
  console.log('Number of differing pixels:', diffs);
  process.exit(diffs > 1000 ? 2 : 0);
})();
