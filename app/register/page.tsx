"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { Building2, Loader2 } from "lucide-react"

export default function RegisterPage() {
  const { register } = useAuth()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    studentId: "",
    faculty: "",
    course: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("Пароли не совпадают")
      return
    }

    if (formData.password.length < 6) {
      setError("Пароль должен содержать минимум 6 символов")
      return
    }

    setLoading(true)

    try {
      await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        studentId: formData.studentId || undefined,
        faculty: formData.faculty || undefined,
        course: formData.course ? Number.parseInt(formData.course) : undefined,
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center">
              <Building2 className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="text-center">
            <CardTitle className="text-2xl">Регистрация в UniSpace НГТУ</CardTitle>
            <CardDescription>Создайте аккаунт для доступа к коворкинг-пространствам</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Имя *</Label>
                <Input
                  id="firstName"
                  placeholder="Иван"
                  value={formData.firstName}
                  onChange={(e) => updateField("firstName", e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Фамилия *</Label>
                <Input
                  id="lastName"
                  placeholder="Иванов"
                  value={formData.lastName}
                  onChange={(e) => updateField("lastName", e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@mail.ru"
                value={formData.email}
                onChange={(e) => updateField("email", e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Пароль *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Подтвердите пароль *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => updateField("confirmPassword", e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="studentId">Номер студенческого</Label>
              <Input
                id="studentId"
                placeholder="STU123456"
                value={formData.studentId}
                onChange={(e) => updateField("studentId", e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="faculty">Факультет</Label>
                <Select
                  value={formData.faculty}
                  onValueChange={(value) => updateField("faculty", value)}
                  disabled={loading}
                >
                  <SelectTrigger id="faculty" className="bg-white">
                    <SelectValue placeholder="Выберите факультет" />
                  </SelectTrigger>
                  <SelectContent className="bg-white shadow-lg z-[100]" position="popper">
                    <SelectItem value="ФЭН">Факультет энергетики</SelectItem>
                    <SelectItem value="РТФ">Радиотехнический факультет</SelectItem>
                    <SelectItem value="ФЛА">Факультет летательных аппаратов</SelectItem>
                    <SelectItem value="ФМА">Факультет мехатроники и автоматизации</SelectItem>
                    <SelectItem value="ФИТ">Факультет информационных технологий</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="course">Курс</Label>
                <Select
                  value={formData.course}
                  onValueChange={(value) => updateField("course", value)}
                  disabled={loading}
                >
                  <SelectTrigger id="course" className="bg-white">
                    <SelectValue placeholder="Выберите курс" />
                  </SelectTrigger>
                  <SelectContent className="bg-white shadow-lg z-[100]" position="popper">
                    <SelectItem value="1">1 курс</SelectItem>
                    <SelectItem value="2">2 курс</SelectItem>
                    <SelectItem value="3">3 курс</SelectItem>
                    <SelectItem value="4">4 курс</SelectItem>
                    <SelectItem value="5">5 курс</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">{error}</div>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Регистрация...
                </>
              ) : (
                "Зарегистрироваться"
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Уже есть аккаунт?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Войти
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
