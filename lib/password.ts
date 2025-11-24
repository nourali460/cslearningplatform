import { customAlphabet } from 'nanoid'
import { db } from './db'

// Uppercase letters and numbers only (no confusing characters like 0/O, 1/I/L)
const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const generate6Char = customAlphabet(alphabet, 6)

/**
 * Generate a unique 6-character uppercase alphanumeric password
 * Format: A1B2C3, X9K7M2, etc.
 *
 * Ensures uniqueness by checking against all existing passwords in the database
 */
export async function generateUniquePassword(): Promise<string> {
  let password: string
  let attempts = 0
  const maxAttempts = 100 // Safety limit

  do {
    password = generate6Char()
    attempts++

    if (attempts > maxAttempts) {
      throw new Error('Failed to generate unique password after 100 attempts')
    }

    // Check if this password already exists
    const existingUser = await db.user.findFirst({
      where: { password },
    })

    // If no user has this password, we found a unique one
    if (!existingUser) {
      return password
    }

    // Otherwise, try again
  } while (true)
}

/**
 * Validate a password meets requirements
 * For our simple system: just check it's 6 characters
 */
export function isValidPassword(password: string): boolean {
  return password.length === 6
}

/**
 * Compare two passwords (plain text comparison)
 */
export function comparePasswords(provided: string, stored: string): boolean {
  return provided === stored
}
