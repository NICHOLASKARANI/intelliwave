'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, ChevronDown, Search, Sparkles, ArrowRight, Globe, Shield, Star } from "lucide-react"
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
      { name: "All Services", href: "/services", desc: "Complete service overview" },
      { name: "AI Engineering", href: "/ai-engineering", desc: "Custom AI solutions" },
      { name: "Software Development", href: "/software-development", desc: "Enterprise software" },
      { name: "Cybersecurity", href: "/cybersecurity", desc: "Security & compliance" },
      { name: "Cloud & DevOps", href: "/cloud-devops", desc: "Cloud infrastructure" },
      { name: "Enterprise Solutions", href: "/enterprise-solutions", desc: "Enterprise platforms" },
      { name: "IIoT Automation", href: "/iiot-automation", desc: "Industrial IoT" },
      { name: "Industry Solutions", href: "/industry-solutions", desc: "Industry-specific" },
    ]
  },
  {
    name: "Resources",
    href: "/learning-center",
    children: [
      { name: "Learning Center", href: "/learning-center", desc: "Courses & training" },
      { name: "Knowledge Base", href: "/knowledge-base", desc: "Documentation" },
      { name: "Webinars", href: "/webinars", desc: "Live events" },
      { name: "API Docs", href: "/api-docs", desc: "Developer resources" },
      { name: "ROI Calculator", href: "/roi-calculator", desc: "Calculate your ROI" },
    ]
  },
  { name: "WaveCore ERP", href: "/wavecore-erp" },
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
  const [scrolled, setScrolled] = useState(false)
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

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const isServiceActive = pathname === '/services' || pathname.startsWith('/ai-engineering') || pathname.startsWith('/cybersecurity') || pathname.startsWith('/software-development') || pathname.startsWith('/cloud-devops') || pathname.startsWith('/enterprise-solutions') || pathname.startsWith('/iiot-automation') || pathname.startsWith('/industry-solutions')
  const isResourceActive = pathname.startsWith('/learning-center') || pathname.startsWith('/knowledge-base') || pathname.startsWith('/webinars') || pathname.startsWith('/api-docs') || pathname.startsWith('/roi-calculator')
  const isWaveCoreActive = pathname.startsWith('/wavecore-erp')

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${
      scrolled 
        ? 'bg-white/95 dark:bg-neutral-950/95 backdrop-blur-xl shadow-lg shadow-black/5 border-b border-neutral-200/50'
        : 'bg-white/80 dark:bg-neutral-950/80 backdrop-blur-lg border-b border-neutral-200/30'
    }`}>
      {/* Premium Top Bar */}
      <div className="hidden lg:block bg-gradient-to-r from-indigo-950 via-purple-900 to-indigo-950 text-white">
        <div className="container mx-auto px-4 py-1 flex items-center justify-between text-xs">
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5 text-indigo-200">
              <Sparkles className="w-3 h-3 text-amber-400" /> Enterprise AI Platform
            </span>
            <span className="flex items-center gap-1.5 text-indigo-200">
              <Shield className="w-3 h-3 text-green-400" /> SOC 2 Type II
            </span>
            <span className="flex items-center gap-1.5 text-indigo-200">
              <Globe className="w-3 h-3 text-blue-400" /> 100+ Countries
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-indigo-200">Building the Intelligent Operating System</span>
            <SocialIcons className="flex gap-2" />
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="container mx-auto px-4">
        <div className="flex h-16 lg:h-18 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl blur-md opacity-40 group-hover:opacity-60 transition-opacity" />
              <Image
                src="/images/Wavecore.jpeg"
                alt="IntelliWavve"
                width={40}
                height={40}
                className="relative rounded-xl object-cover"
              />
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                IntelliWavve
              </span>
              <p className="text-[9px] text-neutral-500 font-semibold tracking-widest uppercase -mt-0.5">
                Global AI Company
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-0.5">
            {navigation.map((item) => {
              if (item.children) {
                const isOpen = item.name === "Services" ? servicesOpen : resourcesOpen
                const setOpen = item.name === "Services" ? setServicesOpen : setResourcesOpen
                const ref = item.name === "Services" ? servicesRef : resourcesRef
                const isActive = item.name === "Services" ? isServiceActive : isResourceActive
                
                return (
                  <div key={item.name} ref={ref} className="relative">
                    <button
                      onClick={() => setOpen(!isOpen)}
                      className={`flex items-center gap-1 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                        isActive 
                          ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950'
                          : 'text-neutral-700 dark:text-neutral-200 hover:text-indigo-600 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      {item.name}
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isOpen && (
                      <div className="absolute top-full left-0 mt-2 w-[480px] bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200/50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                        <div className="p-4 grid grid-cols-1 gap-1">
                          {item.children.map((child) => (
                            <Link
                              key={child.name}
                              href={child.href}
                              className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-all group"
                            >
                              <div>
                                <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 group-hover:text-indigo-600 transition-colors">
                                  {child.name}
                                </p>
                                {child.desc && (
                                  <p className="text-xs text-neutral-500 mt-0.5">{child.desc}</p>
                                )}
                              </div>
                              <ArrowRight className="w-4 h-4 text-neutral-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              }

              if (item.name === "WaveCore ERP") {
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`ml-2 px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 ${
                      isWaveCoreActive
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:shadow-indigo-500/30 hover:scale-105'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {item.name}
                  </Link>
                )
              }

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    pathname === item.href
                      ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950'
                      : 'text-neutral-700 dark:text-neutral-200 hover:text-indigo-600 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  {item.name}
                </Link>
              )
            })}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <SearchPalette />

            {/* Get Started CTA */}
            <Link
              href="/contact"
              className="hidden lg:flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-all"
            >
              Get Started
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            {/* Mobile Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white dark:bg-neutral-950 border-t max-h-[80vh] overflow-y-auto">
          <div className="p-4 space-y-1">
            {navigation.map((item) => {
              if (item.name === "WaveCore ERP") {
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold"
                  >
                    <Sparkles className="w-4 h-4" /> {item.name}
                  </Link>
                )
              }

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2.5 rounded-xl text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  {item.name}
                </Link>
              )
            })}
            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-3 rounded-xl bg-neutral-900 text-white text-center font-bold mt-3"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}