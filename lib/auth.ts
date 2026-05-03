import { SignJWT, jwtVerify } from "jose"

const SESSION_COOKIE = "admin_session"
const SESSION_MAX_AGE = 60 * 60 * 24 // 24 h in seconds

function jwtSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET environment variable must be set in production")
    }
    return new TextEncoder().encode("dev-secret-change-in-production")
  }
  return new TextEncoder().encode(secret)
}

export async function signAdminJWT(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(jwtSecret())
}

export async function verifyAdminJWT(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, jwtSecret())
    return true
  } catch {
    return false
  }
}

export { SESSION_COOKIE, SESSION_MAX_AGE }
