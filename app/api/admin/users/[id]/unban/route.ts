import { type NextRequest, NextResponse } from "next/server"
import { runQuery } from "@/lib/db-utils"
import { requireAdmin } from "@/lib/auth"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    const { id } = await params

    await runQuery("UPDATE users SET is_banned = 0 WHERE id = ?", [id])

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Forbidden") {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 })
    }
    console.error("[v0] Error unbanning user:", error)
    return NextResponse.json({ error: "Ошибка разблокировки пользователя" }, { status: 500 })
  }
}
