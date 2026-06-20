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
    ]
  },
  { name: "Pricing", href: "/pricing" },
  { name: "Portfolio", href: "/portfolio" },
  { name: "Blog", href: "/blog" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
]

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [servicesOpen, setServicesOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setServicesOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close dropdown on route change
  useEffect(() => {
    setServicesOpen(false)
  }, [pathname])

  const isServiceActive = pathname === '/services' || 
    pathname.startsWith('/ai-engineering') || 
    pathname.startsWith('/cybersecurity') || 
    pathname.startsWith('/software-development') || 
    pathname.startsWith('/cloud-devops') || 
    pathname.startsWith('/enterprise-solutions') ||
    pathname.startsWith('/iiot-automation')

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <div className="relative w-10 h-10">
            <Image
              src="/logo.png"
              alt="Intelliwave Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="font-display text-xl font-bold text-gradient">
            Intelliwave
          </span>
        </Link>

        {/* Desktop navigation */}
        <div className="hidden lg:flex lg:gap-x-6">
          {navigation.map((item) => (
            <div key={item.name} ref={item.children ? dropdownRef : undefined} className="relative">
              {item.children ? (
                <div>
                  <button
                    onClick={() => setServicesOpen(!servicesOpen)}
                    onMouseEnter={() => setServicesOpen(true)}
                    className={`flex items-center gap-1 text-sm font-semibold leading-6 transition-colors py-2 ${
                      isServiceActive
                        ? "text-primary"
                        : "text-muted-foreground hover:text-primary"
                    }`}
                  >
                    {item.name}
                    <ChevronDown className={`w-3 h-3 transition-transform ${servicesOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {servicesOpen && (
                    <div 
                      className="absolute top-full left-0 mt-1 w-56 rounded-xl border bg-background shadow-2xl py-2 z-50"
                      onMouseLeave={() => setServicesOpen(false)}
                    >
                      {item.children.map((child) => (
                        <Link
                          key={child.name}
                          href={child.href}
                          onClick={() => setServicesOpen(false)}
                          className={`block px-4 py-2.5 text-sm transition-colors ${
                            pathname === child.href 
                              ? "bg-primary/10 text-primary font-medium" 
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
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
                    pathname === item.href
                      ? "text-primary"
                      : "text-muted-foreground hover:text-primary"
                  }`}
                >
                  {item.name}
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* Desktop right section */}
        <div className="hidden lg:flex lg:items-center lg:gap-x-4">
          <SearchPalette />
          <SocialIcons size="sm" />
          <Link href="/contact">
            <Button className="bg-primary hover:bg-primary/90">Get Started</Button>
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          className="lg:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t max-h-[80vh] overflow-y-auto">
          <div className="container py-4 space-y-1">
            {navigation.map((item) => (
              <div key={item.name}>
                {item.children ? (
                  <>
                    <Link
                      href={item.href}
                      className="block px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:bg-accent"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.name} (Overview)
                    </Link>
                    <div className="ml-4 border-l-2 border-muted pl-3 space-y-1">
                      {item.children.filter(c => c.name !== 'All Services').map((child) => (
                        <Link
                          key={child.name}
                          href={child.href}
                          className="block px-3 py-1.5 text-sm text-muted-foreground hover:text-primary rounded-md"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  </>
                ) : (
                  <Link
                    href={item.href}
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      pathname === item.href
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                )}
              </div>
            ))}
            
            <div className="px-3 py-3">
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Follow Us</p>
              <SocialIcons variant="mobile" size="md" />
            </div>
            
            <div className="px-3 mt-4">
              <Link href="/contact" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full bg-primary">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}