import { createClient, createServiceClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { generateTotpSecret, generateQrCodeDataUrl, verifyTotp } from "@/lib/totp";
import { logAudit } from "@/lib/auth";

export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const preId = cookies().get("pre_2fa_user")?.value;
  const userId = user?.id || preId;
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const service = createServiceClient();
  const { data: profile } = await service.from("user_profiles").select("*").eq("id", userId).single();
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  if (profile.totp_enabled) {
    return NextResponse.json({ error: "2FA already enabled. Contact an admin to reset it." }, { status: 400 });
  }

  const { base32, otpauth } = generateTotpSecret(profile.email);
  await service.from("user_profiles").update({ totp_secret: base32 }).eq("id", userId);
  const qr = await generateQrCodeDataUrl(otpauth);
  return NextResponse.json({ qr, secret: base32 });
}

export async function PUT(req: Request) {
  const { token } = await req.json();
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const preId = cookies().get("pre_2fa_user")?.value;
  const userId = user?.id || preId;
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const service = createServiceClient();
  const { data: profile } = await service.from("user_profiles").select("*").eq("id", userId).single();
  if (!profile?.totp_secret) return NextResponse.json({ error: "Setup not started" }, { status: 400 });
  if (profile.totp_enabled) {
    return NextResponse.json({ error: "2FA already enabled" }, { status: 400 });
  }
  if (!verifyTotp(profile.totp_secret, token)) return NextResponse.json({ error: "Invalid code" }, { status: 401 });

  await service.from("user_profiles").update({ totp_enabled: true, last_active_at: new Date().toISOString() }).eq("id", userId);
  cookies().delete("pre_2fa_user");

  await logAudit({
    actorId: userId, actorLabel: profile.full_name,
    action: "auth.2fa_enabled", entityType: "user", entityId: userId,
  });

  const redirect = profile.role === "admin" ? "/dashboard" : "/my-tasks";
  return NextResponse.json({ redirect });
}
