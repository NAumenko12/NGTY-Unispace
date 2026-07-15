import { type NextRequest, NextResponse } from "next/server"
import { allQuery, getQuery } from "@/lib/db-utils"
import { updateBookingStatuses, isTimeValid } from "@/lib/booking-status"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const buildingId = searchParams.get("buildingId")
    const date = searchParams.get("date")
    const startTime = searchParams.get("startTime")
    const endTime = searchParams.get("endTime")
    const zoneType = searchParams.get("zoneType")

    if (!buildingId || !date || !startTime || !endTime) {
      return NextResponse.json({ error: "Не указаны обязательные параметры" }, { status: 400 })
    }

    // Проверяем, что время не в прошлом
    if (!isTimeValid(date, startTime)) {
      return NextResponse.json({ error: "Нельзя забронировать место на прошедшее время" }, { status: 400 })
    }

    // Обновляем статусы броней перед проверкой доступности
    await updateBookingStatuses()

    // Получаем все рабочие места в корпусе
    let query = "SELECT * FROM workspaces WHERE building_id = ? AND is_active = 1"
    const params: any[] = [buildingId]

    if (zoneType) {
      query += " AND zone_type = ?"
      params.push(zoneType)
    }

    const workspaces = await allQuery(query, params)

    // Проверяем доступность каждого рабочего места
    const checkBookingQuery = `
      SELECT COUNT(*) as count FROM bookings 
      WHERE workspace_id = ? 
      AND booking_date = ? 
      AND status = 'active'
      AND (
        (start_time < ? AND end_time > ?) OR
        (start_time < ? AND end_time > ?) OR
        (start_time >= ? AND end_time <= ?)
      )
    `

    const availableWorkspaces = Array.isArray(workspaces) 
      ? await Promise.all(workspaces
          .filter((workspace) => workspace && workspace.id) // Фильтруем null/undefined workspace
          .map(async (workspace) => {
            const result = await getQuery(checkBookingQuery, [
              workspace.id, date, endTime, startTime, endTime, startTime, startTime, endTime
            ]) as { count: number } | undefined

            let occupantName: string | null = null
            if (result && result.count > 0) {
              const occ = await getQuery(
                `
                  SELECT u.first_name as firstName, u.last_name as lastName, u.email as email
                  FROM bookings b
                  JOIN users u ON u.id = b.user_id
                  WHERE b.workspace_id = ?
                    AND b.booking_date = ?
                    AND b.status = 'active'
                    AND (
                      (b.start_time < ? AND b.end_time > ?) OR
                      (b.start_time < ? AND b.end_time > ?) OR
                      (b.start_time >= ? AND b.end_time <= ?)
                    )
                  LIMIT 1
                `,
                [workspace.id, date, endTime, startTime, endTime, startTime, startTime, endTime]
              ) as { firstName: string; lastName: string; email: string } | undefined
              if (occ) occupantName = `${occ.firstName} ${occ.lastName}`
            }

            return {
              ...workspace,
              available: result ? result.count === 0 : true,
              equipment: workspace.equipment ? JSON.parse(workspace.equipment) : null,
              occupantName,
            }
          }))
      : []

    return NextResponse.json({ workspaces: availableWorkspaces })
  } catch (error) {
    console.error("[v0] Error fetching workspaces:", error)
    return NextResponse.json({ error: "Ошибка получения рабочих мест" }, { status: 500 })
  }
}
