import { expect, test } from "@playwright/test";
import {
  INSTAGRAM_URL,
  OFFICE_EMAIL,
  WHATSAPP_URL,
} from "../src/config/contact";

/**
 * Public marketing pages: the contact channels must be real and reachable on
 * every page, at phone width as well as desktop.
 */

test("contact channels are published and reachable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/contact");

  // The placeholder copy this replaced must not come back.
  await expect(page.getByText(/being finalised/i)).toHaveCount(0);

  // Matched by href and taking the first: the address appears both in the
  // contact card and in the footer, which is intended.
  await expect(page.locator(`a[href="mailto:${OFFICE_EMAIL}"]`).first()).toBeVisible();
  await expect(page.locator(`a[href="${WHATSAPP_URL}"]`).first()).toBeVisible();
  await expect(page.locator(`a[href="${INSTAGRAM_URL}"]`).first()).toBeVisible();

  await page.screenshot({ path: "test-results/shot-contact-mobile.png", fullPage: true });

  // And present in the footer of an unrelated page.
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/materials");
  await expect(page.locator(`a[href="mailto:${OFFICE_EMAIL}"]`).first()).toBeVisible();
  await expect(page.locator(`a[href="${WHATSAPP_URL}"]`).first()).toBeVisible();
});
