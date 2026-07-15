import { NextResponse } from "next/server"
import { updateBookingStatuses } from "@/lib/booking-status"
import { requireAdmin } from "@/lib/auth"

export async function POST() {
  try {
    await requireAdmin()
    
    const result = updateBookingStatuses()
    
    return NextResponse.json({ 
      message: "Статусы броней обновлены",
      updated: result
    })
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Forbidden") {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 })
    }
    console.error("[v0] Error updating booking statuses:", error)
    return NextResponse.json({ error: "Ошибка обновления статусов" }, { status: 500 })
  }
}
