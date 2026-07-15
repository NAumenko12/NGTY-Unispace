import { NextResponse } from "next/server"
import { allQuery } from "@/lib/db-utils"
import { updateBookingStatuses } from "@/lib/booking-status"

export async function GET() {
  try {
    // Обновляем статусы броней перед подсчетом статистики
    await updateBookingStatuses()
    
    // Отдаём корпуса вместе с live-статистикой: total, bookedToday, occupiedNow, free, zones
    const rows = await allQuery(
      `SELECT b.*, 
        (
          SELECT COUNT(*) FROM workspaces w 
          WHERE w.building_id = b.id AND w.is_active = 1
        ) as total_workspaces,
        (
          SELECT COUNT(*) FROM bookings bk 
          WHERE bk.building_id = b.id 
            AND bk.booking_date = date('now')
            AND bk.status IN ('active', 'in_progress')
        ) as booked_today,
        (
          SELECT COUNT(*) FROM bookings bk 
          WHERE bk.building_id = b.id 
            AND bk.booking_date = date('now')
            AND bk.status = 'in_progress'
        ) as occupied_now,
        (
          SELECT COUNT(*) FROM workspaces w 
          WHERE w.building_id = b.id AND w.is_active = 1 AND w.zone_type = 'quiet'
        ) as quiet_zones,
        (
          SELECT COUNT(*) FROM workspaces w 
          WHERE w.building_id = b.id AND w.is_active = 1 AND w.zone_type = 'group'
        ) as group_zones,
        (
          SELECT COUNT(*) FROM workspaces w 
          WHERE w.building_id = b.id AND w.is_active = 1 AND w.zone_type = 'informal'
        ) as informal_zones
      FROM buildings b
      WHERE b.is_active = 1
      ORDER BY b.name`
    )
    const seen = new Set<string>()
    const buildings = rows.filter((b) => {
      const key = `${b.name}|${b.address}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    const enriched = buildings.map((b) => {
      const total = b.total_workspaces || 0
      const booked = b.booked_today || 0
      const occupied = b.occupied_now || 0
      const free = Math.max(total - booked, 0)
      const percentBooked = total > 0 ? Math.round((booked / total) * 100) : 0
      const percentOccupied = total > 0 ? Math.round((occupied / total) * 100) : 0
      const percentFree = total > 0 ? Math.round((free / total) * 100) : 0
      return { 
        ...b, 
        total, 
        booked, 
        occupied, 
        free, 
        percentBooked, 
        percentOccupied, 
        percentFree,
        zones: {
          quiet: b.quiet_zones || 0,
          group: b.group_zones || 0,
          informal: b.informal_zones || 0
        }
      }
    })

    return NextResponse.json({ buildings: enriched })
  } catch (error) {
    console.error("[v0] Error fetching buildings:", error)
    return NextResponse.json({ error: "Ошибка получения списка корпусов" }, { status: 500 })
  }
}
