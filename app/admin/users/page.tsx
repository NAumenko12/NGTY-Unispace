"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Users, Search, Ban, CheckCircle, Loader2, Mail } from "lucide-react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function AdminUsersPage() {
  const { user, loading: authLoading } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()
  const [users, setUsers] = useState<any[]>([])
  const [filteredUsers, setFilteredUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [actionType, setActionType] = useState<"ban" | "unban" | null>(null)
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
        fetchUsers()
      }
    }
  }, [user, authLoading])

  useEffect(() => {
    if (searchQuery) {
      const filtered = users.filter(
        (u) =>
          u.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.student_id?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredUsers(filtered)
    } else {
      setFilteredUsers(users)
    }
  }, [searchQuery, users])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users")
      if (!response.ok) throw new Error("Failed to fetch users")
      const data = await response.json()
      setUsers(Array.isArray(data.users) ? data.users : [])
      setFilteredUsers(Array.isArray(data.users) ? data.users : [])
    } catch (error) {
      console.error("[v0] Error fetching users:", error)
      toast.error("Ошибка загрузки пользователей")
    } finally {
      setLoading(false)
    }
  }

  const handleBanUser = async () => {
    if (!selectedUser) return

    try {
      const endpoint = actionType === "ban" ? "ban" : "unban"
      const response = await fetch(`/api/admin/users/${selectedUser.id}/${endpoint}`, {
        method: "POST",
      })

      if (!response.ok) throw new Error("Failed to update user")

      toast.success(actionType === "ban" ? "Пользователь заблокирован" : "Пользователь разблокирован")
      fetchUsers()
    } catch (error) {
      console.error("[v0] Error updating user:", error)
      toast.error("Ошибка обновления пользователя")
    } finally {
      setSelectedUser(null)
      setActionType(null)
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
          <h1 className="text-4xl font-bold mb-2">{t('users.title')}</h1>
          <p className="text-muted-foreground text-lg">{t('users.description')}</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              {t('users.title')} ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t('users.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-4">
              {Array.isArray(filteredUsers) && filteredUsers.length > 0 ? (
                filteredUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between border rounded-lg p-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-semibold text-lg">
                          {u.first_name} {u.last_name}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          {u.email}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {u.student_id && <Badge variant="outline">{u.student_id}</Badge>}
                      {u.faculty && <Badge variant="secondary">{u.faculty}</Badge>}
                      {u.course && <Badge variant="secondary">Курс {u.course}</Badge>}
                      {u.is_banned ? (
                        <Badge variant="destructive">{t('admin.banned')}</Badge>
                      ) : (
                        <Badge variant="default">{t('common.active')}</Badge>
                      )}
                    </div>

                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>{t('users.totalBookings')}: {u.total_bookings}</span>
                      <span>{t('common.active')}: {u.active_bookings}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {u.is_banned ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(u)
                          setActionType("unban")
                        }}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {t('admin.unban')}
                      </Button>
                    ) : (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(u)
                          setActionType("ban")
                        }}
                      >
                        <Ban className="w-4 h-4 mr-2" />
                        {t('admin.ban')}
                      </Button>
                    )}
                  </div>
                </div>
              ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Нет пользователей</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "ban" ? t('admin.banUser') : t('admin.unbanUser')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "ban"
                ? `${t('admin.banConfirm')} ${selectedUser?.first_name} ${selectedUser?.last_name}.`
                : `${t('admin.unbanConfirm')} ${selectedUser?.first_name} ${selectedUser?.last_name}.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleBanUser}>{t('common.confirm')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
