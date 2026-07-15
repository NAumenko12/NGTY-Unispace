"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Calendar, Building2, Clock, Users, Loader2, Filter } from "lucide-react"
import { toast } from "sonner"

export default function AdminBookingsPage() {
  const { user, loading: authLoading } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()
  const [bookings, setBookings] = useState<any[]>([])
  const [buildings, setBuildings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBuilding, setSelectedBuilding] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login")
      } else if (user.role !== "admin") {
        router.push("/")
      } else {
        fetchBuildings()
        fetchBookings()
      }
    }
  }, [user, authLoading])

  useEffect(() => {
    if (user?.role === "admin") {
      fetchBookings()
    }
  }, [selectedBuilding, selectedStatus])

  const fetchBuildings = async () => {
    try {
      const response = await fetch("/api/buildings")
      const data = await response.json()
      setBuildings(data.buildings)
    } catch (error) {
      console.error("[v0] Error fetching buildings:", error)
    }
  }

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedBuilding !== "all") params.append("buildingId", selectedBuilding)
      if (selectedStatus !== "all") params.append("status", selectedStatus)

      const response = await fetch(`/api/admin/bookings?${params}`)
      if (!response.ok) throw new Error("Failed to fetch bookings")
      const data = await response.json()
      setBookings(Array.isArray(data.bookings) ? data.bookings : [])
    } catch (error) {
      console.error("[v0] Error fetching bookings:", error)
      toast.error("Ошибка загрузки бронирований")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ru-RU", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getZoneName = (zoneType: string) => {
    const zones: Record<string, string> = {
      quiet: t('zones.quiet'),
      group: t('zones.group'),
      informal: t('zones.informal'),
    }
    return zones[zoneType] || zoneType
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default">{t('common.active')}</Badge>
      case "completed":
        return <Badge variant="secondary">{t('common.completed')}</Badge>
      case "cancelled":
        return <Badge variant="destructive">{t('common.cancelled')}</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (authLoading || loading || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user || user.role !== "admin") return null

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{t('bookings.title')}</h1>
          <p className="text-muted-foreground text-lg">{t('bookings.description')}</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              {t('common.filter')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="building-filter">{t('bookings.building')}</Label>
                <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
                  <SelectTrigger id="building-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" className="z-[9999] bg-white border shadow-lg">
                    <SelectItem value="all">{t('bookings.allBuildings')}</SelectItem>
                    {buildings.map((building) => (
                      <SelectItem key={building.id} value={building.id.toString()}>
                        {building.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status-filter">{t('bookings.status')}</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger id="status-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" className="z-[9999] bg-white border shadow-lg">
                    <SelectItem value="all">{t('bookings.allStatuses')}</SelectItem>
                    <SelectItem value="active">{t('common.active')}</SelectItem>
                    <SelectItem value="completed">{t('common.completed')}</SelectItem>
                    <SelectItem value="cancelled">{t('common.cancelled')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {t('bookings.title')} ({bookings.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!Array.isArray(bookings) || bookings.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>{t('bookings.noBookings')}</p>
                </div>
              ) : (
                bookings.map((booking) => (
                  <div key={booking.id} className="border rounded-lg p-4">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg">{booking.building_name}</h3>
                            <p className="text-sm text-muted-foreground">{t('bookings.workspace')}: {booking.workspace_number}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">
                            {booking.first_name} {booking.last_name}
                          </span>
                          <span className="text-muted-foreground">({booking.email})</span>
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
                          {getStatusBadge(booking.status)}
                          <Badge variant="secondary">{getZoneName(booking.zone_type)}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
