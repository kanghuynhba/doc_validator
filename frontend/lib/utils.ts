import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeUtcTimestamp(value: string) {
  if (/[zZ]$|[+-]\d{2}:\d{2}$/.test(value)) {
    return value
  }

  return `${value}Z`
}
