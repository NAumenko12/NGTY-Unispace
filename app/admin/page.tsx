"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Calendar, Building2, Loader2, TrendingUp } from "lucide-react"
import Link from "next/link"

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()
  const [stats, setStats] = useState<any>(null)
  const [recentBookings, setRecentBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
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
        fetchStats()
      }
    }
  }, [user, authLoading])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/stats")
      if (!response.ok) throw new Error("Failed to fetch stats")
      const data = await response.json()
      setStats(data.stats)
      setRecentBookings(Array.isArray(data.recentBookings) ? data.recentBookings : [])
    } catch (error) {
      console.error("[v0] Error fetching stats:", error)
      setRecentBookings([]) // Устанавливаем пустой массив в случае ошибки
    } finally {
      setLoading(false)
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
          <h1 className="text-4xl font-bold mb-2">{t('admin.dashboard')}</h1>
          <p className="text-muted-foreground text-lg">{t('admin.description')}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('admin.totalUsers')}</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">{t('admin.registeredStudents')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('admin.activeBookings')}</CardTitle>
              <Calendar className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.activeBookings || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">{t('admin.currentBookings')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('admin.totalBookings')}</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalBookings || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">{t('admin.allTime')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('admin.totalWorkspaces')}</CardTitle>
              <Building2 className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalWorkspaces || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">{t('admin.availableForBooking')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Link href="/admin/users">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  {t('admin.userManagement')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t('admin.userManagementDesc')}
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/bookings">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {t('admin.bookingManagement')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{t('admin.bookingManagementDesc')}</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/library">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  {t('admin.libraryManagement')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{t('admin.libraryManagementDesc')}</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Bookings */}
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.recentBookings')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.isArray(recentBookings) && recentBookings.length > 0 ? (
                recentBookings.map((booking: any) => (
                  <div key={booking.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                    <div className="space-y-1">
                      <p className="font-medium">
                        {booking.first_name} {booking.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {booking.building_name} - {booking.workspace_number}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(booking.booking_date).toLocaleDateString("ru-RU")} {booking.start_time} -{" "}
                        {booking.end_time}
                      </p>
                    </div>
                    <Badge variant={booking.status === "active" ? "default" : "secondary"}>
                      {booking.status === "active" ? t('common.active') : t('common.completed')}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>{t('admin.noRecentBookings')}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
