import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function timeAgo(date: Date | string | number): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
  return formatDistanceToNow(d, { addSuffix: true })
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function platformColor(platform: string): string {
  switch (platform.toLowerCase()) {
    case 'linkedin': return 'bg-blue-600 text-white'
    case 'twitter':  return 'bg-black text-white'
    case 'reddit':   return 'bg-orange-500 text-white'
    default:         return 'bg-gray-200 text-gray-800'
  }
}

export function platformLabel(platform: string): string {
  switch (platform.toLowerCase()) {
    case 'linkedin': return 'LinkedIn Jobs'
    case 'twitter':  return 'Twitter'
    case 'reddit':   return 'Reddit /r/HireMe'
    default:         return platform
  }
}

export function substituteTemplate(
  template: string,
  vars: Record<string, string>
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] || `{${key}}`)
}
