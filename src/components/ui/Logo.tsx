import { cn } from '@/lib/utils'

// DreamEdTech marka logosu (public/logo.svg)
export function Logo({ className }: { className?: string }) {
  return (
    <img
      src="/logo.svg"
      alt="DreamEdTech"
      draggable={false}
      className={cn('select-none', className)}
    />
  )
}
