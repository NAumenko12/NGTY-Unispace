"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Download, Eye, FileText, BookOpen, GraduationCap, Presentation } from "lucide-react"

// Типы материалов
const materialTypes = [
  { value: "all", label: "Все материалы" },
  { value: "textbook", label: "Учебники", icon: BookOpen },
  { value: "manual", label: "Методички", icon: FileText },
  { value: "article", label: "Научные статьи", icon: GraduationCap },
  { value: "lecture", label: "Лекции", icon: Presentation },
]

// Предметы
const subjects = [
  "Все предметы",
  "Математика",
  "Физика",
  "Программирование",
  "Базы данных",
  "Алгоритмы",
  "Сети",
  "Архитектура ПО",
]

// Курсы
const courses = ["Все курсы", "1 курс", "2 курс", "3 курс", "4 курс", "Магистратура"]

// Форматы файлов
const formats = ["Все форматы", "PDF", "DOCX", "PPTX", "EPUB"]

type Material = {
  id: number
  title: string
  author: string
  category: string
  subject: string
  course: number | null
  file_format: string
  file_size: number | null
  file_url: string
  publication_year: number | null
  description?: string | null
}

export default function LibraryPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState("all")
  const [selectedSubject, setSelectedSubject] = useState("Все предметы")
  const [selectedCourse, setSelectedCourse] = useState("Все курсы")
  const [selectedFormat, setSelectedFormat] = useState("Все форматы")
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/library")
        const contentType = res.headers.get("content-type") || ""
        if (!res.ok) throw new Error("Ошибка загрузки библиотеки")
        const data = contentType.includes("application/json") ? await res.json() : { materials: [] }
        const list = Array.isArray(data.materials) ? data.materials : []
        setMaterials(list)
      } catch (e) {
        setMaterials([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Фильтрация материалов
  const filteredMaterials = (Array.isArray(materials) ? materials : []).filter((material) => {
    // Защита от некорректных данных
    const title = (material.title || "").toString()
    const author = (material.author || "").toString()
    const description = (material.description || "").toString()
    const category = (material.category || "").toString()
    const subject = (material.subject || "").toString()
    const fileFormat = (material.file_format || "").toString()
    const matchesSearch =
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType = selectedType === "all" || category === selectedType
    const matchesSubject = selectedSubject === "Все предметы" || subject === selectedSubject
    const matchesCourse = selectedCourse === "Все курсы" || String(material.course) === selectedCourse
    const matchesFormat = selectedFormat === "Все форматы" || fileFormat === selectedFormat

    return matchesSearch && matchesType && matchesSubject && matchesCourse && matchesFormat
  })

  // Получение иконки по типу материала
  const getTypeIcon = (type: string) => {
    const typeObj = materialTypes.find((t) => t.value === type)
    const Icon = typeObj?.icon || FileText
    return <Icon className="w-5 h-5" />
  }

  // Получение цвета бейджа по формату
  const getFormatColor = (format: string) => {
    switch (format) {
      case "PDF":
        return "bg-red-100 text-red-700 hover:bg-red-100"
      case "DOCX":
        return "bg-blue-100 text-blue-700 hover:bg-blue-100"
      case "PPTX":
        return "bg-orange-100 text-orange-700 hover:bg-orange-100"
      case "EPUB":
        return "bg-purple-100 text-purple-700 hover:bg-purple-100"
      default:
        return "bg-gray-100 text-gray-700 hover:bg-gray-100"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <main className="container mx-auto px-4 py-8">
        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-balance">Электронная библиотека</h1>
          <p className="text-muted-foreground text-lg">Доступ к учебникам, методичкам, научным статьям и лекциям</p>
        </div>

        {/* Поиск и фильтры */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Поиск материалов</CardTitle>
            <CardDescription>Используйте фильтры для быстрого поиска нужных материалов</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Поиск */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по названию, автору или описанию..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Фильтры */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Тип материала</label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white shadow-lg z-[9999]" position="popper">
                    {materialTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Предмет</label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white shadow-lg z-[9999]" position="popper">
                    {subjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Курс</label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white shadow-lg z-[9999]" position="popper">
                    {courses.map((course) => (
                      <SelectItem key={course} value={course}>
                        {course}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Формат</label>
                <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white shadow-lg z-[9999]" position="popper">
                    {formats.map((format) => (
                      <SelectItem key={format} value={format}>
                        {format}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Результаты */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-muted-foreground">
            Найдено материалов: <span className="font-semibold text-foreground">{filteredMaterials.length}</span>
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery("")
              setSelectedType("all")
              setSelectedSubject("Все предметы")
              setSelectedCourse("Все курсы")
              setSelectedFormat("Все форматы")
            }}
          >
            Сбросить фильтры
          </Button>
        </div>

        {/* Сетка материалов */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterials.map((material) => (
            <Card key={material.id} className="flex flex-col hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg">{getTypeIcon(material.category)}</div>
                  <Badge className={getFormatColor(material.file_format)}>{material.file_format}</Badge>
                </div>
                <CardTitle className="text-lg leading-tight text-balance">{material.title}</CardTitle>
                <CardDescription>{material.author}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground mb-4 text-pretty">{material.description}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Предмет:</span>
                    <span className="font-medium">{material.subject}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Курс:</span>
                    <span className="font-medium">{material.course ?? "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Размер:</span>
                    <span className="font-medium">{material.file_size ? `${(material.file_size / (1024 * 1024)).toFixed(1)} МБ` : "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Скачиваний:</span>
                    <span className="font-medium">{material.downloads}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button asChild variant="outline" className="flex-1 bg-transparent" size="sm">
                  <a href={`/api/library/${material.id}/view`} target="_blank" rel="noopener noreferrer">
                    <Eye className="w-4 h-4 mr-2" />
                    Просмотр
                  </a>
                </Button>
                <Button asChild className="flex-1" size="sm">
                  <a href={`/api/library/${material.id}/download`}>
                    <Download className="w-4 h-4 mr-2" />
                    Скачать
                  </a>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Пустое состояние */}
        {filteredMaterials.length === 0 && (
          <Card className="p-12 text-center">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Материалы не найдены</h3>
            <p className="text-muted-foreground mb-4">Попробуйте изменить параметры поиска или сбросить фильтры</p>
            <Button
              onClick={() => {
                setSearchQuery("")
                setSelectedType("all")
                setSelectedSubject("Все предметы")
                setSelectedCourse("Все курсы")
                setSelectedFormat("Все форматы")
              }}
            >
              Сбросить фильтры
            </Button>
          </Card>
        )}
      </main>
    </div>
  )
}
