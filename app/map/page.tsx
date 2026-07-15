"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, ArrowRight, Loader2 } from "lucide-react"
import Script from "next/script"
import { toast } from "sonner"

const buildings = [
  {
    id: "korpus-1",
    name: "Корпус 1",
    fullName: "1 корпус НГТУ",
    address: "пр. Карла Маркса, 20",
    zones: { quiet: 12, group: 6, informal: 4 },
    available: 14,
    total: 22,
    coordinates: [54.987746, 82.906335],
  },
  {
    id: "korpus-2",
    name: "Корпус 2",
    fullName: "2 корпус - Факультет энергетики",
    address: "пр. Карла Маркса, 20, корп. 2",
    zones: { quiet: 15, group: 8, informal: 5 },
    available: 18,
    total: 28,
    coordinates: [54.986573, 82.905491],
  },
  {
    id: "korpus-3a-3b",
    name: "Корпус 3а-3б",
    fullName: "3а-3б корпуса - Факультет летательных аппаратов НГТУ",
    address: "Геодезическая ул., 10",
    zones: { quiet: 18, group: 9, informal: 6 },
    available: 20,
    total: 33,
    coordinates: [54.986656, 82.908536],
  },
  {
    id: "korpus-4",
    name: "Корпус 4",
    fullName: "4 корпус НГТУ - Факультет радиотехники и электроники",
    address: "пр. Карла Маркса, 20к4",
    zones: { quiet: 25, group: 10, informal: 8 },
    available: 30,
    total: 43,
    coordinates: [54.985467, 82.907099],
  },
  {
    id: "korpus-6",
    name: "Корпус 6",
    fullName: "6 корпус НГТУ",
    address: "пр. Карла Маркса, 20к6",
    zones: { quiet: 16, group: 8, informal: 6 },
    available: 19,
    total: 30,
    coordinates: [54.986402, 82.903766],
  },
  {
    id: "korpus-7",
    name: "Корпус 7",
    fullName: "7 корпус НГТУ",
    address: "ул. Немировича-Данченко, 136",
    zones: { quiet: 18, group: 10, informal: 7 },
    available: 22,
    total: 35,
    coordinates: [54.987162, 82.915031],
  },
  {
    id: "korpus-8",
    name: "Корпус 8",
    fullName: "8 корпус - Институт социальных технологий и реабилитации",
    address: "пр. Карла Маркса, 20к8",
    zones: { quiet: 11, group: 6, informal: 4 },
    available: 13,
    total: 21,
    coordinates: [54.986315, 82.907099],
  },
]

export default function MapPage() {
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [buildingsData, setBuildingsData] = useState<any[]>([])
  const [dataLoading, setDataLoading] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const fetchBuildings = async () => {
    try {
      setDataLoading(true)
      const response = await fetch("/api/buildings")
      const data = await response.json()
      if (data.buildings) {
        setBuildingsData(data.buildings)
      }
    } catch (error) {
      console.error("Error fetching buildings:", error)
      // Не показываем ошибку пользователю, просто логируем
    } finally {
      setDataLoading(false)
    }
  }

  useEffect(() => {
    // Загружаем данные сразу, но не блокируем рендеринг
    fetchBuildings()
    const interval = setInterval(fetchBuildings, 30000) // Обновляем каждые 30 секунд
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!mounted || !mapLoaded || !mapRef.current || typeof window === "undefined") return
    const L = (window as any).L
    if (!L) return
    
    // Определяем размер экрана для мобильных устройств
    const isMobile = window.innerWidth < 768
    const map = L.map(mapRef.current).setView([54.986656, 82.907099], isMobile ? 14 : 15)
    mapInstanceRef.current = map
    
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
      // Улучшаем загрузку на мобильных
      ...(isMobile && {
        subdomains: ['a', 'b', 'c'],
        detectRetina: true
      })
    }).addTo(map)

    const draw = () => {
      buildings.forEach((building) => {
      const availabilityPercentage = (building.available / building.total) * 100
      let color = "#10b981"
      if (availabilityPercentage <= 20) color = "#ef4444"
      else if (availabilityPercentage <= 50) color = "#eab308"

      const marker = L.circleMarker(building.coordinates, {
        radius: 10,
        color,
        fillColor: color,
        fillOpacity: 0.8,
      }).addTo(map)
      marker.bindPopup(
        `<div style="min-width:220px"><strong>${building.fullName}</strong><br/>` +
          `<span>Адрес: ${building.address}</span><br/>` +
          `<span>Свободно: ${building.available} из ${building.total}</span><br/>` +
          `<a href="/booking?building=${building.id}" style="color:#3b82f6">Забронировать →</a></div>`,
      )
      marker.on("click", () => setSelectedBuilding(building.id))
      })
    }
    draw()
    const interval = setInterval(draw, 30_000)
    return () => clearInterval(interval)
  }, [mounted, mapLoaded])

  const getAvailabilityColor = (available: number, total: number) => {
    const percentage = (available / total) * 100
    if (percentage > 50) return "bg-accent"
    if (percentage > 20) return "bg-yellow-500"
    return "bg-destructive"
  }

  return (
    <>
      <Script
        src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        strategy="afterInteractive"
        onLoad={() => setMapLoaded(true)}
      />
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />

      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-7xl px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Карта корпусов НГТУ</h1>
            <p className="text-muted-foreground text-lg">Выберите корпус для просмотра доступных мест</p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Yandex Map */}
            <Card className="lg:sticky lg:top-8 h-fit z-10">
              <CardHeader>
                <CardTitle>Интерактивная карта</CardTitle>
              </CardHeader>
              <CardContent>
                <div ref={mapRef} className="w-full h-[400px] sm:h-[600px] rounded-lg overflow-hidden bg-muted relative z-0">
                  {!mounted || !mapLoaded ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Загрузка карты...</p>
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Legend */}
                <div className="mt-6 flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-accent" />
                    <span>Много мест</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span>Средняя загрузка</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-destructive" />
                    <span>Мало мест</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Buildings List */}
            <div className="space-y-4">
              {dataLoading && buildingsData.length > 0 && (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary mr-2" />
                  <span className="text-sm text-muted-foreground">Обновление данных...</span>
                </div>
              )}
              {buildingsData.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Загрузка данных корпусов...</span>
                </div>
              ) : (
                buildingsData.map((building) => {
                  const isSelected = selectedBuilding === building.id.toString()
                  const availabilityPercentage = building.percentFree || 0

                return (
                  <Card
                    key={building.id}
                    className={`transition-all cursor-pointer ${
                      isSelected ? "ring-2 ring-primary shadow-lg" : "hover:shadow-md"
                    }`}
                    onClick={() => setSelectedBuilding(building.id.toString())}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold mb-1">{building.name}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {building.address}
                          </p>
                        </div>
                        <Badge variant={building.free > 10 ? "default" : "destructive"}>
                          {building.free} свободно
                        </Badge>
                      </div>

                      {/* Availability Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Загруженность</span>
                          <span className="font-medium">{availabilityPercentage}% свободно</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getAvailabilityColor(building.free, building.total)} transition-all`}
                            style={{ width: `${availabilityPercentage}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>{building.occupied || 0} занято сейчас</span>
                          <span>{building.booked || 0} забронировано</span>
                        </div>
                      </div>

                      {/* Zone Breakdown */}
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="text-center p-2 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-primary">{building.zones?.quiet || 0}</div>
                          <div className="text-xs text-muted-foreground">Тихая зона</div>
                        </div>
                        <div className="text-center p-2 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-secondary">{building.zones?.group || 0}</div>
                          <div className="text-xs text-muted-foreground">Групповая</div>
                        </div>
                        <div className="text-center p-2 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-accent">{building.zones?.informal || 0}</div>
                          <div className="text-xs text-muted-foreground">Неформальная</div>
                        </div>
                      </div>

                      <Button asChild className="w-full">
                        <Link href={`/booking?building=${building.id}`}>
                          Забронировать место
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                 )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
