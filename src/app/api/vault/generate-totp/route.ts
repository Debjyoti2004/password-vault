import { NextResponse } from 'next/server';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';

// This route handles generating a new Time-based One-Time Password (TOTP) secret.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, issuer } = body;

    if (!name || !issuer) {
      return NextResponse.json({ message: 'Name and issuer are required.' }, { status: 400 });
    }

    // Generate a new secret. The name and issuer are used by authenticator apps
    // to label the account (e.g., "LockBox (user@example.com)").
    const secret = speakeasy.generateSecret({
      length: 20,
      name: `${issuer} (${name})`,
    });

    // The otpauth_url is a standard URL format that authenticator apps understand.
    // We'll convert this URL into a QR code image.
    const otpauth_url = secret.otpauth_url;
    if (!otpauth_url) {
        throw new Error("Could not generate otpauth_url");
    }

    // Generate a Data URL for the QR code image. This can be used directly in an <img> tag src.
    const qrCodeDataURL = await qrcode.toDataURL(otpauth_url);

    // Return the secret (in base32 format, which is standard) and the QR code image data.
    return NextResponse.json({
      success: true,
      secret: secret.base32,
      qrCodeUrl: qrCodeDataURL,
    });

  } catch (error) {
    console.error("Error generating TOTP secret:", error);
    return NextResponse.json({ message: 'Failed to generate TOTP secret' }, { status: 500 });
  }
}
