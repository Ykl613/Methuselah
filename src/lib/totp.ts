import speakeasy from "speakeasy";
import QRCode from "qrcode";

export function generateTotpSecret(email: string) {
  const secret = speakeasy.generateSecret({
    name: `Methuselah (${email})`,
    issuer: "Methuselah",
    length: 20,
  });
  return { base32: secret.base32, otpauth: secret.otpauth_url! };
}

export async function generateQrCodeDataUrl(otpauth: string): Promise<string> {
  return await QRCode.toDataURL(otpauth);
}

export function verifyTotp(secret: string, token: string): boolean {
  return speakeasy.totp.verify({ secret, encoding: "base32", token, window: 1 });
}
