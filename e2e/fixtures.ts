import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

/**
 * E2E fixtures: a disposable real customer and a real saree photograph.
 *
 * The account is created through the Supabase admin API with email confirmed,
 * because the Studio's Google sign-in gate cannot be driven headlessly — but
 * email/password is enabled on the project, and the session it produces is
 * identical as far as the app is concerned.
 */

export function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase service role is not configured for E2E.");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export interface TestCustomer {
  id: string;
  email: string;
  password: string;
}

export async function createTestCustomer(): Promise<TestCustomer> {
  const email = `e2e-${crypto.randomUUID()}@velvorea-test.invalid`;
  const password = `Pw-${crypto.randomUUID()}`;

  const { data, error } = await adminClient().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`Could not create test customer: ${error?.message}`);

  return { id: data.user.id, email, password };
}

/** Deleting the auth user cascades designs, assets, jobs and versions. */
export async function deleteTestCustomer(userId: string): Promise<void> {
  await adminClient().auth.admin.deleteUser(userId).catch(() => undefined);
}

/**
 * A real, decodable PNG that looks enough like a saree for the canvas to
 * render sensibly — a solid ground with a contrasting border band.
 */
export async function sareePhotograph(): Promise<Buffer> {
  const width = 800;
  const height = 1200;

  return sharp({
    create: { width, height, channels: 3, background: { r: 107, g: 39, b: 55 } },
  })
    .composite([
      {
        input: await sharp({
          create: { width: 64, height, channels: 3, background: { r: 173, g: 138, b: 78 } },
        })
          .png()
          .toBuffer(),
        left: 0,
        top: 0,
      },
      {
        input: await sharp({
          create: { width, height: 300, channels: 3, background: { r: 177, g: 85, b: 47 } },
        })
          .png()
          .toBuffer(),
        left: 0,
        top: height - 300,
      },
    ])
    .png()
    .toBuffer();
}
