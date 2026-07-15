import { EncryptJWT, jwtDecrypt } from "jose"
import crypto from "crypto"
import { cookies } from "next/headers"
import bcrypt from "bcryptjs"
import { getQuery } from "./db-utils"

// Для JWE A256GCM требуется ключ ровно 256 бит. Берём SHA-256 от секретной строки
const secret = crypto
  .createHash("sha256")
  .update(process.env.JWT_SECRET || "your-secret-key-change-in-production")
  .digest()

export interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  role: string
  studentId?: string
  faculty?: string
  course?: number
  isBanned: boolean
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createToken(user: User): Promise<string> {
  // Шифруем payload пользователя (JWE, A256GCM)
  return await new EncryptJWT({
    id: user.id,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .encrypt(secret)
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtDecrypt(token, secret)
    return payload
  } catch (err) {
    return null
  }
}

export async function getSession(): Promise<User | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  if (!token) return null

  const payload = await verifyToken(token)
  if (!payload) return null

  const user = await getQuery("SELECT * FROM users WHERE id = ?", [payload.id as number]) as any

  if (!user || user.is_banned) return null

  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    role: user.role,
    studentId: user.student_id,
    faculty: user.faculty,
    course: user.course,
    isBanned: user.is_banned,
    // прокидываем url на аватар
    // @ts-ignore
    avatarUrl: user.avatar_url || null,
  }
}

export async function requireAuth() {
  const user = await getSession()
  if (!user) {
    throw new Error("Unauthorized")
  }
  return user
}

export async function requireAdmin() {
  const user = await requireAuth()
  if (user.role !== "admin") {
    throw new Error("Forbidden")
  }
  return user
}
