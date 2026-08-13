'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Building2, Check } from 'lucide-react'

interface Organization {
  id: string
  name: string
  isActive: boolean
  is_current: boolean
}

export function OrganizationSwitcher() {
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [open, setOpen] = useState(false)
  const [switching, setSwitching] = useState(false)
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchOrgs() {
      try {
        const res = await fetch('/api/wavecore/auth/organizations')
        if (res.ok) {
          const data = await res.json()
          setOrgs(data.organizations)
        }
      } catch {}
    }
    fetchOrgs()
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const currentOrg = orgs.find(o => o.is_current)

  const handleSwitch = async (orgId: string) => {
    setSwitching(true)
    try {
      const res = await fetch('/api/wavecore/auth/switch-organization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: orgId }),
      })
      if (res.ok) {
        router.refresh()
        setTimeout(() => window.location.reload(), 500)
      }
    } finally {
      setSwitching(false)
      setOpen(false)
    }
  }

  if (orgs.length <= 1) {
    return (
      <span className="hidden md:inline text-sm font-medium text-neutral-600 dark:text-neutral-400">
        {currentOrg?.name || ''}
      </span>
    )
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
      >
        <Building2 className="w-4 h-4 text-indigo-500" />
        <span className="text-sm font-medium max-w-[150px] truncate">{currentOrg?.name}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-64 rounded-xl border bg-white dark:bg-neutral-900 shadow-2xl z-50 py-2">
          <p className="px-4 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
            Switch Organization
          </p>
          {orgs.map((org) => (
            <button
              key={org.id}
              onClick={() => org.is_current ? setOpen(false) : handleSwitch(org.id)}
              disabled={switching || !org.isActive}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                org.is_current
                  ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-medium'
                  : 'hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50'
              }`}
            >
              <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-xs font-bold">
                {org.name[0]}
              </div>
              <span className="flex-1 truncate text-left">{org.name}</span>
              {org.is_current && <Check className="w-4 h-4 text-indigo-500" />}
              {!org.isActive && <span className="text-[10px] text-red-500">Suspended</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}