import { NextResponse } from "next/server";
import qrcode from "qrcode";

// Generate a random base32 secret
function generateRandomSecret(length: number = 32): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// This route handles generating a new Time-based One-Time Password (TOTP) secret.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, issuer } = body;

    if (!name || !issuer) {
      return NextResponse.json(
        { message: "Name and issuer are required." },
        { status: 400 }
      );
    }

    // Generate a random secret (32 characters base32)
    const secret = generateRandomSecret(32);

    // Create the otpauth URL manually
    const otpauth_url = `otpauth://totp/${encodeURIComponent(
      issuer
    )}:${encodeURIComponent(name)}?secret=${secret}&issuer=${encodeURIComponent(
      issuer
    )}&algorithm=SHA1&digits=6&period=30`;

    // Generate a Data URL for the QR code image. This can be used directly in an <img> tag src.
    const qrCodeDataURL = await qrcode.toDataURL(otpauth_url);

    // Return the secret (in base32 format, which is standard) and the QR code image data.
    return NextResponse.json({
      success: true,
      secret: secret,
      qrCodeUrl: qrCodeDataURL,
      otpauth_url: otpauth_url, // For debugging
    });
  } catch (error) {
    console.error("Error generating TOTP secret:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate TOTP secret",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
