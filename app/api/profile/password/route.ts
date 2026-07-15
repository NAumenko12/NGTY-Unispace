import { NextResponse } from "next/server"
import { getQuery, runQuery } from "@/lib/db-utils"
import { requireAuth, hashPassword, verifyPassword } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Укажите текущий и новый пароль" }, { status: 400 })
    }
    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json({ error: "Пароль должен быть не короче 8 символов" }, { status: 400 })
    }

    const row = await getQuery("SELECT password_hash FROM users WHERE id = ?", [user.id]) as any
    const ok = await verifyPassword(currentPassword, row.password_hash)
    if (!ok) {
      return NextResponse.json({ error: "Текущий пароль неверен" }, { status: 400 })
    }

    const newHash = await hashPassword(newPassword)
    await runQuery("UPDATE users SET password_hash = ? WHERE id = ?", [newHash, user.id])

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }
    console.error("[v0] Change password error:", error)
    return NextResponse.json({ error: "Ошибка смены пароля" }, { status: 500 })
  }
}


