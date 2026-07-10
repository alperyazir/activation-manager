import { useEffect, useMemo, useState } from 'react'

// İstemci tarafı sayfalama. resetKey değişince (ör. filtreler) sayfa 1'e döner.
export function usePagination<T>(items: T[], pageSize = 15, resetKey?: unknown) {
  const [page, setPage] = useState(1)
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize))
  // Aynı render'da clamp'le: liste küçülünce sayfa taşmasın (boş-kare flaş'ı yok).
  const current = Math.min(page, pageCount)

  useEffect(() => {
    setPage(1)
  }, [resetKey])

  useEffect(() => {
    if (page !== current) setPage(current)
  }, [page, current])

  const paged = useMemo(
    () => items.slice((current - 1) * pageSize, current * pageSize),
    [items, current, pageSize],
  )

  return { page: current, setPage, pageCount, pageSize, total: items.length, paged }
}
