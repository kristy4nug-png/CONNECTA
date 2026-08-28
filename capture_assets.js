const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Set iPhone 14 Pro Max viewport for standard mobile screenshots
  await page.setViewport({ width: 430, height: 932, deviceScaleFactor: 3 });
  
  const baseUrl = 'https://kristy4nug-png.github.io/Atlas/';
  await page.goto(baseUrl, { waitUntil: 'networkidle2' });

  // Add 1s buffer for animations
  await new Promise(r => setTimeout(r, 1000));
  
  // Screenshot 1: Onboarding
  await page.screenshot({ path: 'screenshot_1_onboarding.png' });
  
  // Click through onboarding to get to Today view
  await page.type('#setupDisplayName', 'Chris');
  await page.click('#skipOnboarding');
  await new Promise(r => setTimeout(r, 1000));
  
  // Screenshot 2: Today View (Main Dashboard)
  await page.screenshot({ path: 'screenshot_2_today.png' });
  
  // Navigate to Meetings
  await page.evaluate(() => {
    document.querySelector('[data-go="meetings"]').click();
  });
  await new Promise(r => setTimeout(r, 1000));
  
  // Screenshot 3: Meetings View
  await page.screenshot({ path: 'screenshot_3_meetings.png' });
  
  // Generate the 1024x1024 App Store Icon
  const logoBase64 = fs.readFileSync('assets/branding/connecta-final-logo.png', 'base64');
  
  const iconHtml = `
    <html>
      <body style="margin:0; padding:0; width:1024px; height:1024px; background:linear-gradient(135deg, hsl(207, 45%, 21%), hsl(207, 35%, 31%)); display:flex; align-items:center; justify-content:center;">
        <img src="data:image/png;base64,${logoBase64}" style="max-width:800px; max-height:800px; filter:drop-shadow(0 24px 48px rgba(13,28,42,0.4));" />
      </body>
    </html>
  `;
  
  await page.setViewport({ width: 1024, height: 1024, deviceScaleFactor: 1 });
  await page.setContent(iconHtml);
  await page.screenshot({ path: 'app_store_icon_1024.png' });

  // Generate a Feature Graphic (1024x500 for Google Play)
  const featureHtml = `
    <html>
      <body style="margin:0; padding:0; width:1024px; height:500px; background:linear-gradient(135deg, hsl(158, 48%, 35%), hsl(207, 45%, 21%)); display:flex; align-items:center; justify-content:center;">
        <img src="data:image/png;base64,${logoBase64}" style="max-width:700px; max-height:300px; filter:drop-shadow(0 20px 40px rgba(13,28,42,0.4));" />
      </body>
    </html>
  `;
  await page.setViewport({ width: 1024, height: 500, deviceScaleFactor: 1 });
  await page.setContent(featureHtml);
  await page.screenshot({ path: 'google_play_feature_graphic.png' });

  await browser.close();
})();
