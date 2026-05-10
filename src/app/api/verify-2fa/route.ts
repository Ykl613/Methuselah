import { createClient, createServiceClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyTotp } from "@/lib/totp";
import { logAudit } from "@/lib/auth";
import crypto from "crypto";

export async function POST(req: Request) {
  const { token } = await req.json();
  if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

  const sessionToken = cookies().get("pending_2fa_token")?.value;
  const credBundle = cookies().get("pending_2fa_cred")?.value;
  if (!sessionToken || !credBundle) return NextResponse.json({ error: "Session expired" }, { status: 401 });

  const secret = process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY!;

  // Verify signed token
  let userId: string;
  try {
    const decoded = Buffer.from(sessionToken, "base64url").toString();
    const [uid, expiresStr, sig] = decoded.split(":");
    const expires = parseInt(expiresStr, 10);
    if (Date.now() > expires) return NextResponse.json({ error: "Session expired" }, { status: 401 });
    const expected = crypto.createHmac("sha256", secret).update(`${uid}:${expiresStr}`).digest("hex");
    if (sig !== expected) return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    userId = uid;
  } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  // Decrypt credentials
  let email: string, password: string;
  try {
    const buf = Buffer.from(credBundle, "base64url");
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const enc = buf.subarray(28);
    const credKey = crypto.createHash("sha256").update(secret).digest();
    const decipher = crypto.createDecipheriv("aes-256-gcm", credKey, iv);
    decipher.setAuthTag(tag);
    const dec = Buffer.concat([decipher.update(enc), decipher.final()]).toString();
    ({ email, password } = JSON.parse(dec));
  } catch {
    return NextResponse.json({ error: "Invalid credentials envelope" }, { status: 401 });
  }

  const supabase = createClient();
  const { data: signIn, error: signErr } = await supabase.auth.signInWithPassword({ email, password });
  if (signErr) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  if (signIn.user.id !== userId) {
    await supabase.auth.signOut();
    return NextResponse.json({ error: "User mismatch" }, { status: 401 });
  }

  const { data: profile } = await supabase.from("user_profiles").select("*").eq("id", signIn.user.id).single();
  if (!profile?.totp_secret) {
    await supabase.auth.signOut();
    return NextResponse.json({ error: "2FA not configured" }, { status: 401 });
  }

  if (!verifyTotp(profile.totp_secret, token)) {
    await supabase.auth.signOut();
    return NextResponse.json({ error: "Invalid verification code" }, { status: 401 });
  }

  cookies().delete("pending_2fa_token");
  cookies().delete("pending_2fa_cred");

  const service = createServiceClient();
  await service.from("user_profiles").update({ last_active_at: new Date().toISOString() }).eq("id", profile.id);

  await logAudit({
    actorId: profile.id, actorLabel: profile.full_name,
    action: "auth.login", entityType: "user", entityId: profile.id,
    metadata: { method: "2fa" },
  });

  const redirect = profile.role === "admin" ? "/dashboard" : "/my-tasks";
  return NextResponse.json({ redirect });
}
