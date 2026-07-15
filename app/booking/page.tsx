"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  Building2,
  Clock,
  Users,
  Monitor,
  CheckCircle2,
  Loader2,
  Laptop,
  Keyboard,
  Table,
  Armchair,
  Coffee,
  CupSoda,
} from "lucide-react"
import { toast } from "sonner"

const timeSlots = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
]

type IconComponent = typeof Monitor

type ZoneType = {
  id: string
  name: string
  icons: IconComponent[]
  accent: string
}

const zoneTypes: ZoneType[] = [
  {
    id: "quiet",
    name: "Тихая зона",
    icons: [Monitor, Laptop, Keyboard],
    accent: "text-blue-600",
  },
  {
    id: "group",
    name: "Групповая зона",
    icons: [Table, Armchair],
    accent: "text-purple-600",
  },
  {
    id: "informal",
    name: "Неформальная зона",
    icons: [Coffee, CupSoda],
    accent: "text-green-600",
  },
]

const zoneConfigMap = zoneTypes.reduce<Record<string, ZoneType>>((acc, zone) => {
  acc[zone.id] = zone
  return acc
}, {})

export default function BookingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const toLocalDate = (d: Date) => {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  const isTimeValid = (date: Date, startTime: string) => {
    const now = new Date()
    const currentDate = now.toISOString().split('T')[0]
    const currentTime = now.toTimeString().slice(0, 5)
    const selectedDate = toLocalDate(date)

    // Если дата в прошлом
    if (selectedDate < currentDate) {
      return false
    }

    // Если дата сегодня, проверяем время
    if (selectedDate === currentDate) {
      return startTime > currentTime
    }

    // Если дата в будущем - можно бронировать
    return true
  }

  const getAvailableTimeSlots = (date: Date) => {
    const now = new Date()
    const currentDate = now.toISOString().split('T')[0]
    const currentTime = now.toTimeString().slice(0, 5)
    const selectedDate = toLocalDate(date)

    // Если дата в прошлом, возвращаем пустой массив
    if (selectedDate < currentDate) {
      return []
    }

    // Если дата сегодня, фильтруем прошедшие времена
    if (selectedDate === currentDate) {
      return timeSlots.filter(time => time > currentTime)
    }

    // Если дата в будущем, возвращаем все времена
    return timeSlots
  }

  const [buildings, setBuildings] = useState<any[]>([])
  const [workspaces, setWorkspaces] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [bookingLoading, setBookingLoading] = useState(false)

  const [selectedBuilding, setSelectedBuilding] = useState(searchParams.get("building") || "")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedStartTime, setSelectedStartTime] = useState("09:00")
  const [selectedEndTime, setSelectedEndTime] = useState("12:00")
  const [selectedZone, setSelectedZone] = useState<string | null>(null)
  const [selectedWorkspace, setSelectedWorkspace] = useState<number | null>(null)
  const [bookingConfirmed, setBookingConfirmed] = useState(false)

  useEffect(() => {
    fetchBuildings()
    const id = setInterval(fetchBuildings, 30_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (selectedBuilding && selectedDate && selectedStartTime && selectedEndTime) {
      // Проверяем валидность времени перед запросом
      if (isTimeValid(selectedDate, selectedStartTime)) {
        fetchWorkspaces()
      }
    }
  }, [selectedBuilding, selectedDate, selectedStartTime, selectedEndTime, selectedZone])

  // Обновляем доступные временные слоты при изменении даты
  useEffect(() => {
    if (selectedDate) {
      const availableSlots = getAvailableTimeSlots(selectedDate)
      
      // Если выбранное время больше не доступно, сбрасываем его
      if (selectedStartTime && !availableSlots.includes(selectedStartTime)) {
        setSelectedStartTime(availableSlots[0] || "")
        setSelectedEndTime(availableSlots[1] || "")
      }
    }
  }, [selectedDate])

  const fetchBuildings = async () => {
    try {
      const response = await fetch("/api/buildings")
      const data = await response.json()
      setBuildings(data.buildings)
      if (data.buildings.length > 0 && !selectedBuilding) {
        setSelectedBuilding(data.buildings[0].id.toString())
      }
    } catch (error) {
      console.error("[v0] Error fetching buildings:", error)
      toast.error("Ошибка загрузки корпусов")
    }
  }

  const fetchWorkspaces = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        buildingId: selectedBuilding,
        date: toLocalDate(selectedDate!),
        startTime: selectedStartTime,
        endTime: selectedEndTime,
        ...(selectedZone && { zoneType: selectedZone }),
      })

      const response = await fetch(`/api/workspaces?${params}`)
      const data = await response.json()
      setWorkspaces(Array.isArray(data.workspaces) ? data.workspaces : [])
      setSelectedWorkspace(null)
    } catch (error) {
      console.error("[v0] Error fetching workspaces:", error)
      toast.error("Ошибка загрузки рабочих мест")
    } finally {
      setLoading(false)
    }
  }

  const handleBooking = async () => {
    if (!user) {
      // Показываем подсказку и уводим на страницу входа
      toast.error("Войдите в систему для бронирования")
      router.push("/login")
      return
    }

    if (!selectedWorkspace) {
      toast.error("Выберите рабочее место")
      return
    }

    setBookingLoading(true)
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: selectedWorkspace,
          buildingId: Number.parseInt(selectedBuilding),
          date: toLocalDate(selectedDate!),
          startTime: selectedStartTime,
          endTime: selectedEndTime,
          zoneType: selectedZone,
        }),
      })

      const contentType = response.headers.get("content-type") || ""
      if (!response.ok) {
        if (contentType.includes("application/json")) {
          const error = await response.json()
          throw new Error(error.error)
        }
        const text = await response.text()
        throw new Error(text || "Ошибка создания бронирования")
      }

      setBookingConfirmed(true)
      toast.success("Бронирование успешно создано!")
      setTimeout(() => {
        router.push("/my-bookings")
      }, 2000)
    } catch (error: any) {
      console.error("[v0] Error creating booking:", error)
      toast.error(error.message || "Ошибка создания бронирования")
    } finally {
      setBookingLoading(false)
    }
  }

  const filteredWorkspaces = Array.isArray(workspaces) ? workspaces : [] 

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Бронирование рабочего места</h1>
          <p className="text-muted-foreground text-lg">Выберите корпус, дату, время и конкретное рабочее место</p>
        </div>

        {bookingConfirmed && (
          <Card className="mb-6 border-accent bg-accent/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-accent">
                <CheckCircle2 className="w-6 h-6" />
                <div>
                  <p className="font-semibold">Бронирование подтверждено!</p>
                  <p className="text-sm text-muted-foreground">Перенаправление на страницу "Мои брони"...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Шаг 1: Выберите корпус и дату
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="building">Корпус</Label>
                  <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
                    <SelectTrigger id="building">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" className="z-[9999] bg-white border shadow-lg">
                      {buildings.map((building) => (
                        <SelectItem key={building.id} value={building.id.toString()}>
                          {building.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Дата</Label>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border w-fit"
                    disabled={(date) => date < new Date()}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Шаг 2: Выберите время
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="start-time">Начало</Label>
                    <Select value={selectedStartTime} onValueChange={setSelectedStartTime}>
                      <SelectTrigger id="start-time">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent position="popper" className="z-[9999] bg-white border shadow-lg">
                        {getAvailableTimeSlots(selectedDate || new Date()).map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="end-time">Окончание</Label>
                    <Select value={selectedEndTime} onValueChange={setSelectedEndTime}>
                      <SelectTrigger id="end-time">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent position="popper" className="z-[9999] bg-white border shadow-lg">
                        {getAvailableTimeSlots(selectedDate || new Date()).map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {getAvailableTimeSlots(selectedDate || new Date()).length === 0 ? (
                  <p className="text-sm text-destructive">
                    На выбранную дату нет доступных временных слотов
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Продолжительность: {Math.abs(Number.parseInt(selectedEndTime) - Number.parseInt(selectedStartTime))}{" "}
                    часов
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Шаг 3: Выберите тип зоны
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-3">
                  {zoneTypes.map((zone) => (
                    <button
                      key={zone.id}
                      onClick={() => setSelectedZone(zone.id)}
                      className={`p-4 rounded-lg border-2 transition-all text-center ${
                        selectedZone === zone.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className={`flex items-center justify-center gap-2 mb-2 ${zone.accent}`}>
                        {zone.icons.map((IconComponent, index) => (
                          <IconComponent key={`${zone.id}-icon-${index}`} className="w-6 h-6" strokeWidth={1.75} />
                        ))}
                      </div>
                      <div className="font-medium text-sm">{zone.name}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="w-5 h-5" />
                  Шаг 4: Выберите рабочее место
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : filteredWorkspaces.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>Нет доступных рабочих мест на выбранное время</p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                    {filteredWorkspaces.map((workspace) => {
                      const workspaceZoneType = (workspace.zone_type || workspace.zoneType || "") as string | undefined
                      const zoneConfig = workspaceZoneType ? zoneConfigMap[workspaceZoneType] : undefined

                      return (
                        <button
                          key={workspace.id}
                          onClick={() => workspace.available && setSelectedWorkspace(workspace.id)}
                          disabled={!workspace.available}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            !workspace.available
                              ? "opacity-50 cursor-not-allowed bg-muted"
                              : selectedWorkspace === workspace.id
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-lg">{workspace.workspace_number}</span>
                            {zoneConfig ? (
                              <div className={`flex items-center gap-1 ${zoneConfig.accent}`}>
                                {zoneConfig.icons.map((IconComponent, index) => (
                                  <IconComponent
                                    key={`${workspace.id}-${zoneConfig.id}-${index}`}
                                    className="w-4 h-4"
                                    strokeWidth={1.75}
                                  />
                                ))}
                              </div>
                            ) : workspace.has_monitor ? (
                              <Monitor className="w-4 h-4 text-muted-foreground" />
                            ) : null}
                          </div>
                          {!workspace.available && (
                            <div className="text-xs text-muted-foreground">
                              Занято: {workspace.occupantName || "пользователь"}
                            </div>
                          )}
                          <Badge variant={workspace.available ? "default" : "secondary"} className="text-xs">
                            {workspace.available ? "Свободно" : "Занято"}
                          </Badge>
                        </button>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:sticky lg:top-8 h-fit">
            <Card>
              <CardHeader>
                <CardTitle>Детали бронирования</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Корпус</Label>
                  <p className="font-medium">{buildings.find((b) => b.id.toString() === selectedBuilding)?.name}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground">Дата</Label>
                  <p className="font-medium">
                    {selectedDate?.toLocaleDateString("ru-RU", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>

                <div>
                  <Label className="text-muted-foreground">Время</Label>
                  <p className="font-medium">
                    {selectedStartTime} - {selectedEndTime}
                  </p>
                </div>

                {selectedZone && (
                  <div>
                    <Label className="text-muted-foreground">Тип зоны</Label>
                    <p className="font-medium">{zoneTypes.find((z) => z.id === selectedZone)?.name}</p>
                  </div>
                )}

                {selectedWorkspace && (
                  <div>
                    <Label className="text-muted-foreground">Рабочее место</Label>
                    <p className="font-medium">
                      {workspaces.find((w) => w.id === selectedWorkspace)?.workspace_number}
                    </p>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <Button
                    className="w-full"
                    size="lg"
                    disabled={!selectedWorkspace || bookingLoading}
                    onClick={handleBooking}
                  >
                    {bookingLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Бронирование...
                      </>
                    ) : (
                      "Подтвердить бронирование"
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-2">Бесплатная отмена за 1 час до начала</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
