'use client'

import { createContext, useContext } from 'react'

interface Session {
  authenticated: boolean
  user?: {
    id: string
    name: string
    email: string
    role: string
  }
  organization?: {
    id: string
    name: string
  }
  subscribed?: boolean
}

export const SessionContext = createContext<Session>({ authenticated: false })

export const useSession = () => useContext(SessionContext)