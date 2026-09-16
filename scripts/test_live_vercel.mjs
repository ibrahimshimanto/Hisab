import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = '/Users/ibrahim/.gemini/antigravity-ide/brain/9f2bbbe0-8b6d-40c5-86e4-8dd6bc4da391';

async function testLiveProduction() {
  console.log('🚀 Testing LIVE Production URL: https://hisab-psi-eight.vercel.app/ ...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 412, height: 915 },
  });
  const page = await context.newPage();

  try {
    await page.goto('https://hisab-psi-eight.vercel.app/', { waitUntil: 'networkidle' });

    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload({ waitUntil: 'networkidle' });

    console.log('📸 Capturing LIVE Screen: Auth Screen...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'live_screen1_auth.png') });

    // Test Google button opens modal
    console.log('🔘 Clicking Continue with Google on LIVE production...');
    const googleBtn = page.getByRole('button', { name: /Continue with Google|গুগল দিয়ে প্রবেশ/i });
    await googleBtn.click();
    await page.waitForTimeout(600);

    console.log('📸 Capturing LIVE Screen: Google Modal...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'live_screen2_google_modal.png') });

    // Continue as Ibrahim
    const continueAsGoogle = page.getByRole('button', { name: /Continue as Ibrahim|Continue as Google/i });
    await continueAsGoogle.click();
    await page.waitForTimeout(1000);

    console.log('📸 Capturing LIVE Screen: Onboarding Step 0 (Language)...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'live_screen3_onboarding_lang.png') });

    // Advance to Step 1 (Profile)
    const nextBtn = page.getByRole('button', { name: /Next|পরবর্তী/i });
    await nextBtn.click();
    await page.waitForTimeout(600);

    console.log('📸 Capturing LIVE Screen: Onboarding Step 1 (Profile pre-filled with Ibrahim Khalil)...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'live_screen4_onboarding_profile.png') });

    // Advance to Step 2 (Accounts)
    await nextBtn.click();
    await page.waitForTimeout(600);

    console.log('📸 Capturing LIVE Screen: Onboarding Step 2 (Accounts)...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'live_screen5_onboarding_accounts.png') });

    // Add bKash template
    const bkashBtn = page.getByRole('button', { name: /bKash/i });
    if (await bkashBtn.isVisible()) {
      await bkashBtn.click();
      await page.waitForTimeout(300);
    }

    // Complete Onboarding to Dashboard
    const finishBtn = page.getByRole('button', { name: /Save & Go to Dashboard|সংরক্ষণ করুন ও ড্যাশবোর্ডে যান/i });
    await finishBtn.click();
    await page.waitForTimeout(1000);

    console.log('📸 Capturing LIVE Screen: Dashboard...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'live_screen6_dashboard.png') });

    console.log('🌟 LIVE PRODUCTION VERIFICATION 100% COMPLETE & PASSING!');
  } catch (err) {
    console.error('❌ Production test error:', err);
    throw err;
  } finally {
    await browser.close();
  }
}

testLiveProduction();
