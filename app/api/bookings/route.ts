import { type NextRequest, NextResponse } from "next/server"
import { runQuery, getQuery } from "@/lib/db-utils"
import { requireAuth } from "@/lib/auth"
import { isRateLimited } from "@/lib/utils"
import { getBookingsWithUpdatedStatuses, isWorkspaceAvailable, isTimeValid } from "@/lib/booking-status"

export async function GET() {
  try {
    const user = await requireAuth()
    if (!user?.id || typeof user.id !== "number") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    // Используем новую функцию, которая автоматически обновляет статусы
    const bookings = await getBookingsWithUpdatedStatuses(user.id)

    return NextResponse.json({ bookings })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }
    console.error("[v0] Error fetching bookings:", error)
    return NextResponse.json({ error: "Ошибка получения бронирований" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "local"
    if (isRateLimited(ip, "booking:create", 30, 60_000)) {
      return NextResponse.json({ error: "Слишком много запросов. Попробуйте позже." }, { status: 429 })
    }
    const user = await requireAuth()
    const body = await request.json()
    const { workspaceId, buildingId, date, startTime, endTime, zoneType } = body

    if (!workspaceId || !buildingId || !date || !startTime || !endTime) {
      return NextResponse.json({ error: "Не указаны обязательные параметры" }, { status: 400 })
    }

    // Проверяем, что время не в прошлом
    if (!isTimeValid(date, startTime)) {
      return NextResponse.json({ error: "Нельзя забронировать место на прошедшее время" }, { status: 400 })
    }

    // Проверяем доступность рабочего места с обновленными статусами
    if (!(await isWorkspaceAvailable(workspaceId, date, startTime, endTime))) {
      return NextResponse.json({ error: "Это рабочее место уже забронировано на выбранное время" }, { status: 400 })
    }

    // Если zoneType не передан (например, с мобильного), возьмем из workspace
    let zone = zoneType
    if (!zone) {
      const w = await getQuery("SELECT zone_type FROM workspaces WHERE id = ?", [workspaceId])
      zone = w?.zone_type || "quiet"
    }

    // Создаем бронирование
    const result = await runQuery(
      `INSERT INTO bookings (user_id, workspace_id, building_id, booking_date, start_time, end_time, zone_type)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user.id, workspaceId, buildingId, date, startTime, endTime, zone]
    )

    const booking = await getQuery(
      `SELECT 
        b.*,
        w.workspace_number,
        w.zone_type,
        w.has_monitor,
        bld.name as building_name
      FROM bookings b
      JOIN workspaces w ON b.workspace_id = w.id
      JOIN buildings bld ON b.building_id = bld.id
      WHERE b.id = ?`,
      [result.lastID]
    )

    return NextResponse.json({ booking })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }
    console.error("[v0] Error creating booking:", error)
    return NextResponse.json({ error: "Ошибка создания бронирования" }, { status: 500 })
  }
}
