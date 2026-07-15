import { type NextRequest, NextResponse } from "next/server"
import { runQuery, getQuery } from "@/lib/db-utils"
import { hashPassword, createToken } from "@/lib/auth"
import { cookies } from "next/headers"
import { isRateLimited } from "@/lib/utils"

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "local"
    if (isRateLimited(ip, "auth:register", 5, 60_000)) {
      return NextResponse.json({ error: "Слишком много попыток регистрации. Попробуйте позже." }, { status: 429 })
    }
    // небольшая анти-брутфорс задержка
    await new Promise((r) => setTimeout(r, 300))
    const body = await request.json()
    const { email, password, firstName, lastName, studentId, faculty, course } = body

    // Валидация
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ error: "Все поля обязательны для заполнения" }, { status: 400 })
    }
    // Разрешаем любые домены email, доп. базовая проверка формата делает браузер/тип email

    // Проверка существующего пользователя
    const existingUser = await getQuery("SELECT id FROM users WHERE email = ?", [email])
    if (existingUser) {
      return NextResponse.json({ error: "Пользователь с таким email уже существует" }, { status: 400 })
    }

    // Минимальная политика паролей
    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json({ error: "Пароль должен быть не короче 8 символов" }, { status: 400 })
    }

    // Хеширование пароля
    const passwordHash = await hashPassword(password)

    // Создание пользователя
    const result = await runQuery(
      `INSERT INTO users (email, password_hash, first_name, last_name, student_id, faculty, course)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [email, passwordHash, firstName, lastName, studentId || null, faculty || null, course || null]
    )

    const user = {
      id: result.lastID as number,
      email,
      firstName,
      lastName,
      role: "student",
      studentId,
      faculty,
      course,
      isBanned: false,
    }

    // Создание токена
    const token = await createToken(user)

    // Установка cookie
    const cookieStore = await cookies()
    cookieStore.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 дней
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error("[v0] Registration error:", error)
    return NextResponse.json({ error: "Ошибка при регистрации" }, { status: 500 })
  }
}
