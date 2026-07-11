import { type Page } from '@playwright/test'

/** Dismiss any open alert/error dialogs that block clicks. */
export async function dismissAlertDialogs(page: Page): Promise<void> {
  const dialog = page.getByRole('alertdialog')
  if (await dialog.count()) {
    const ok = dialog.getByRole('button', { name: /ตกลง|ปิด|Close/i })
    if (await ok.count()) {
      await ok.first().click()
      await dialog.first().waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {})
    }
  }
}
