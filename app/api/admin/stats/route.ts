import { NextResponse } from "next/server"
import { getQuery, allQuery } from "@/lib/db-utils"
import { requireAdmin } from "@/lib/auth"

export async function GET() {
  try {
    await requireAdmin()

    const totalUsers = await getQuery("SELECT COUNT(*) as count FROM users WHERE role = 'student'")
    const totalBookings = await getQuery("SELECT COUNT(*) as count FROM bookings")
    const activeBookings = await getQuery("SELECT COUNT(*) as count FROM bookings WHERE status = 'active'")
    const totalWorkspaces = await getQuery("SELECT COUNT(*) as count FROM workspaces WHERE is_active = 1")

    const recentBookings = await allQuery(
      `
      SELECT 
        b.*,
        u.first_name,
        u.last_name,
        u.email,
        w.workspace_number,
        bld.name as building_name
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN workspaces w ON b.workspace_id = w.id
      JOIN buildings bld ON b.building_id = bld.id
      ORDER BY b.created_at DESC
      LIMIT 10
    `
    )

    return NextResponse.json({
      stats: {
        totalUsers: totalUsers?.count || 0,
        totalBookings: totalBookings?.count || 0,
        activeBookings: activeBookings?.count || 0,
        totalWorkspaces: totalWorkspaces?.count || 0,
      },
      recentBookings: Array.isArray(recentBookings) ? recentBookings : [],
    })
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Forbidden") {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 })
    }
    console.error("[v0] Error fetching stats:", error)
    return NextResponse.json({ error: "Ошибка получения статистики" }, { status: 500 })
  }
}
