const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testLoginFlow() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('=== Testing Login Flow on web3.hanzo.ai ===\n');

  try {
    // Step 1: Navigate to login page
    console.log('Step 1: Navigating to https://web3.hanzo.ai/login');
    await page.goto('https://web3.hanzo.ai/login', { waitUntil: 'domcontentloaded', timeout: 30000 });

    console.log(`Initial URL: ${page.url()}\n`);

    // Step 2: Take screenshot
    console.log('Step 2: Taking screenshot of initial page...');
    const screenshotPath1 = '/Users/z/work/bootnode/screenshot-1-login-page.png';
    await page.screenshot({ path: screenshotPath1, fullPage: true });
    console.log(`Screenshot saved: ${screenshotPath1}\n`);

    // Get page content
    const pageTitle = await page.title();
    const pageContent = await page.content();
    console.log(`Page Title: ${pageTitle}`);
    console.log(`Page contains "Redirecting": ${pageContent.includes('Redirecting')}`);
    console.log(`Page contains "Hanzo ID": ${pageContent.includes('Hanzo ID')}\n`);

    // Wait for navigation (auto-redirect)
    console.log('Step 3: Waiting for redirect to hanzo.id...');
    try {
      await page.waitForNavigation({ timeout: 10000 });
      console.log(`Redirected to: ${page.url()}\n`);
    } catch (e) {
      console.log(`No navigation detected within 10 seconds. Current URL: ${page.url()}`);

      // Check if there's a redirect link we need to click
      const redirectLinks = await page.$$eval('a', links => links.map(l => ({ text: l.textContent, href: l.href })));
      if (redirectLinks.length > 0) {
        console.log('Found links on page:');
        redirectLinks.forEach(link => console.log(`  - ${link.text}: ${link.href}`));
      }
    }

    // Step 4: Take screenshot of redirected page
    console.log('\nStep 4: Taking screenshot of hanzo.id login page...');
    const screenshotPath2 = '/Users/z/work/bootnode/screenshot-2-hanzo-id-login.png';
    await page.screenshot({ path: screenshotPath2, fullPage: true });
    console.log(`Screenshot saved: ${screenshotPath2}\n`);

    // Get current page details
    const currentTitle = await page.title();
    const currentContent = await page.content();
    console.log(`Current Page Title: ${currentTitle}`);
    console.log(`Current URL: ${page.url()}`);
    console.log(`Is on hanzo.id: ${page.url().includes('hanzo.id')}`);
    console.log(`Page contains login form: ${currentContent.includes('login') || currentContent.includes('Login')}\n`);

    // Check for login form elements
    const hasEmailInput = await page.$('input[type="email"]') !== null;
    const hasPasswordInput = await page.$('input[type="password"]') !== null;
    const hasLoginButton = await page.$('button[type="submit"]') !== null;

    console.log('Form Elements Detected:');
    console.log(`  - Email input: ${hasEmailInput}`);
    console.log(`  - Password input: ${hasPasswordInput}`);
    console.log(`  - Login button: ${hasLoginButton}\n`);

    // Check for auth provider buttons (Google, etc.)
    const buttons = await page.$$eval('button', btns => btns.map(b => b.textContent.trim()).filter(t => t));
    console.log('Buttons found on page:');
    buttons.slice(0, 10).forEach(btn => console.log(`  - ${btn}`));

  } catch (error) {
    console.error('Error during test:', error.message);
  } finally {
    await browser.close();
    console.log('\n=== Test Complete ===');
  }
}

testLoginFlow();
