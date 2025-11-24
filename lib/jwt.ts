import { SignJWT, jwtVerify } from 'jose'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-minimum-32-characters-long'
const JWT_EXPIRES_IN = '7d' // 7 days

// Convert secret to Uint8Array for jose
const secret = new TextEncoder().encode(JWT_SECRET)

export interface JWTPayload {
  userId: string
  email: string
  role: 'admin' | 'professor' | 'student'
  iat?: number
  exp?: number
}

/**
 * Sign a JWT token with user payload
 */
export async function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
  const token = await new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(secret)

  return token
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as JWTPayload
  } catch (error) {
    // Token is invalid or expired
    console.error('JWT verification failed:', error)
    return null
  }
}

/**
 * Check if a token is expired
 */
export function isTokenExpired(payload: JWTPayload): boolean {
  if (!payload.exp) return true
  return Date.now() >= payload.exp * 1000
}
