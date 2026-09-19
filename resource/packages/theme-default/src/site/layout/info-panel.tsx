import type { ReactNode } from 'react'
import { SitePanel } from './site-panel'

export function InfoPanel({ title, children, action }: { title: string, children: ReactNode, action?: ReactNode }) {
  return (
    <SitePanel className="p-4">
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="mt-2 text-sm leading-6 text-muted-foreground">{children}</div>
      {action ? <div className="mt-4">{action}</div> : null}
    </SitePanel>
  )
}
