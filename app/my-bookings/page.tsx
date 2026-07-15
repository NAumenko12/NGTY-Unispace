"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Building2, Calendar, Clock, Monitor, Trash2, Mail, Loader2, Play, X } from "lucide-react"
import { toast } from "sonner"

export default function MyBookingsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    } else if (user) {
      fetchBookings()
    }
  }, [user, authLoading])

  const fetchBookings = async () => {
    try {
      const response = await fetch("/api/bookings")
      if (!response.ok) throw new Error("Failed to fetch bookings")
      const data = await response.json()
      setBookings(data.bookings)
    } catch (error) {
      console.error("[v0] Error fetching bookings:", error)
      toast.error("Ошибка загрузки бронирований")
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    const form = new FormData()
    form.append("file", file)
    setUploading(true)
    try {
      const res = await fetch("/api/profile/avatar", { method: "POST", body: form })
      const contentType = res.headers.get("content-type") || ""
      if (!res.ok) {
        const err = contentType.includes("application/json") ? await res.json() : { error: "Ошибка загрузки" }
        throw new Error(err.error)
      }
      toast.success("Аватар обновлен")
      // обновим пользователя
      window.location.reload()
    } catch (err: any) {
      toast.error(err.message || "Ошибка загрузки аватара")
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  const handleCancelBooking = async (id: number) => {
    try {
      const response = await fetch(`/api/bookings/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      toast.success("Бронирование отменено")
      fetchBookings()
    } catch (error: any) {
      console.error("[v0] Error cancelling booking:", error)
      toast.error(error.message || "Ошибка отмены бронирования")
    }
  }

  const activeBookings = bookings.filter((b) => b.status === "active")
  const inProgressBookings = bookings.filter((b) => b.status === "in_progress")
  const completedBookings = bookings.filter((b) => b.status === "completed")
  const cancelledBookings = bookings.filter((b) => b.status === "cancelled")
  const expiredBookings = bookings.filter((b) => b.status === "expired")

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ru-RU", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getZoneName = (zoneType: string) => {
    const zones: Record<string, string> = {
      quiet: "Тихая зона",
      group: "Групповая зона",
      informal: "Неформальная зона",
    }
    return zones[zoneType] || zoneType
  }

  const getStatusInfo = (booking: any) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon?: any }> = {
      active: { label: "Активна", variant: "default" },
      in_progress: { label: "Идет", variant: "secondary", icon: Play },
      completed: { label: "Завершена", variant: "secondary" },
      cancelled: { label: "Отменена", variant: "destructive", icon: X },
      expired: { label: "Истекла", variant: "destructive" },
    }
    return statusMap[booking.status] || { label: booking.status, variant: "default" }
  }

  const canCancelBooking = (booking: any) => {
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Мои брони</h1>
          <p className="text-muted-foreground text-lg">Управляйте своими бронированиями и профилем</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* User Profile Card */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Профиль</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="w-24 h-24 mb-4">
                    {user && (user as any).avatarUrl && (
                      <AvatarImage src={(user as any).avatarUrl} alt={`${user.firstName} ${user.lastName}`} />
                    )}
                    <AvatarFallback className="text-2xl bg-primary text-white">
                      {((user.firstName || "").trim().charAt(0) || "U")}
                      {((user.lastName || "").trim().charAt(0) || "S")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="mt-2">
                    <label className="text-sm text-primary cursor-pointer">
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                      {uploading ? "Загрузка..." : "Загрузить аватар"}
                    </label>
                  </div>
                  <h3 className="font-bold text-xl mb-1">
                    {user.firstName} {user.lastName}
                  </h3>
                  {user.faculty && <p className="text-sm text-muted-foreground mb-2">{user.faculty}</p>}
                  {user.studentId && (
                    <Badge variant="secondary" className="text-xs">
                      {user.studentId}
                    </Badge>
                  )}
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{user.email}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Активных броней</span>
                    <span className="font-semibold">{activeBookings.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Идет сейчас</span>
                    <span className="font-semibold">{inProgressBookings.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Завершенных броней</span>
                    <span className="font-semibold">{completedBookings.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Отмененных броней</span>
                    <span className="font-semibold">{cancelledBookings.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Истекших броней</span>
                    <span className="font-semibold">{expiredBookings.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bookings List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active and In-Progress Bookings */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Активные бронирования</h2>
              {activeBookings.length === 0 && inProgressBookings.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">У вас пока нет активных бронирований</p>
                    <Button className="mt-4" asChild>
                      <a href="/booking">Забронировать место</a>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {[...activeBookings, ...inProgressBookings].map((booking) => {
                    const statusInfo = getStatusInfo(booking)
                    const canCancel = canCancelBooking(booking)
                    const StatusIcon = statusInfo.icon
                    
                    return (
                    <Card key={booking.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div className="space-y-3 flex-1">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Building2 className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <h3 className="font-bold text-lg">{booking.building_name}</h3>
                                <p className="text-sm text-muted-foreground">Место: {booking.workspace_number}</p>
                              </div>
                            </div>

                            <div className="grid gap-2 sm:grid-cols-2">
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span>{formatDate(booking.booking_date)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <span>
                                  {booking.start_time} - {booking.end_time}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <Badge variant="secondary">{getZoneName(booking.zone_type)}</Badge>
                              <Badge variant={statusInfo.variant} className="gap-1">
                                {StatusIcon && <StatusIcon className="w-3 h-3" />}
                                {statusInfo.label}
                              </Badge>
                              {booking.has_monitor && (
                                <Badge variant="outline" className="gap-1">
                                  <Monitor className="w-3 h-3" />
                                  Монитор
                                </Badge>
                              )}
                            </div>
                          </div>

                          {canCancel && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleCancelBooking(booking.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Отменить
                            </Button>
                          )}
                          {!canCancel && booking.status === 'active' && (
                            <div className="text-sm text-muted-foreground">
                              Отмена недоступна за час до начала
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Completed, Cancelled and Expired Bookings */}
            {(completedBookings.length > 0 || cancelledBookings.length > 0 || expiredBookings.length > 0) && (
              <div>
                <h2 className="text-2xl font-bold mb-4">История бронирований</h2>
                <div className="space-y-4">
                  {[...completedBookings, ...cancelledBookings, ...expiredBookings].map((booking) => {
                    const statusInfo = getStatusInfo(booking)
                    const StatusIcon = statusInfo.icon
                    
                    return (
                    <Card key={booking.id} className="opacity-75">
                      <CardContent className="pt-6">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div className="space-y-3 flex-1">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                                <Building2 className="w-5 h-5 text-muted-foreground" />
                              </div>
                              <div>
                                <h3 className="font-bold text-lg">{booking.building_name}</h3>
                                <p className="text-sm text-muted-foreground">Место: {booking.workspace_number}</p>
                              </div>
                            </div>

                            <div className="grid gap-2 sm:grid-cols-2">
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span>{formatDate(booking.booking_date)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <span>
                                  {booking.start_time} - {booking.end_time}
                                </span>
                              </div>
                            </div>

                            <Badge variant={statusInfo.variant} className="gap-1">
                              {StatusIcon && <StatusIcon className="w-3 h-3" />}
                              {statusInfo.label}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
