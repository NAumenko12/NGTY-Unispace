import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"

export async function GET() {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    return NextResponse.json({ error: "Ошибка получения данных пользователя" }, { status: 500 })
  }
}
