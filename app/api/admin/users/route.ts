import { NextResponse } from "next/server"
import { allQuery } from "@/lib/db-utils"
import { requireAdmin } from "@/lib/auth"

export async function GET() {
  try {
    await requireAdmin()

    const users = await allQuery(
      `
      SELECT 
        u.*,
        COUNT(DISTINCT b.id) as total_bookings,
        COUNT(DISTINCT CASE WHEN b.status = 'active' THEN b.id END) as active_bookings
      FROM users u
      LEFT JOIN bookings b ON u.id = b.user_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `
    )

    return NextResponse.json({ users })
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Forbidden") {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 })
    }
    console.error("[v0] Error fetching users:", error)
    return NextResponse.json({ error: "Ошибка получения пользователей" }, { status: 500 })
  }
}
