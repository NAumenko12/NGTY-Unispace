"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"

interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  role: string
  studentId?: string
  faculty?: string
  course?: number
  avatarUrl?: string | null
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  studentId?: string
  faculty?: string
  course?: number
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const refreshUser = async () => {
    try {
      const response = await fetch("/api/auth/me")
      if (response.ok) {
        const contentType = response.headers.get("content-type") || ""
        if (contentType.includes("application/json")) {
          const data = await response.json()
          setUser(data.user)
        } else {
          setUser(null)
        }
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error("[v0] Error fetching user:", error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshUser()
  }, [])

  const login = async (email: string, password: string) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    const contentType = response.headers.get("content-type") || ""
    if (!response.ok) {
      if (contentType.includes("application/json")) {
        const error = await response.json()
        throw new Error(error.error || "Ошибка входа")
      }
      const text = await response.text()
      throw new Error(text || "Ошибка входа")
    }

    const data = contentType.includes("application/json") ? await response.json() : { user: null }
    setUser(data.user)
    router.push("/")
    router.refresh()
  }

  const register = async (data: RegisterData) => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    const contentType = response.headers.get("content-type") || ""
    if (!response.ok) {
      if (contentType.includes("application/json")) {
        const error = await response.json()
        throw new Error(error.error || "Ошибка регистрации")
      }
      const text = await response.text()
      throw new Error(text || "Ошибка регистрации")
    }

    const result = contentType.includes("application/json") ? await response.json() : { user: null }
    setUser(result.user)
    router.push("/")
    router.refresh()
  }

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    setUser(null)
    router.push("/")
    router.refresh()
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
