import type { ComponentProps } from 'react'
import { cn } from '@gooseforum/ui/lib/utils'

export function AdminPage({
  className,
  spacing = 'compact',
  ...props
}: ComponentProps<'main'> & { spacing?: 'compact' | 'relaxed' }) {
  return (
    <main
      data-slot="admin-page"
      className={cn(
        'flex flex-1 flex-col px-3 py-3 lg:px-4',
        spacing === 'relaxed' ? 'gap-4' : 'gap-3',
        className,
      )}
      {...props}
    />
  )
}
