import { type NextRequest, NextResponse } from "next/server"
import { runQuery, getQuery } from "@/lib/db-utils"
import { requireAuth } from "@/lib/auth"
import { canCancelBooking } from "@/lib/booking-status"

export async function DELETE(request: NextRequest, { params }: { params: any }) {
  try {
    const user = await requireAuth()
    const resolved = params && typeof params.then === "function" ? await params : params
    const { id } = resolved || {}

    // Проверяем, что бронирование принадлежит пользователю
    const booking = await getQuery("SELECT * FROM bookings WHERE id = ? AND user_id = ?", [Number(id), user.id])

    if (!booking) {
      return NextResponse.json({ error: "Бронирование не найдено" }, { status: 404 })
    }

    // Проверяем, можно ли отменить бронь
    if (!canCancelBooking(booking)) {
      return NextResponse.json({ error: "Бронирование нельзя отменить за час до начала" }, { status: 400 })
    }

    // Отменяем бронирование
    await runQuery("UPDATE bookings SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP WHERE id = ?", [Number(id)])

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }
    console.error("[v0] Error cancelling booking:", error)
    return NextResponse.json({ error: "Ошибка отмены бронирования" }, { status: 500 })
  }
}
