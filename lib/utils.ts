import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Простой in-memory rate limiter (per-IP + route)
const ipRouteToHits: Map<string, { count: number; resetAt: number }> = new Map()

export function isRateLimited(ip: string, routeKey: string, limit = 20, windowMs = 60_000) {
  const key = `${ip}:${routeKey}`
  const now = Date.now()
  const bucket = ipRouteToHits.get(key)
  if (!bucket || now > bucket.resetAt) {
    ipRouteToHits.set(key, { count: 1, resetAt: now + windowMs })
    return false
  }
  bucket.count += 1
  if (bucket.count > limit) return true
  return false
}
