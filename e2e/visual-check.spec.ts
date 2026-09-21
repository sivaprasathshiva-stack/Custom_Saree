import { test } from "@playwright/test";
import { createTestCustomer, deleteTestCustomer, type TestCustomer } from "./fixtures";

/**
 * Captures the Studio at desktop and phone width.
 *
 * Not an assertion suite — it exists so a change to the Studio's layout can
 * be looked at rather than guessed at. Run with:
 *   npx playwright test e2e/visual-check.spec.ts
 */

let customer: TestCustomer;

test.beforeAll(async () => {
  customer = await createTestCustomer();
});

test.afterAll(async () => {
  if (customer) await deleteTestCustomer(customer.id);
});

test("capture studio screens", async ({ page }) => {
  await page.goto("/auth/login");
  await page.getByLabel(/email/i).fill(customer.email);
  await page.getByLabel(/password/i).first().fill(customer.password);
  await page.getByRole("button", { name: /sign in|log in/i }).first().click();
  await page.waitForURL((url) => !url.pathname.startsWith("/auth/login"), { timeout: 60_000 });

  for (const [label, width, height] of [
    ["desktop", 1280, 900],
    ["mobile", 390, 844],
  ] as const) {
    await page.setViewportSize({ width, height });

    await page.goto("/studio");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: `test-results/shot-welcome-${label}.png`, fullPage: true });

    await page.goto("/studio/designs");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: `test-results/shot-designs-${label}.png`, fullPage: true });
  }
});
