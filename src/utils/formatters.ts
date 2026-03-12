export const formatCurrency = (amount: number, currency = 'GBP'): string =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(amount)

export const formatDate = (iso: string): string =>
  new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(new Date(iso))

export const formatDateTime = (iso: string): string =>
  new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))

export const formatRelative = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return formatDate(iso)
}

export const truncate = (str: string, max = 60): string =>
  str.length > max ? str.slice(0, max) + '…' : str

export const slugify = (str: string): string =>
  str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
