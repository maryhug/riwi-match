'use client'

import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BarChart3,
  DollarSign,
  LayoutGrid,
  LogOut,
  MessageSquare,
  Plus,
  Settings,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { clearSession } from '@/lib/auth'
import type { Role } from '@/lib/types'

export type NavPosition = 'left' | 'right' | 'top' | 'bottom'

const VALID_POSITIONS: NavPosition[] = ['left', 'right', 'top', 'bottom']

export function readNavPosition(): NavPosition {
  try {
    const stored = localStorage.getItem('navbar_position')
    if (stored && VALID_POSITIONS.includes(stored as NavPosition)) return stored as NavPosition
  } catch {
    // localStorage no disponible
  }
  return 'left'
}

interface NavItem {
  href: string
  label: string
  icon: typeof LayoutGrid
  bg: string
  fg: string
}

/**
 * El botón "Añadir" se adapta a la sección donde está el usuario: en Question Sets
 * crea un set de preguntas; en cualquier otra página (Hiring Processes, Dashboard,
 * Costos, Profiling, Config) por defecto crea un proceso de contratación.
 */
function getAddItem(pathname: string): NavItem {
  if (pathname.startsWith('/question-sets')) {
    return { href: '/question-sets/new', label: 'Nuevo set', icon: Plus, bg: 'bg-blue-light', fg: 'text-blue' }
  }
  return { href: '/hiring-processes/new', label: 'Nuevo proceso', icon: Plus, bg: 'bg-blue-light', fg: 'text-blue' }
}

const NAV_ITEMS: NavItem[] = [
  { href: '/hiring-processes', label: 'Procesos', icon: LayoutGrid, bg: 'bg-primary-light', fg: 'text-primary' },
  { href: '/question-sets', label: 'Preguntas', icon: MessageSquare, bg: 'bg-mint-light', fg: 'text-mint' },
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3, bg: 'bg-accent-light', fg: 'text-accent' },
  { href: '/metrics', label: 'Costos', icon: DollarSign, bg: 'bg-pink-light', fg: 'text-pink' },
]

const ADMIN_ITEM: NavItem = {
  href: '/settings',
  label: 'Config',
  icon: Settings,
  bg: 'bg-slate-chip',
  fg: 'text-slate-icon',
}

function isActive(pathname: string, href: string): boolean {
  if (href === '/hiring-processes') {
    return pathname.startsWith('/hiring-processes') && !pathname.startsWith('/hiring-processes/new')
  }
  if (href === '/hiring-processes/new') return pathname.startsWith('/hiring-processes/new')
  return pathname.startsWith(href)
}

const POSITION_LABELS: Record<NavPosition, { label: string; icon: typeof ArrowUp }> = {
  top: { label: 'Mover navegación arriba', icon: ArrowUp },
  bottom: { label: 'Mover navegación abajo', icon: ArrowDown },
  left: { label: 'Mover navegación a la izquierda', icon: ArrowLeft },
  right: { label: 'Mover navegación a la derecha', icon: ArrowRight },
}

interface FloatingNavProps {
  role: Role
  position: NavPosition
  onPositionChange: (pos: NavPosition) => void
}

export function FloatingNav({ role, position, onPositionChange }: FloatingNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const items = role === 'ADMIN' ? [...NAV_ITEMS, ADMIN_ITEM] : NAV_ITEMS
  const horizontal = position === 'top' || position === 'bottom'
  const addItem = getAddItem(pathname)

  useEffect(() => {
    if (!menuOpen) return
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [menuOpen])

  const movePosition = (pos: NavPosition) => {
    onPositionChange(pos)
    try {
      localStorage.setItem('navbar_position', pos)
    } catch {
      // localStorage no disponible
    }
    setMenuOpen(false)
  }

  const logout = () => {
    clearSession()
    router.push('/login')
  }

  const renderLink = (item: NavItem) => {
    const active = isActive(pathname, item.href)
    const Icon = item.icon
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-label={item.label}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'group flex items-center justify-center overflow-hidden rounded-full transition-all motion-reduce:transition-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary focus-visible:ring-offset-surface-raised',
          'size-10 shrink-0',
          horizontal && 'w-auto min-w-10 px-0',
          active ? item.bg : 'hover:bg-bg-subtle',
        )}
      >
        <span
          className={cn(
            'flex items-center gap-2 px-2.5',
            active ? item.fg : 'text-text-muted group-hover:text-text',
          )}
        >
          <Icon className="size-4 shrink-0" />
          {horizontal && (
            <span
              className={cn(
                'max-w-0 overflow-hidden whitespace-nowrap text-xs font-semibold opacity-0 transition-all duration-200 motion-reduce:transition-none',
                (active || undefined) && 'max-w-24 opacity-100',
                'group-hover:max-w-24 group-hover:opacity-100 group-focus-visible:max-w-24 group-focus-visible:opacity-100',
              )}
            >
              {item.label}
            </span>
          )}
        </span>
      </Link>
    )
  }

  return (
    <div
      className={cn(
        'fixed z-40 flex items-center gap-3',
        position === 'left' && 'left-3 top-1/2 -translate-y-1/2 flex-col',
        position === 'right' && 'right-3 top-1/2 -translate-y-1/2 flex-col',
        position === 'top' && 'top-3 left-1/2 -translate-x-1/2 flex-row',
        position === 'bottom' && 'bottom-3 left-1/2 -translate-x-1/2 flex-row',
      )}
    >
      {/* Botón "Añadir" — isla propia, separada de la navegación principal */}
      <div
        className={cn(
          'flex items-center rounded-full border border-border bg-surface-raised p-2 shadow-tinted-lg',
          horizontal ? 'flex-row' : 'flex-col',
        )}
      >
        {renderLink(addItem)}
      </div>

      {/* Isla principal de navegación */}
      <nav
        aria-label="Navegación principal"
        className={cn(
          'flex items-center gap-1.5 rounded-full border border-border bg-surface-raised p-2 shadow-tinted-lg',
          horizontal ? 'flex-row' : 'flex-col',
        )}
      >
        {items.map((item) => renderLink(item))}
      </nav>

      {/* Avatar de usuario — isla propia, separada de la navegación principal */}
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Menú de usuario y posición de navegación"
          aria-expanded={menuOpen}
          className="flex size-10 items-center justify-center rounded-full border border-border bg-primary-solid text-sm font-bold text-white shadow-tinted-lg transition-transform hover:scale-105 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary focus-visible:ring-offset-surface-raised cursor-pointer"
        >
          {role.charAt(0)}
        </button>

        {menuOpen && (
          <div
            className={cn(
              'absolute z-50 flex w-52 flex-col gap-1 rounded-[14px] border border-border bg-surface-raised p-2 shadow-tinted-lg',
              position === 'left' && 'bottom-0 left-full ml-3',
              position === 'right' && 'bottom-0 right-full mr-3',
              position === 'top' && 'right-0 top-full mt-3',
              position === 'bottom' && 'bottom-full right-0 mb-3',
            )}
          >
            <p className="px-2 pt-1 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
              Mover navegación
            </p>
            <div className="flex gap-1 px-1 pb-1">
              {VALID_POSITIONS.filter((p) => p !== position).map((p) => {
                const { label, icon: Icon } = POSITION_LABELS[p]
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => movePosition(p)}
                    aria-label={label}
                    className="flex size-10 items-center justify-center rounded-[10px] border border-border text-text transition-colors hover:bg-bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
                  >
                    <Icon className="size-4" />
                  </button>
                )
              })}
            </div>
            <div className="my-1 h-px bg-border" aria-hidden="true" />
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-2 rounded-[10px] px-2 py-2 text-xs font-semibold text-coral transition-colors hover:bg-coral-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral cursor-pointer"
            >
              <LogOut className="size-4" />
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
