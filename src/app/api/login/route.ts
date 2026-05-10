import { createServiceClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

// ============================================================================
// 2FA TEMPORARILY DISABLED
// To re-enable: change DISABLE_2FA to false. The 2FA flow code is preserved below.
// ============================================================================
const DISABLE_2FA = true;

export async function POST(req: Request) {
  const { email, password } = await req.json();
  if (!email || !password) return NextResponse.json({ error: "Email and password required" }, { status: 400 });

  // Verify credentials WITHOUT persisting session (using service client)
  const service = createServiceClient();
  const { data, error } = await service.auth.signInWithPassword({ email, password });
  if (error) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  const { data: profile } = await service.from("user_profiles").select("*").eq("id", data.user.id).single();
  if (!profile) return NextResponse.json({ error: "User profile not found" }, { status: 401 });
  if (!profile.is_active) {
    return NextResponse.json({ error: "Account disabled" }, { status: 403 });
  }

  // ===== 2FA DISABLED FLOW: sign in directly =====
  if (DISABLE_2FA) {
    const { createClient } = await import("@/lib/supabase-server");
    const auth = createClient();
    await auth.auth.signInWithPassword({ email, password });
    await service.from("user_profiles").update({ last_active_at: new Date().toISOString() }).eq("id", profile.id);
    const redirect = profile.role === "admin" ? "/dashboard" : "/my-tasks";
    return NextResponse.json({ redirect, bypass2FA: true });
  }

  // ===== 2FA ENABLED FLOW (preserved for future re-enable) =====
  if (!profile.totp_enabled) {
    // First-time 2FA setup - sign in via SSR client and route to /setup-2fa
    const { createClient } = await import("@/lib/supabase-server");
    const auth = createClient();
    await auth.auth.signInWithPassword({ email, password });
    cookies().set("pre_2fa_user", profile.id, {
      httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 600,
    });
    return NextResponse.json({ requires2FASetup: true });
  }

  // Has 2FA - generate signed token + encrypted credential bundle
  const secret = process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const expires = Date.now() + 5 * 60 * 1000;
  const payload = `${profile.id}:${expires}`;
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  const token = Buffer.from(`${payload}:${sig}`).toString("base64url");

  const credKey = crypto.createHash("sha256").update(secret).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", credKey, iv);
  const enc = Buffer.concat([cipher.update(JSON.stringify({ email, password })), cipher.final()]);
  const tag = cipher.getAuthTag();
  const credBundle = Buffer.concat([iv, tag, enc]).toString("base64url");

  cookies().set("pending_2fa_token", token, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 300,
  });
  cookies().set("pending_2fa_cred", credBundle, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 300,
  });
  return NextResponse.json({ requires2FA: true });
}
