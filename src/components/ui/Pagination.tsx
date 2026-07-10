import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

function pageItems(current: number, count: number): (number | '…')[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1)
  const items: (number | '…')[] = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(count - 1, current + 1)
  if (start > 2) items.push('…')
  for (let i = start; i <= end; i++) items.push(i)
  if (end < count - 1) items.push('…')
  items.push(count)
  return items
}

export function Pagination({
  page,
  pageCount,
  total,
  pageSize,
  onPage,
}: {
  page: number
  pageCount: number
  total: number
  pageSize: number
  onPage: (p: number) => void
}) {
  if (total === 0) return null
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 sm:flex-row">
      <div className="text-xs text-[var(--color-muted)]">
        <span className="font-medium text-[var(--color-fg)]">
          {start}–{end}
        </span>{' '}
        / {total} kayıt
      </div>

      {pageCount > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPage(page - 1)}
            disabled={page <= 1}
            className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-muted)] hover:bg-[var(--color-bg)] disabled:pointer-events-none disabled:opacity-40"
            aria-label="Önceki"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {pageItems(page, pageCount).map((it, i) =>
            it === '…' ? (
              <span key={`e${i}`} className="px-1.5 text-xs text-[var(--color-muted)]">
                …
              </span>
            ) : (
              <button
                key={it}
                onClick={() => onPage(it)}
                className={cn(
                  'flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm font-medium transition-colors',
                  it === page
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'text-[var(--color-fg)] hover:bg-[var(--color-bg)]',
                )}
              >
                {it}
              </button>
            ),
          )}

          <button
            onClick={() => onPage(page + 1)}
            disabled={page >= pageCount}
            className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-muted)] hover:bg-[var(--color-bg)] disabled:pointer-events-none disabled:opacity-40"
            aria-label="Sonraki"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
