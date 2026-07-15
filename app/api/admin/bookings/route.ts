import { type NextRequest, NextResponse } from "next/server"
import { allQuery } from "@/lib/db-utils"
import { requireAdmin } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const searchParams = request.nextUrl.searchParams
    const buildingId = searchParams.get("buildingId")
    const status = searchParams.get("status")

    let query = `
      SELECT 
        b.*,
        u.first_name,
        u.last_name,
        u.email,
        w.workspace_number,
        w.zone_type,
        bld.name as building_name,
        bld.address as building_address
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN workspaces w ON b.workspace_id = w.id
      JOIN buildings bld ON b.building_id = bld.id
      WHERE 1=1
    `
    const params: any[] = []

    if (buildingId) {
      query += " AND b.building_id = ?"
      params.push(buildingId)
    }

    if (status) {
      query += " AND b.status = ?"
      params.push(status)
    }

    query += " ORDER BY b.booking_date DESC, b.start_time DESC"

    const bookings = await allQuery(query, params)

    return NextResponse.json({ bookings })
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Forbidden") {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 })
    }
    console.error("[v0] Error fetching bookings:", error)
    return NextResponse.json({ error: "Ошибка получения бронирований" }, { status: 500 })
  }
}
