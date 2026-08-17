import { cn } from '@/lib/utils'

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground',
        className,
      )}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="size-[62%]"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* roof: building together */}
        <path
          d="M3 11.5 12 4l9 7.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* two hands meeting under the roof */}
        <path
          d="M6 13v5.2c0 .5.4.8.8.8H12M18 13v5.2c0 .5-.4.8-.8.8H12M12 15v4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}

export function Wordmark({
  className,
  markClassName,
}: {
  className?: string
  markClassName?: string
}) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <BrandMark className={cn('size-8', markClassName)} />
      <span className="font-serif text-xl font-semibold tracking-tight text-foreground">
        Convites
      </span>
    </span>
  )
}
