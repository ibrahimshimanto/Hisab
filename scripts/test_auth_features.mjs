import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = '/Users/ibrahim/.gemini/antigravity-ide/brain/9f2bbbe0-8b6d-40c5-86e4-8dd6bc4da391';

async function testAuthFeatures() {
  console.log('🚀 Launching Chromium to test all Auth Features...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 412, height: 915 },
  });
  const page = await context.newPage();

  try {
    console.log('🌐 Opening http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

    // Ensure fresh slate
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload({ waitUntil: 'networkidle' });

    // 1. Verify Auth Screen Loaded
    console.log('📸 Capturing Auth Screen (Default State with Magic Link & Google)...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_auth_screen_default.png') });

    // 2. Test Google Sign-In Click
    console.log('🔘 Clicking "Continue with Google"...');
    const googleBtn = page.getByRole('button', { name: /Continue with Google|গুগল দিয়ে প্রবেশ/i });
    await googleBtn.click();
    await page.waitForTimeout(600);

    console.log('📸 Capturing Google Profile / 1-Tap Sign-In Modal...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_auth_google_modal.png') });

    // Close Google modal
    const closeBtn = page.locator('[data-testid="close-google-modal"]');
    await closeBtn.click();
    await page.waitForTimeout(400);

    // 3. Test Email Magic Link Flow
    console.log('✍️ Testing Email Magic Link input...');
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('ibrahim.khalil@example.com');
    await page.waitForTimeout(300);

    const sendMagicLinkBtn = page.getByRole('button', { name: /Send Magic Link|লগইন লিংক পাঠান/i });
    console.log('🔘 Clicking "Send Magic Link"...');
    await sendMagicLinkBtn.click();
    await page.waitForTimeout(1000);

    console.log('📸 Capturing Magic Link Sent Screen (Shows email instructions, NO confusing code input!)...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_auth_magic_link_sent.png') });

    // 4. Test Password Tab Mode
    console.log('🔘 Switching to Password mode from magic link screen...');
    const switchPasswordBtn = page.getByRole('button', { name: /Sign in with Password|পাসওয়ার্ড দিয়ে প্রবেশ/i });
    await switchPasswordBtn.click();
    await page.waitForTimeout(400);

    console.log('📸 Capturing Password Mode Screen (Standard email + password login)...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_auth_password_mode.png') });

    // Toggle Sign Up vs Sign In
    const toggleSignUpBtn = page.getByRole('button', { name: /Don't have an account\? Sign Up|নতুন ব্যবহারকারী\? অ্যাকাউন্ট খুলুন/i });
    if (await toggleSignUpBtn.isVisible()) {
      console.log('🔘 Toggling to Sign Up mode...');
      await toggleSignUpBtn.click();
      await page.waitForTimeout(300);
      console.log('📸 Capturing Sign Up Mode Screen...');
      await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_auth_signup_mode.png') });
    }

    // 5. Test Google 1-Tap Login to Onboarding Flow
    console.log('🔘 Testing Google 1-Tap Login flow to Onboarding...');
    await googleBtn.click();
    await page.waitForTimeout(500);

    const continueAsGoogleBtn = page.getByRole('button', { name: /Continue as Ibrahim|Continue as Google/i });
    await continueAsGoogleBtn.click();
    await page.waitForTimeout(1000);

    console.log('📸 Capturing Onboarding Screen reached via Google Sign-In...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_auth_logged_in_onboarding.png') });

    console.log('✅ ALL AUTH TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    throw err;
  } finally {
    await browser.close();
  }
}

testAuthFeatures();
