/**
 * Cardano Icon Test Script for AirGap Vault
 *
 * Tests that the Cardano icon displays correctly after importing a wallet.
 *
 * IMPORTANT: This test works best when run on a fresh browser state (cleared localStorage)
 * or when the wallet is already set up and onboarding is complete.
 *
 * Usage:
 * 1. Set TEST_RECOVERY_PHRASE in .env file
 * 2. Start dev server: `bun run serve` or `ionic serve`
 * 3. Run via Claude Code with Playwright MCP
 *
 * Known limitations:
 * - Ionic modal transitions can cause blank page issues in web mode
 * - Test works most reliably when onboarding is already complete
 */

// Recovery phrase placeholder - replace {{RECOVERY_PHRASE}} with actual phrase
const RECOVERY_PHRASE = '{{RECOVERY_PHRASE}}'

/**
 * Main test function - to be run via mcp__playwright__browser_run_code
 *
 * This test assumes onboarding is already complete and a wallet exists.
 * For fresh installs, run the onboarding manually first.
 */
const testExistingWallet = `
async (page) => {
  // Navigate directly to secrets tab
  await page.goto('http://localhost:8100/tabs/tab-secrets')
  await page.waitForLoadState('networkidle')

  // Wait for app to stabilize
  await page.waitForTimeout(2000)

  // Click on the wallet card to view accounts
  const walletCard = page.locator('ion-card').first()
  if (await walletCard.isVisible()) {
    await walletCard.click()
    await page.waitForTimeout(1000)
  }

  // Check if we're on accounts list
  if (page.url().includes('accounts-list')) {
    const cardanoAccount = page.locator('ion-item', { hasText: 'Cardano ADA' })
    if (await cardanoAccount.isVisible()) {
      const iconSrc = await cardanoAccount.locator('img').first().getAttribute('src')
      return {
        success: true,
        message: 'Cardano icon found in accounts list',
        iconSrc
      }
    }
  }

  // If no wallet exists, need to create one first
  return {
    success: false,
    error: 'No wallet found. Run full onboarding test first.',
    currentUrl: page.url()
  }
}
`

/**
 * Full test including wallet import - requires fresh browser state
 * Run each step individually via MCP for better control
 */
const testSteps = {
  step1_navigate: `async (page) => {
    await page.goto('http://localhost:8100')
    await page.waitForSelector('ion-app', { timeout: 30000 })
    return { success: true, url: page.url() }
  }`,

  step2_onboarding: `async (page) => {
    // Handle Read Disclaimer
    const btn = page.getByRole('button', { name: 'Read Disclaimer' })
    if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await btn.click()
      return { success: true, step: 'clicked Read Disclaimer' }
    }
    return { success: true, step: 'no disclaimer button' }
  }`,

  step3_accept: `async (page) => {
    const btn = page.getByRole('button', { name: 'I understand and accept' })
    if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await btn.click()
      return { success: true, step: 'accepted disclaimer' }
    }
    return { success: true, step: 'no accept button' }
  }`,

  step4_selectOnline: `async (page) => {
    const online = page.getByText('online').first()
    if (await online.isVisible({ timeout: 3000 }).catch(() => false)) {
      await online.click()
      await page.waitForTimeout(500)
      const cont = page.getByRole('button', { name: 'Continue' })
      if (await cont.isVisible()) await cont.click()
      return { success: true, step: 'selected online' }
    }
    return { success: true, step: 'no online option' }
  }`,

  step5_continueSetup: `async (page) => {
    const cont = page.getByRole('button', { name: 'Continue' })
    if (await cont.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cont.click()
      return { success: true, step: 'continued setup' }
    }
    return { success: true, step: 'no continue button' }
  }`,

  step6_skip: `async (page) => {
    const skip = page.getByRole('button', { name: 'Skip' })
    if (await skip.isVisible({ timeout: 3000 }).catch(() => false)) {
      await skip.click()
      return { success: true, step: 'skipped wallet install' }
    }
    return { success: true, step: 'no skip button' }
  }`,

  step7_addSecret: `async (page) => {
    await page.waitForTimeout(1000)
    const addBtn = page.locator('ion-header ion-button').first()
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click()
      await page.waitForTimeout(500)
      const addSecret = page.getByRole('button', { name: 'Add Secret' })
      if (await addSecret.isVisible()) await addSecret.click()
      return { success: true, step: 'clicked add secret' }
    }
    return { success: false, error: 'add button not found' }
  }`,

  step8_importPhrase: `async (page) => {
    const importBtn = page.getByRole('heading', { name: 'Import Recovery Phrase' })
    if (await importBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await importBtn.click()
      return { success: true, step: 'selected import' }
    }
    return { success: false, error: 'import option not found' }
  }`,

  step9_pastePhrase: `async (page) => {
    const phrase = '{{RECOVERY_PHRASE}}'
    await page.evaluate((p) => navigator.clipboard.writeText(p), phrase)
    const pasteBtn = page.getByRole('button', { name: 'Paste' })
    if (await pasteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await pasteBtn.click()
      await page.waitForTimeout(1000)
      return { success: true, step: 'pasted phrase' }
    }
    return { success: false, error: 'paste button not found' }
  }`,

  step10_confirmPhrase: `async (page) => {
    const confirmBtn = page.getByRole('button', { name: 'Confirm' })
    if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmBtn.click()
      return { success: true, step: 'confirmed phrase' }
    }
    return { success: false, error: 'confirm button not found' }
  }`,

  step11_labelWallet: `async (page) => {
    const input = page.getByRole('textbox', { name: 'Label of your secret' })
    if (await input.isVisible({ timeout: 3000 }).catch(() => false)) {
      await input.fill('Test Wallet')
      const confirmBtn = page.getByRole('button', { name: 'Confirm' })
      if (await confirmBtn.isVisible()) await confirmBtn.click()
      return { success: true, step: 'labeled wallet' }
    }
    return { success: false, error: 'label input not found' }
  }`,

  step12_checkCardanoIcon: `async (page) => {
    await page.waitForTimeout(2000)
    const cardanoItem = page.locator('ion-item', { hasText: 'Cardano ADA' })
    if (await cardanoItem.isVisible({ timeout: 5000 }).catch(() => false)) {
      const iconSrc = await cardanoItem.locator('img').first().getAttribute('src')
      const hasCardanoIcon = iconSrc && iconSrc.match(/cardano|ada/i)
      return {
        success: hasCardanoIcon,
        message: hasCardanoIcon ? 'CARDANO ICON TEST PASSED!' : 'Icon missing',
        iconSrc
      }
    }
    return { success: false, error: 'Cardano item not found', url: page.url() }
  }`
}

module.exports = { testExistingWallet, testSteps, RECOVERY_PHRASE }
