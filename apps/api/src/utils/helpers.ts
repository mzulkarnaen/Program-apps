import { FastifyInstance, PrismaClient } from '@prisma/client'

export function generateDocumentNumber(
  prefix: string,
  date: Date = new Date()
): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  
  // Generate random 4-digit number for offline-first support
  // In production, this should be reconciled during sync
  const randomPart = Math.floor(1000 + Math.random() * 9000)
  
  return `${prefix}-${year}${month}${day}-${randomPart}`
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function parseCurrency(value: string): number {
  // Remove all non-numeric characters except minus
  const numeric = value.replace(/[^0-9-]/g, '')
  return parseInt(numeric) || 0
}

export async function generateUniqueNumber(
  prisma: PrismaClient,
  prefix: string,
  model: string,
  field: string = 'number',
  date: Date = new Date()
): Promise<string> {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const datePrefix = `${year}${month}${day}`
  
  // Get the highest number for today
  const pattern = `${prefix}-${datePrefix}%`
  const existing = await (prisma as any)[model].findMany({
    where: {
      [field]: {
        startsWith: `${prefix}-${datePrefix}-`,
      },
    },
    select: { [field]: true },
    orderBy: { [field]: 'desc' },
    take: 1,
  })

  let nextNumber = 1
  if (existing && existing.length > 0 && existing[0][field]) {
    const lastNumber = parseInt(existing[0][field].split('-').pop() || '0')
    nextNumber = lastNumber + 1
  }

  return `${prefix}-${datePrefix}-${String(nextNumber).padStart(4, '0')}`
}

export function getDateRange(period: string): { start: Date; end: Date } {
  const now = new Date()
  const start = new Date(now)
  const end = new Date(now)

  switch (period) {
    case 'today':
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
      break
    case 'yesterday':
      start.setDate(start.getDate() - 1)
      start.setHours(0, 0, 0, 0)
      end.setDate(end.getDate() - 1)
      end.setHours(23, 59, 59, 999)
      break
    case 'this_week':
      const dayOfWeek = now.getDay()
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
      start.setDate(diff)
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
      break
    case 'this_month':
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
      break
    default:
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
  }

  return { start, end }
}

export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export function validatePhone(phone: string): boolean {
  const re = /^(\+62|62|0)8[1-9][0-9]{6,9}$/
  return re.test(phone.replace(/\s/g, ''))
}
