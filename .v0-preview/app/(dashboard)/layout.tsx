'use client'

import { useRouter } from 'next/navigation'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { getSession, type Session } from '@/lib/auth'
import { FloatingNav, readNavPosition, type NavPosition } from '@/components/riwi/floating-nav'

const SessionContext = createContext<Session>({ role: 'ADMIN', email: '' })

export function useSession() {
  return useContext(SessionContext)
}

const PADDING_BY_POSITION: Record<NavPosition, string> = {
  left: 'pl-20 pr-4 pt-6 pb-6 md:pl-24 md:pr-8',
  right: 'pr-20 pl-4 pt-6 pb-6 md:pr-24 md:pl-8',
  top: 'pt-24 px-4 pb-6 md:px-8',
  bottom: 'pb-24 px-4 pt-6 md:px-8',
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [checking, setChecking] = useState(true)
  const [navPosition, setNavPosition] = useState<NavPosition>('left')

  useEffect(() => {
    setNavPosition(readNavPosition())
    const s = getSession()
    if (!s) {
      router.replace('/login')
      return
    }
    setSession(s)
    setChecking(false)
  }, [router])

  if (checking || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div
          className="size-12 animate-spin rounded-full border-4 border-primary border-t-transparent"
          role="status"
          aria-label="Verificando sesión"
        />
      </div>
    )
  }

  return (
    <SessionContext.Provider value={session}>
      <div className="min-h-screen bg-bg">
        <FloatingNav role={session.role} position={navPosition} onPositionChange={setNavPosition} />
        <main className={cn('mx-auto min-h-screen max-w-7xl', PADDING_BY_POSITION[navPosition])}>
          {children}
        </main>
      </div>
    </SessionContext.Provider>
  )
}
