import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Header } from "@/components/header"
import { AuthProvider } from "@/lib/auth-context"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { LanguageProvider } from "@/lib/language-context"
import { AutoTranslator } from "@/components/auto-translator"
import ClipboardPolyfill from "@/components/clipboard-polyfill"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
})

export const metadata: Metadata = {
  title: "UniSpace НГТУ - Умное рабочее пространство",
  description: "Бронируйте комфортные коворкинг-зоны в корпусах НГТУ",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased">
        <AuthProvider>
          <LanguageProvider>
            <ThemeProvider>
              <AutoTranslator>
                <Header />
                <ClipboardPolyfill />
                {children}
                <Toaster />
              </AutoTranslator>
            </ThemeProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
