import { type NextRequest, NextResponse } from "next/server"
import { getQuery } from "@/lib/db-utils"
import { verifyPassword, createToken } from "@/lib/auth"
import { cookies } from "next/headers"
import { isRateLimited } from "@/lib/utils"

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "local"
    if (isRateLimited(ip, "auth:login", 10, 60_000)) {
      return NextResponse.json({ error: "Слишком много попыток входа. Попробуйте позже." }, { status: 429 })
    }
    // небольшая анти-брутфорс задержка
    await new Promise((r) => setTimeout(r, 200))
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: "Email и пароль обязательны" }, { status: 400 })
    }

    // Поиск пользователя
    const user = await getQuery("SELECT * FROM users WHERE email = ?", [email])

    if (!user) {
      return NextResponse.json({ error: "Неверный email или пароль" }, { status: 401 })
    }

    // Проверка бана
    if (user.is_banned) {
      return NextResponse.json({ error: "Ваш аккаунт заблокирован" }, { status: 403 })
    }

    // Проверка пароля
    const isValid = await verifyPassword(password, user.password_hash)
    if (!isValid) {
      return NextResponse.json({ error: "Неверный email или пароль" }, { status: 401 })
    }

    const userData = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      studentId: user.student_id,
      faculty: user.faculty,
      course: user.course,
      isBanned: user.is_banned,
      avatarUrl: user.avatar_url || null,
    }

    // Создание токена
    const token = await createToken(userData)

    // Установка cookie
    const cookieStore = await cookies()
    cookieStore.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 дней
    })

    return NextResponse.json({ user: userData })
  } catch (error) {
    console.error("[v0] Login error:", error)
    return NextResponse.json({ error: "Ошибка при входе" }, { status: 500 })
  }
}
