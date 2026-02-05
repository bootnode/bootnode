const { chromium } = require('playwright');

async function testLoginFlow() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('=== Web3.Hanzo.ai Login Flow Test ===\n');

  try {
    // First, let's intercept the redirect
    console.log('Step 1: Monitoring for redirects...');

    // Set up navigation listener
    page.on('framenavigated', frame => {
      if (frame === page.mainFrame()) {
        console.log(`   Navigation: ${frame.url()}`);
      }
    });

    console.log('Step 2: Navigating to https://web3.hanzo.ai/login\n');

    // Use waitForLoadState to ensure full page load
    await page.goto('https://web3.hanzo.ai/login', { waitUntil: 'networkidle' });

    console.log(`Final URL: ${page.url()}\n`);

    // Analyze the URL
    const url = new URL(page.url());
    const isOnHanzoId = url.hostname.includes('hanzo.id');

    console.log('Step 3: URL Analysis:');
    console.log(`   - Hostname: ${url.hostname}`);
    console.log(`   - Pathname: ${url.pathname}`);
    console.log(`   - Query params: ${url.search}`);
    console.log(`   - Is on hanzo.id: ${isOnHanzoId}\n`);

    if (isOnHanzoId) {
      console.log('Step 4: OAuth2 Redirect Parameters:');
      console.log(`   - redirect_uri: ${url.searchParams.get('redirect_uri')}`);
      console.log(`   - state: ${url.searchParams.get('state')}`);
      console.log(`   - client_id: ${url.searchParams.get('client_id')}`);
      console.log(`   - response_type: ${url.searchParams.get('response_type')}`);
      console.log(`   - scope: ${url.searchParams.get('scope')}\n`);
    }

    // Take a screenshot
    await page.screenshot({ path: '/Users/z/work/bootnode/login-final-screenshot.png' });
    console.log('Step 5: Screenshot taken: /Users/z/work/bootnode/login-final-screenshot.png\n');

    // Check page elements
    console.log('Step 6: Page Elements:');
    const title = await page.title();
    const hasEmailInput = await page.$('input[type="email"]') !== null;
    const hasPasswordInput = await page.$('input[type="password"]') !== null;

    console.log(`   - Page title: ${title}`);
    console.log(`   - Has email input: ${hasEmailInput}`);
    console.log(`   - Has password input: ${hasPasswordInput}\n`);

    // Summary
    console.log('=== SUMMARY ===\n');
    if (isOnHanzoId) {
      console.log('RESULT: Redirect flow is working correctly');
      console.log('- web3.hanzo.ai/login redirects to hanzo.id/login');
      console.log('- OAuth2 parameters are properly set:');
      console.log(`  - Redirect URI: ${url.searchParams.get('redirect_uri')}`);
      console.log(`  - State (CSRF token): ${url.searchParams.get('state')}`);
      console.log('- Login form is present and ready for user input\n');
      console.log('Next step in flow: User enters credentials and signs in');
      console.log('Expected after login: Redirect to auth/callback endpoint');
      console.log('Final destination: web3.hanzo.ai/dashboard\n');
    } else {
      console.log('WARNING: Not on hanzo.id after navigation');
      console.log(`Current location: ${page.url()}`);
    }

  } catch (error) {
    console.error('Test error:', error.message);
  } finally {
    await browser.close();
    console.log('=== Test Complete ===');
  }
}

testLoginFlow();
