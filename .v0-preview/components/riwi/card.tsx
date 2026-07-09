import { cn } from '@/lib/utils'
import type { CSSProperties, ReactNode } from 'react'

interface CardPartProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
}

export function Card({ children, className, style }: CardPartProps) {
  return (
    <div
      style={style}
      className={cn('rounded-[14px] border border-border bg-surface p-5', className)}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className, style }: CardPartProps) {
  return (
    <div style={style} className={cn('mb-4 flex items-center justify-between gap-3', className)}>
      {children}
    </div>
  )
}

export function CardContent({ children, className, style }: CardPartProps) {
  return (
    <div style={style} className={cn(className)}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className, style }: CardPartProps) {
  return (
    <div style={style} className={cn('mt-4 flex items-center gap-3 border-t border-border pt-4', className)}>
      {children}
    </div>
  )
}
