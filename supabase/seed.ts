import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "yehiel@ykl.asia";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "ChangeMe2026!";

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function seed() {
  console.log("Methuselah seed: starting...");

  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existing = existingUsers?.users.find((u) => u.email === ADMIN_EMAIL);

  let userId: string;
  if (existing) {
    console.log(`Admin user exists: ${ADMIN_EMAIL}`);
    userId = existing.id;
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
    });
    if (error) throw error;
    userId = data.user.id;
    console.log(`Created admin user: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  }

  const { error: profileError } = await supabase.from("user_profiles").upsert({
    id: userId,
    email: ADMIN_EMAIL,
    full_name: "Yehiel",
    role: "admin",
    is_active: true,
  });
  if (profileError) throw profileError;

  console.log("Seed complete.");
  console.log(`Login: ${ADMIN_EMAIL}`);
  console.log(`Password: ${ADMIN_PASSWORD}`);
  console.log("Change the password after first login.");
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
