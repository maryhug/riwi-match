'use client'

import { Bell, Search } from 'lucide-react'
import type { ReactNode } from 'react'
import { ROLE_LABELS } from '@/lib/auth'
import type { Role } from '@/lib/types'
import { ThemeToggle } from './theme-toggle'

interface HeaderProps {
  title: string
  subtitle?: string
  children?: ReactNode
  rightBelow?: ReactNode
  role?: Role
}

export function Header({ title, subtitle, children, rightBelow, role = 'ADMIN' }: HeaderProps) {
  return (
    <header className="flex flex-col gap-3 pb-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-sans text-xl font-bold text-ink text-balance">{title}</h1>
          {subtitle && <p className="mt-0.5 text-xs text-text-muted">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Buscar..."
              aria-label="Buscar en la plataforma"
              className="w-52 rounded-full border border-border bg-surface py-2 pl-9 pr-3 text-xs text-ink placeholder:text-text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary focus-visible:ring-offset-bg"
            />
          </div>

          <button
            type="button"
            aria-label="Notificaciones"
            className="relative flex size-10 items-center justify-center rounded-full border border-border bg-surface text-text transition-colors hover:bg-bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary focus-visible:ring-offset-bg cursor-pointer"
          >
            <Bell className="size-4" />
            <span className="absolute right-2 top-2 size-2 rounded-full bg-coral" aria-hidden="true" />
            <span className="sr-only">Tienes notificaciones nuevas</span>
          </button>

          <ThemeToggle />

          <div className="hidden items-center gap-2 rounded-full border border-border bg-surface py-1 pl-1 pr-3 sm:flex">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary-solid text-xs font-bold text-white">
              {role.charAt(0)}
            </span>
            <span className="text-xs font-semibold text-ink">{ROLE_LABELS[role]}</span>
          </div>

          {children}
        </div>
      </div>

      {rightBelow && <div className="flex justify-end">{rightBelow}</div>}
    </header>
  )
}
