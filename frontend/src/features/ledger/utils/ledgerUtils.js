export const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
})

export const formatMoney = value => currencyFormatter.format(Number(value) || 0)

export const formatDate = value => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not set'
  return date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

export const formatRelativeDeletionWindow = value => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Auto-delete scheduled'
  const diffMs = date.getTime() - Date.now()
  if (diffMs <= 0) return 'Auto-delete due'
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  return daysLeft === 1 ? 'Auto-deletes in 1 day' : `Auto-deletes in ${daysLeft} days`
}

export const formatRelativeRestoreWindow = value => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Recently restored'
  const diffMs = Date.now() - date.getTime()
  const minutes = Math.floor(diffMs / (1000 * 60))
  if (minutes < 1) return 'Restored just now'
  if (minutes < 60) return `Restored ${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Restored ${hours} hr${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  return `Restored ${days} day${days === 1 ? '' : 's'} ago`
}

export const formatFilterDate = value => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export const toDateTimeLocalValue = value => {
  const date = value ? new Date(value) : new Date()
  if (Number.isNaN(date.getTime())) return ''
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return localDate.toISOString().slice(0, 16)
}

export const getDatePresetRange = (preset, customStartDate, customEndDate) => {
  const now = new Date()
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  const endOfToday = new Date(now)
  endOfToday.setHours(23, 59, 59, 999)

  if (preset === 'today') return { startDate: startOfToday, endDate: endOfToday }
  if (preset === 'yesterday') {
    const startDate = new Date(startOfToday)
    startDate.setDate(startDate.getDate() - 1)
    const endDate = new Date(endOfToday)
    endDate.setDate(endDate.getDate() - 1)
    return { startDate, endDate }
  }
  if (preset === 'month') {
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    startDate.setHours(0, 0, 0, 0)
    return { startDate, endDate: endOfToday }
  }
  if (preset === 'custom') {
    const startDate = customStartDate ? new Date(customStartDate) : null
    const endDate = customEndDate ? new Date(customEndDate) : null
    if (startDate) startDate.setHours(0, 0, 0, 0)
    if (endDate) endDate.setHours(23, 59, 59, 999)
    return { startDate, endDate }
  }
  return { startDate: null, endDate: null }
}

export const datePresetOptions = [
  { value: 'all', label: 'All' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'today', label: 'Today' },
  { value: 'month', label: 'This Month' },
  { value: 'custom', label: 'Custom' },
]

export const typeFilterOptions = [
  { value: 'all', label: 'All cashflow' },
  { value: 'in', label: 'Cash in' },
  { value: 'out', label: 'Cash out' },
]

export const getSuggestedNotes = (savedNotes, inputValue) => {
  const normalizedInput = inputValue.trim().toLowerCase()
  if (!normalizedInput) return []
  return savedNotes
    .filter(noteOption => noteOption.normalized !== normalizedInput && noteOption.normalized.includes(normalizedInput))
    .sort((firstNote, secondNote) => {
      const firstStartsWith = firstNote.normalized.startsWith(normalizedInput)
      const secondStartsWith = secondNote.normalized.startsWith(normalizedInput)
      if (firstStartsWith !== secondStartsWith) return firstStartsWith ? -1 : 1
      if (secondNote.count !== firstNote.count) return secondNote.count - firstNote.count
      return firstNote.value.localeCompare(secondNote.value)
    })
    .slice(0, 5)
}

export const getOrgLabel = user => user?.user_metadata?.org_name?.trim() || user?.email || 'Your organization'

export const normalizeTransaction = transaction => ({
  ...transaction,
  amount: Number(transaction.amount || 0),
})
