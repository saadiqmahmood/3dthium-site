import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
}

export default function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-16">
      <p className="text-zinc-900 font-light text-lg">{title}</p>
      {description && <p className="text-zinc-500 font-light text-sm mt-1">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
