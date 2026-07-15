"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { BookOpen, Plus, Trash2, Loader2, FileText } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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

export default function AdminLibraryPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [materials, setMaterials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null)
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    category: "textbook",
    subject: "",
    course: "",
    faculty: "",
    description: "",
    fileFormat: "PDF",
    fileSize: "",
    fileUrl: "",
    publicationYear: "",
    publisher: "",
    pages: "",
  })

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login")
      } else if (user.role !== "admin") {
        router.push("/")
      } else {
        fetchMaterials()
      }
    }
  }, [user, authLoading])

  const fetchMaterials = async () => {
    try {
      const response = await fetch("/api/admin/library")
      if (!response.ok) throw new Error("Failed to fetch materials")
      const data = await response.json()
      setMaterials(Array.isArray(data.materials) ? data.materials : [])
    } catch (error) {
      console.error("[v0] Error fetching materials:", error)
      toast.error("Ошибка загрузки материалов")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch("/api/admin/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          course: formData.course ? Number.parseInt(formData.course) : null,
          fileSize: formData.fileSize ? Number.parseInt(formData.fileSize) : null,
          publicationYear: formData.publicationYear ? Number.parseInt(formData.publicationYear) : null,
          pages: formData.pages ? Number.parseInt(formData.pages) : null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      toast.success("Материал успешно добавлен")
      setDialogOpen(false)
      setFormData({
        title: "",
        author: "",
        category: "textbook",
        subject: "",
        course: "",
        faculty: "",
        description: "",
        fileFormat: "PDF",
        fileSize: "",
        fileUrl: "",
        publicationYear: "",
        publisher: "",
        pages: "",
      })
      fetchMaterials()
    } catch (error: any) {
      console.error("[v0] Error creating material:", error)
      toast.error(error.message || "Ошибка создания материала")
    }
  }

  const handleDelete = async () => {
    if (!selectedMaterial) return

    try {
      const response = await fetch(`/api/admin/library/${selectedMaterial.id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete material")

      toast.success("Материал удален")
      setSelectedMaterial(null)
      fetchMaterials()
    } catch (error) {
      console.error("[v0] Error deleting material:", error)
      toast.error("Ошибка удаления материала")
    }
  }

  const getCategoryName = (category: string) => {
    const categories: Record<string, string> = {
      textbook: "Учебник",
      manual: "Методичка",
      article: "Статья",
      lecture: "Лекция",
    }
    return categories[category] || category
  }

  if (authLoading || loading) {
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Управление библиотекой</h1>
            <p className="text-muted-foreground text-lg">Добавление и удаление учебных материалов</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Добавить материал
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Добавить новый материал</DialogTitle>
                <DialogDescription>Заполните информацию о материале для библиотеки</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="title">Название *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="author">Автор *</Label>
                    <Input
                      id="author"
                      value={formData.author}
                      onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="category">Категория *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger id="category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent position="popper" className="z-[9999] bg-white border shadow-lg">
                        <SelectItem value="textbook">Учебник</SelectItem>
                        <SelectItem value="manual">Методичка</SelectItem>
                        <SelectItem value="article">Статья</SelectItem>
                        <SelectItem value="lecture">Лекция</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Предмет *</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="course">Курс</Label>
                    <Input
                      id="course"
                      type="number"
                      min="1"
                      max="5"
                      value={formData.course}
                      onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="faculty">Факультет</Label>
                    <Input
                      id="faculty"
                      value={formData.faculty}
                      onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fileFormat">Формат *</Label>
                    <Select
                      value={formData.fileFormat}
                      onValueChange={(value) => setFormData({ ...formData, fileFormat: value })}
                    >
                      <SelectTrigger id="fileFormat">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent position="popper" className="z-[9999] bg-white border shadow-lg">
                        <SelectItem value="PDF">PDF</SelectItem>
                        <SelectItem value="DOCX">DOCX</SelectItem>
                        <SelectItem value="PPTX">PPTX</SelectItem>
                        <SelectItem value="EPUB">EPUB</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Описание</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fileUrl">URL файла *</Label>
                  <Input
                    id="fileUrl"
                    type="url"
                    value={formData.fileUrl}
                    onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                    required
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="publicationYear">Год издания</Label>
                    <Input
                      id="publicationYear"
                      type="number"
                      value={formData.publicationYear}
                      onChange={(e) => setFormData({ ...formData, publicationYear: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pages">Страниц</Label>
                    <Input
                      id="pages"
                      type="number"
                      value={formData.pages}
                      onChange={(e) => setFormData({ ...formData, pages: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fileSize">Размер (байт)</Label>
                    <Input
                      id="fileSize"
                      type="number"
                      value={formData.fileSize}
                      onChange={(e) => setFormData({ ...formData, fileSize: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="publisher">Издательство</Label>
                  <Input
                    id="publisher"
                    value={formData.publisher}
                    onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Отмена
                  </Button>
                  <Button type="submit">Добавить</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Материалы ({materials.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!Array.isArray(materials) || materials.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4" />
                  <p>Нет материалов в библиотеке</p>
                </div>
              ) : (
                materials.map((material) => (
                  <div key={material.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div>
                          <h3 className="font-bold text-lg">{material.title}</h3>
                          <p className="text-sm text-muted-foreground">{material.author}</p>
                        </div>

                        {material.description && <p className="text-sm">{material.description}</p>}

                        <div className="flex flex-wrap gap-2">
                          <Badge variant="default">{getCategoryName(material.category)}</Badge>
                          <Badge variant="secondary">{material.subject}</Badge>
                          {material.course && <Badge variant="outline">Курс {material.course}</Badge>}
                          {material.faculty && <Badge variant="outline">{material.faculty}</Badge>}
                          <Badge variant="outline">{material.file_format}</Badge>
                        </div>

                        <div className="flex gap-4 text-xs text-muted-foreground">
                          {material.publication_year && <span>Год: {material.publication_year}</span>}
                          {material.pages && <span>Страниц: {material.pages}</span>}
                          {material.file_size && (
                            <span>Размер: {(material.file_size / 1024 / 1024).toFixed(2)} МБ</span>
                          )}
                          <span>Скачиваний: {material.download_count}</span>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setSelectedMaterial(material)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!selectedMaterial} onOpenChange={() => setSelectedMaterial(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить материал?</AlertDialogTitle>
            <AlertDialogDescription>
              Материал "{selectedMaterial?.title}" будет удален из библиотеки. Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
