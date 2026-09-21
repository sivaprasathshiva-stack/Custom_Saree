import { expect, test } from "@playwright/test";
import {
  createTestCustomer,
  deleteTestCustomer,
  sareePhotograph,
  type TestCustomer,
} from "./fixtures";

/**
 * The customer journey, end to end in a real browser (§70.3, §92).
 *
 * Upload → Compose → Create Woven Concept → Woven → Drape → Submit →
 * Confirmation → My Designs. This is the acceptance path §92 defines, and the
 * only thing that proves the screens actually work rather than merely
 * compiling.
 */

let customer: TestCustomer;

test.beforeAll(async () => {
  customer = await createTestCustomer();
});

test.afterAll(async () => {
  if (customer) await deleteTestCustomer(customer.id);
});

test("upload, compose, generate, drape, submit", async ({ page }) => {
  // --- sign in ------------------------------------------------------------
  await page.goto("/auth/login");
  await page.getByLabel(/email/i).fill(customer.email);
  await page.getByLabel(/password/i).first().fill(customer.password);
  await page.getByRole("button", { name: /sign in|log in/i }).first().click();

  // The session cookie is set during the post-login navigation. Navigating
  // before it lands leaves the browser anonymous and the Studio gate shows.
  await page.waitForURL((url) => !url.pathname.startsWith("/auth/login"), {
    timeout: 60_000,
  });

  // --- welcome ------------------------------------------------------------
  await page.goto("/studio");
  await expect(page.getByRole("heading", { name: /create your saree/i })).toBeVisible();

  await page.getByRole("button", { name: /start designing/i }).click();

  // --- upload -------------------------------------------------------------
  await expect(page).toHaveURL(/\/studio\/[0-9a-f-]+\/upload/);
  await expect(page.getByRole("heading", { name: /start with your saree/i })).toBeVisible();

  const designUrl = page.url();
  const designId = designUrl.match(/\/studio\/([0-9a-f-]+)\//)![1];

  await page.setInputFiles("#saree-upload", {
    name: "saree.png",
    mimeType: "image/png",
    buffer: await sareePhotograph(),
  });

  // Analysis is queued on upload and polled by the page (§8.4).
  await expect(page.getByText(/your saree is ready/i)).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText(/saree detected/i)).toBeVisible();

  await page.getByRole("button", { name: /^continue$/i }).click();

  // --- compose ------------------------------------------------------------
  await expect(page).toHaveURL(new RegExp(`/studio/${designId}/compose`));
  await expect(page.getByRole("heading", { name: /make it yours/i })).toBeVisible();

  // Generation must be refused while the canvas is empty (§13, AC-004).
  const generate = page.getByRole("button", { name: /create woven concept/i });
  await expect(generate).toBeDisabled();

  await page.getByRole("button", { name: /add text/i }).click();

  // Targeted by id: "Your words" is also the canvas object's accessible name,
  // so a label-based lookup is ambiguous by design.
  const textField = page.locator("#saree-text");
  await expect(textField).toBeVisible();
  await textField.fill("SEYAAN");

  // The character counter is the §9.2 contract made visible.
  await expect(page.getByText(/6 \/ 99 characters/i)).toBeVisible();

  // Autosave reports its own state (§46) — wait for it rather than sleeping.
  await expect(page.getByText(/^saved$/i)).toBeVisible({ timeout: 30_000 });

  await expect(generate).toBeEnabled();
  await generate.click();

  // --- processing and result ---------------------------------------------
  await expect(page).toHaveURL(new RegExp(`/studio/${designId}/woven`));
  await expect(
    page.getByRole("heading", { name: /your woven concept/i }),
  ).toBeVisible({ timeout: 90_000 });

  // The mandated §16.5 disclaimer must be on screen, not buried.
  await expect(page.getByText(/not a production-approved textile/i)).toBeVisible();

  // The original-vs-woven comparison (§16.3).
  await expect(page.getByLabel(/compare original and woven concept/i)).toBeVisible();

  // --- drape --------------------------------------------------------------
  await page.getByRole("link", { name: /see it on nila/i }).click();
  await expect(page).toHaveURL(new RegExp(`/studio/${designId}/drape`));
  await expect(page.getByRole("heading", { name: /see your saree draped/i })).toBeVisible();

  // Drape styles are configuration-driven (§19.3).
  await expect(page.getByRole("button", { name: /^classic$/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /^bridal$/i })).toBeVisible();

  // §25 disclaimer.
  await expect(page.getByText(/digital drape concept/i)).toBeVisible();

  // --- submit -------------------------------------------------------------
  await page.getByRole("link", { name: /send to velvorea/i }).click();
  await expect(page).toHaveURL(new RegExp(`/studio/${designId}/submit`));

  await page.getByLabel(/full name/i).fill("Anjali Rao");
  await page.getByLabel(/^email/i).fill(customer.email);
  await page.getByLabel(/phone/i).fill("+91 98765 43210");
  await page.getByLabel(/address line 1|address/i).first().fill("12 Loom Street");
  await page.getByLabel(/city/i).fill("Salem");

  const requiredBy = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  await page.getByLabel(/required-by date/i).fill(requiredBy);

  // §20.4 — submission must be refused until the acknowledgement is ticked.
  await page.getByRole("button", { name: /submit to velvorea/i }).click();
  await expect(page.getByText(/confirm you understand this is a digital concept/i)).toBeVisible();

  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: /submit to velvorea/i }).click();

  // --- confirmation -------------------------------------------------------
  await expect(page).toHaveURL(/\/submit\/confirmation/, { timeout: 60_000 });
  // Matched by role: Next's route announcer mirrors the heading text, so a
  // plain text match is ambiguous.
  await expect(
    page.getByRole("heading", { name: /your concept has reached velvorea/i }),
  ).toBeVisible();
  // The concept id is what support asks for (§21, §78). It appears in the
  // header and in the body, so match the first.
  await expect(page.getByText(/VL-\d{4}-\d{6}/).first()).toBeVisible();

  // --- my designs ---------------------------------------------------------
  await page.goto("/studio/designs");
  await expect(page.getByText(/VL-\d{4}-\d{6}/).first()).toBeVisible();
});
