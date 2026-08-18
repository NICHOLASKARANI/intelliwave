'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Menu, X, ChevronDown } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { SocialIcons } from '@/components/ui/social-icons'
import { SearchPalette } from '@/components/ui/search-palette'

const navigation = [
  { name: "Home", href: "/" },
  { 
    name: "Services", 
    href: "/services",
    children: [
      { name: "All Services", href: "/services" },
      { name: "AI Engineering", href: "/ai-engineering" },
      { name: "Software Development", href: "/software-development" },
      { name: "Cybersecurity", href: "/cybersecurity" },
      { name: "Cloud & DevOps", href: "/cloud-devops" },
      { name: "Enterprise Solutions", href: "/enterprise-solutions" },
      { name: "IIoT Automation", href: "/iiot-automation" },
      { name: "Industry Solutions", href: "/industry-solutions" },
    ]
  },
  { 
    name: "Resources", 
    href: "/learning-center",
    children: [
      { name: "Learning Center", href: "/learning-center" },
      { name: "Knowledge Base", href: "/knowledge-base" },
      { name: "Webinars", href: "/webinars" },
      { name: "API Docs", href: "/api-docs" },
      { name: "ROI Calculator", href: "/roi-calculator" },
    ]
  },
  { name: "Command Centre", href: "/command-centre" },
  { name: "Pricing", href: "/pricing" },
  { name: "Portfolio", href: "/portfolio" },
  { name: "Blog", href: "/blog" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
]

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [servicesOpen, setServicesOpen] = useState(false)
  const [resourcesOpen, setResourcesOpen] = useState(false)
  const servicesRef = useRef<HTMLDivElement>(null)
  const resourcesRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (servicesRef.current && !servicesRef.current.contains(event.target as Node)) {
        setServicesOpen(false)
      }
      if (resourcesRef.current && !resourcesRef.current.contains(event.target as Node)) {
        setResourcesOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    setServicesOpen(false)
    setResourcesOpen(false)
  }, [pathname])

  const isServiceActive = pathname === '/services' || pathname.startsWith('/ai-engineering') || pathname.startsWith('/cybersecurity') || pathname.startsWith('/software-development') || pathname.startsWith('/cloud-devops') || pathname.startsWith('/enterprise-solutions') || pathname.startsWith('/iiot-automation') || pathname.startsWith('/industry-solutions')
  const isResourceActive = pathname.startsWith('/learning-center') || pathname.startsWith('/knowledge-base') || pathname.startsWith('/webinars') || pathname.startsWith('/api-docs') || pathname.startsWith('/roi-calculator')
  const isCommandCentreActive = pathname.startsWith('/command-centre')

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <div className="relative w-10 h-10">
            <Image src="/logo.png" alt="IntelliWavve Logo" fill className="object-contain" priority />
          </div>
          <span className="font-display text-xl font-bold text-gradient">IntelliWavve</span>
        </Link>

        <div className="hidden lg:flex lg:gap-x-5">
          {navigation.map((item) => (
            <div key={item.name} ref={item.name === "Services" ? servicesRef : item.name === "Resources" ? resourcesRef : undefined} className="relative">
              {item.children ? (
                <div>
                  <button
                    onClick={() => {
                      if (item.name === "Services") { setServicesOpen(!servicesOpen); setResourcesOpen(false) }
                      if (item.name === "Resources") { setResourcesOpen(!resourcesOpen); setServicesOpen(false) }
                    }}
                    onMouseEnter={() => {
                      if (item.name === "Services") setServicesOpen(true)
                      if (item.name === "Resources") setResourcesOpen(true)
                    }}
                    className={`flex items-center gap-1 text-sm font-semibold leading-6 transition-colors py-2 ${
                      (item.name === "Services" && isServiceActive) || (item.name === "Resources" && isResourceActive) ? "text-primary" : "text-muted-foreground hover:text-primary"
                    }`}
                  >
                    {item.name}
                    <ChevronDown className={`w-3 h-3 transition-transform ${(item.name === "Services" && servicesOpen) || (item.name === "Resources" && resourcesOpen) ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {((item.name === "Services" && servicesOpen) || (item.name === "Resources" && resourcesOpen)) && (
                    <div className="absolute top-full left-0 mt-1 w-56 rounded-xl border bg-background shadow-2xl py-2 z-50" onMouseLeave={() => {
                      if (item.name === "Services") setServicesOpen(false)
                      if (item.name === "Resources") setResourcesOpen(false)
                    }}>
                      {item.children.map((child) => (
                        <Link key={child.name} href={child.href} onClick={() => { setServicesOpen(false); setResourcesOpen(false) }}
                          className={`block px-4 py-2.5 text-sm transition-colors ${pathname === child.href ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link 
                  href={item.href} 
                  className={`text-sm font-semibold leading-6 transition-colors py-2 ${
                    item.name === "Command Centre" && isCommandCentreActive 
                      ? "text-blue-600 dark:text-blue-400 font-bold" 
                      : pathname === item.href 
                        ? "text-primary" 
                        : "text-muted-foreground hover:text-primary"
                  }`}
                >
                  {item.name === "Command Centre" ? (
                    <span className="flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                      </span>
                      {item.name}
                    </span>
                  ) : (
                    item.name
                  )}
                </Link>
              )}
            </div>
          ))}

          {/* ITIS Logo Link */}
          <Link 
            href="/itis" 
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              pathname === '/itis' 
                ? 'bg-green-500/10 text-green-400' 
                : 'text-green-400 hover:text-green-300 hover:bg-green-500/5'
            }`}
          >
            <div className="relative w-6 h-6 rounded overflow-hidden">
              <Image src="/images/intelliwavveitis.jpeg" alt="ITIS" width={24} height={24} className="object-cover" />
            </div>
            <span>ITIS</span>
          </Link>
        </div>

        <div className="hidden lg:flex lg:items-center lg:gap-x-3">
          <SearchPalette />
          <SocialIcons size="sm" />
          <Link href="/contact"><Button className="bg-primary hover:bg-primary/90">Get Started</Button></Link>
        </div>

        <button className="lg:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {mobileMenuOpen && (
        <div className="lg:hidden border-t max-h-[80vh] overflow-y-auto">
          <div className="container py-4 space-y-1">
            {navigation.map((item) => (
              <div key={item.name}>
                {item.children ? (
                  <>
                    <Link href={item.href} className="block px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
                      {item.name} (Overview)
                    </Link>
                    <div className="ml-4 border-l-2 border-muted pl-3 space-y-1">
                      {item.children.map((child) => (
                        <Link key={child.name} href={child.href} className="block px-3 py-1.5 text-sm text-muted-foreground hover:text-primary rounded-md" onClick={() => setMobileMenuOpen(false)}>
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  </>
                ) : (
                  <Link 
                    href={item.href} 
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      item.name === "Command Centre" && isCommandCentreActive
                        ? "bg-blue-500/10 text-blue-600 font-bold"
                        : pathname === item.href 
                          ? "bg-primary/10 text-primary" 
                          : "text-muted-foreground hover:bg-accent"
                    }`} 
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name === "Command Centre" ? "🔵 Command Centre" : item.name}
                  </Link>
                )}
              </div>
            ))}
            
            {/* Mobile ITIS Link */}
            <Link href="/itis" onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium text-green-400 hover:bg-green-500/10">
              <div className="relative w-6 h-6 rounded overflow-hidden">
                <Image src="/images/intelliwavveitis.jpeg" alt="ITIS" width={24} height={24} className="object-cover" />
              </div>
              ITIS — Trader Intelligence
            </Link>

            <div className="px-3 py-3"><SocialIcons variant="mobile" size="md" /></div>
            <div className="px-3 mt-4">
              <Link href="/contact" onClick={() => setMobileMenuOpen(false)}><Button className="w-full bg-primary">Get Started</Button></Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}