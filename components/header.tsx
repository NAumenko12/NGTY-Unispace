"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Building2, User, LogOut, Menu, X, Globe } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import { LanguageSelector } from "@/components/language-selector"
import { useState, useEffect } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function Header() {
  const { user, logout, loading } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { language, setLanguage, t } = useLanguage()


  const getInitials = (firstName?: string, lastName?: string) => {
    const f = (firstName || "").trim()
    const l = (lastName || "").trim()
    const fi = f ? f.charAt(0) : "U"
    const li = l ? l.charAt(0) : "S"
    return `${fi}${li}`.toUpperCase()
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span>{t('header.title')}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/map" className="text-sm font-medium hover:text-primary transition-colors">
            {t('header.map')}
          </Link>
          <Link href="/booking" className="text-sm font-medium hover:text-primary transition-colors">
            {t('header.booking')}
          </Link>
          <Link href="/library" className="text-sm font-medium hover:text-primary transition-colors">
            {t('header.library')}
          </Link>
          {user && (
            <Link href="/chat" className="text-sm font-medium hover:text-primary transition-colors">
              {t('header.chat')}
            </Link>
          )}
          {user && (
            <Link href="/my-bookings" className="text-sm font-medium hover:text-primary transition-colors">
              {t('header.myBookings')}
            </Link>
          )}
          {user?.role === "admin" && (
            <Link href="/admin" className="text-sm font-medium hover:text-primary transition-colors">
              {t('header.admin')}
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {/* Мобильное меню кнопка */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          {loading ? (
            <div className="w-20 h-9 bg-muted animate-pulse rounded-md" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Avatar className="w-8 h-8">
                    {user && user["avatarUrl"] && <AvatarImage src={user["avatarUrl"]} alt={`${user.firstName} ${user.lastName}`} />}
                    <AvatarFallback className="bg-primary text-white text-xs">
                      {getInitials(user.firstName as any, user.lastName as any)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline text-sm">
                    {user.firstName} {user.lastName}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-neutral-900 border shadow-md z-[60] backdrop-blur-none">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    {user.role === "admin" && <p className="text-xs text-primary font-medium">{t('header.adminRole')}</p>}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/my-bookings" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    {t('header.profile')}
                  </Link>
                </DropdownMenuItem>
                {user.role === "admin" && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="cursor-pointer">
                      <Building2 className="mr-2 h-4 w-4" />
                      {t('header.admin')}
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()} className="cursor-pointer text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('header.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">{t('header.login')}</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">{t('header.register')}</Link>
              </Button>
            </>
          )}
          {/* Language selector */}
          <LanguageSelector 
            onLanguageChange={(lang) => setLanguage(lang)}
            className="hidden md:flex"
          />
        </div>
      </div>

      {/* Мобильное меню */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background/95 backdrop-blur">
          <div className="container mx-auto px-4 py-4 space-y-2">
            <Link 
              href="/map" 
              className="block py-2 text-sm font-medium hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('header.map')}
            </Link>
            <Link 
              href="/booking" 
              className="block py-2 text-sm font-medium hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('header.booking')}
            </Link>
            <Link 
              href="/library" 
              className="block py-2 text-sm font-medium hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('header.library')}
            </Link>
            {user && (
              <Link 
                href="/chat" 
                className="block py-2 text-sm font-medium hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('header.chat')}
              </Link>
            )}
            {user && (
              <Link 
                href="/my-bookings" 
                className="block py-2 text-sm font-medium hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('header.myBookings')}
              </Link>
            )}
            {user?.role === "admin" && (
              <Link 
                href="/admin" 
                className="block py-2 text-sm font-medium hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('header.admin')}
              </Link>
            )}
            <div className="pt-2 border-t">
              <LanguageSelector 
                onLanguageChange={(lang) => {
                  setLanguage(lang)
                  setMobileMenuOpen(false)
                }}
                className="flex"
              />
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
