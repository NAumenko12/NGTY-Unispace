import { runQuery, getQuery, allQuery } from "./db-utils"

export type BookingStatus = 'active' | 'in_progress' | 'completed' | 'cancelled' | 'expired'

/**
 * Обновляет статусы всех броней на основе текущего времени
 * - in_progress: если бронь идет сейчас (время между start_time и end_time)
 * - completed: если время брони прошло
 * - expired: если дата брони в прошлом и время прошло
 */
export async function updateBookingStatuses() {
  try {
    const now = new Date()
    const currentDate = now.toISOString().split('T')[0] // YYYY-MM-DD
    const currentTime = now.toTimeString().slice(0, 5) // HH:MM

    // Обновляем брони, которые должны быть в процессе (время между start и end)
    const inProgressResult = await runQuery(`
      UPDATE bookings 
      SET status = 'in_progress' 
      WHERE status = 'active' 
        AND booking_date = ? 
        AND start_time <= ? 
        AND end_time > ?
    `, [currentDate, currentTime, currentTime])

    // Обновляем брони, которые должны быть завершены (время прошло, но дата сегодня)
    const completedResult = await runQuery(`
      UPDATE bookings 
      SET status = 'completed' 
      WHERE status IN ('active', 'in_progress') 
        AND booking_date = ? 
        AND end_time <= ?
    `, [currentDate, currentTime])

    // Обновляем брони, которые истекли (дата в прошлом)
    const expiredResult = await runQuery(`
      UPDATE bookings 
      SET status = 'expired' 
      WHERE status IN ('active', 'in_progress') 
        AND booking_date < ?
    `, [currentDate])

    console.log(`Updated ${inProgressResult.changes} in-progress, ${completedResult.changes} completed, and ${expiredResult.changes} expired bookings`)
    
    return {
      inProgress: inProgressResult.changes,
      completed: completedResult.changes,
      expired: expiredResult.changes
    }
  } catch (error) {
    console.error('Error updating booking statuses:', error)
    throw error
  }
}

/**
 * Получает статус брони с учетом текущего времени
 */
export function getBookingStatus(booking: {
  booking_date: string
  start_time: string
  end_time: string
  status: string
}): BookingStatus {
  const now = new Date()
  const currentDate = now.toISOString().split('T')[0]
  const currentTime = now.toTimeString().slice(0, 5)

  // Если статус уже не active или in_progress, возвращаем его
  if (!['active', 'in_progress'].includes(booking.status)) {
    return booking.status as BookingStatus
  }

  // Если дата в прошлом
  if (booking.booking_date < currentDate) {
    return 'expired'
  }

  // Если дата сегодня
  if (booking.booking_date === currentDate) {
    // Если время прошло
    if (booking.end_time <= currentTime) {
      return 'completed'
    }
    // Если бронь идет сейчас
    if (booking.start_time <= currentTime && booking.end_time > currentTime) {
      return 'in_progress'
    }
  }

  // Если дата в будущем или время еще не началось
  return 'active'
}

/**
 * Получает все брони с обновленными статусами
 */
export async function getBookingsWithUpdatedStatuses(userId?: number) {
  // Сначала обновляем статусы в базе
  await updateBookingStatuses()

  // Затем получаем брони
  let query = `
    SELECT 
      b.*,
      w.workspace_number,
      w.zone_type,
      w.has_monitor,
      bld.name as building_name,
      bld.address as building_address
    FROM bookings b
    JOIN workspaces w ON b.workspace_id = w.id
    JOIN buildings bld ON b.building_id = bld.id
  `
  
  const params: any[] = []
  
  if (userId) {
    query += " WHERE b.user_id = ?"
    params.push(userId)
  }
  
  query += " ORDER BY b.booking_date DESC, b.start_time DESC"

  return await allQuery(query, params)
}

/**
 * Проверяет, можно ли отменить бронь (за час до начала)
 */
export function canCancelBooking(booking: {
  booking_date: string
  start_time: string
  status: string
}): boolean {
  // Нельзя отменить уже отмененные, завершенные или истекшие брони
  if (['cancelled', 'completed', 'expired'].includes(booking.status)) {
    return false
  }

  const now = new Date()
  const currentDate = now.toISOString().split('T')[0]
  const currentTime = now.toTimeString().slice(0, 5)

  // Если дата в прошлом
  if (booking.booking_date < currentDate) {
    return false
  }

  // Если дата сегодня
  if (booking.booking_date === currentDate) {
    // Вычисляем время за час до начала брони
    const [startHour, startMinute] = booking.start_time.split(':').map(Number)
    const startTimeInMinutes = startHour * 60 + startMinute
    const oneHourBeforeInMinutes = startTimeInMinutes - 60
    
    const [currentHour, currentMinute] = currentTime.split(':').map(Number)
    const currentTimeInMinutes = currentHour * 60 + currentMinute

    // Если до начала брони меньше часа
    if (currentTimeInMinutes >= oneHourBeforeInMinutes) {
      return false
    }
  }

  return true
}

/**
 * Проверяет, можно ли забронировать время (не в прошлом)
 */
export function isTimeValid(date: string, startTime: string): boolean {
  const now = new Date()
  const currentDate = now.toISOString().split('T')[0]
  const currentTime = now.toTimeString().slice(0, 5)

  // Если дата в прошлом
  if (date < currentDate) {
    return false
  }

  // Если дата сегодня, проверяем время
  if (date === currentDate) {
    return startTime > currentTime
  }

  // Если дата в будущем - можно бронировать
  return true
}

/**
 * Проверяет, доступно ли рабочее место с учетом активных броней
 */
export async function isWorkspaceAvailable(
  workspaceId: number, 
  date: string, 
  startTime: string, 
  endTime: string
): Promise<boolean> {
  // Сначала проверяем, что время валидно (не в прошлом)
  if (!isTimeValid(date, startTime)) {
    return false
  }

  // Обновляем статусы
  await updateBookingStatuses()

  const existingBooking = await getQuery(`
    SELECT COUNT(*) as count FROM bookings 
    WHERE workspace_id = ? 
    AND booking_date = ? 
    AND status IN ('active', 'in_progress')
    AND (
      (start_time < ? AND end_time > ?) OR
      (start_time < ? AND end_time > ?) OR
      (start_time >= ? AND end_time <= ?)
    )
  `, [workspaceId, date, endTime, startTime, endTime, startTime, startTime, endTime])

  return existingBooking.count === 0
}
