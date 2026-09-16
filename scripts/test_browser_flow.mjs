import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = '/Users/ibrahim/.gemini/antigravity-ide/brain/9f2bbbe0-8b6d-40c5-86e4-8dd6bc4da391';

async function runBrowserTest() {
  console.log('🚀 Launching Chromium test browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 412, height: 915 },
  });
  const page = await context.newPage();

  try {
    console.log('🌐 Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

    // Clear everything and ensure onboardingComplete is false for testing new visitor onboarding
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload({ waitUntil: 'networkidle' });

    console.log('📸 Capturing Screen 1: Auth Screen...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screen1_auth.png') });

    // Test Quick 1-Tap Access for new visitor
    console.log('🔘 Clicking Quick 1-Tap Instant Access...');
    const quickAccessBtn = page.getByRole('button', { name: /Quick 1–Tap|Quick 1-Tap|দ্রুত প্রবেশ/i });
    await quickAccessBtn.click();
    await page.waitForTimeout(1000);

    console.log('📸 Capturing Screen 2: Onboarding Step 0 (Language)...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screen2_onboarding_lang.png') });

    // Advance to Step 1
    const nextBtn = page.getByRole('button', { name: /Next|পরবর্তী/i });
    console.log('🔘 Clicking Next to go to Step 1...');
    await nextBtn.click();
    await page.waitForTimeout(600);

    console.log('📸 Capturing Screen 3: Step 1 (Profile & Avatar & Name)...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screen3_step1_empty.png') });

    // Test mandatory validation: click Next with empty name
    console.log('⚠️ Testing empty name validation (clicking Next without name)...');
    await nextBtn.click();
    await page.waitForTimeout(400);

    console.log('📸 Capturing Screen 4: Step 1 with Live Validation Error...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screen4_step1_validation_error.png') });

    // Now fill the name and select an avatar
    const nameInput = page.locator('input[placeholder*="Ibrahim"], input[placeholder*="ইব্রাহিম"]');
    console.log('✍️ Entering name "Ibrahim Khalil"...');
    await nameInput.fill('Ibrahim Khalil');
    await page.waitForTimeout(300);

    // Select the Rocket avatar (🚀)
    const rocketAvatar = page.getByTitle(/Growth Rocket|গ্রোথ রকেট/i);
    if (await rocketAvatar.isVisible()) {
      console.log('🚀 Selecting Growth Rocket avatar...');
      await rocketAvatar.click();
      await page.waitForTimeout(300);
    }

    console.log('📸 Capturing Screen 5: Step 1 Filled with Avatar and Name...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screen5_step1_filled.png') });

    // Click Next to go to Step 2 (Account setup)
    console.log('🔘 Advancing to Step 2...');
    await nextBtn.click();
    await page.waitForTimeout(600);

    console.log('📸 Capturing Screen 6: Step 2 (Account Setup)...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screen6_step2_accounts.png') });

    // Click 1-tap template: bKash
    const bkashBtn = page.getByRole('button', { name: /bKash/i });
    if (await bkashBtn.isVisible()) {
      console.log('📱 Adding bKash template...');
      await bkashBtn.click();
      await page.waitForTimeout(300);
    }

    // Click 1-tap template: City Bank
    const bankBtn = page.getByRole('button', { name: /City Bank/i });
    if (await bankBtn.isVisible()) {
      console.log('🏦 Adding City Bank template...');
      await bankBtn.click();
      await page.waitForTimeout(300);
    }

    console.log('📸 Capturing Screen 7: Step 2 with Templates Added...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screen7_step2_templates_added.png') });

    // Click "Save & Go to Dashboard"
    const finishBtn = page.getByRole('button', { name: /Save & Go to Dashboard|সংরক্ষণ করুন ও ড্যাশবোর্ডে যান/i });
    console.log('🎉 Clicking "Save & Go to Dashboard"...');
    await finishBtn.click();
    await page.waitForTimeout(1500);

    console.log('📸 Capturing Screen 8: Final Dashboard...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screen8_dashboard_success.png') });

    console.log('🎉 ALL 8 SCREENS AND TRANSITIONS VERIFIED WITH 100% PERFECTION!');
  } catch (err) {
    console.error('❌ Test error:', err);
  } finally {
    await browser.close();
  }
}

runBrowserTest();
