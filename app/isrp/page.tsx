'use client'
import Link from 'next/link'
import { ArrowRight, Store, Stethoscope, Building2, GraduationCap, Truck, ShieldCheck, Landmark } from 'lucide-react'

const categories = [
  {
    title: "Business & Commerce",
    icon: Store,
    desc: "Retail, restaurants, pharmacies, accounting, and e-commerce.",
    modules: ["Retail & Supermarket", "Restaurant & Hospitality", "Pharmacy", "Accounting & Tax", "CRM", "E-commerce"]
  },
  {
    title: "Institutions & Education",
    icon: GraduationCap,
    desc: "Schools, universities, libraries, and property management.",
    modules: ["School Management", "University ERP", "Library System", "Property & Hotel Management"]
  },
  {
    title: "Government & Citizen Services",
    icon: Landmark,
    desc: "Citizen portals, issue resolution, and civic participation.",
    modules: ["Citizen Complaints", "Issue Resolution Hub", "Voting & Elections", "Public Records"]
  },
  {
    title: "Operations & Industry",
    icon: Truck,
    desc: "Supply chain, manufacturing, logistics, and construction.",
    modules: ["Warehouse & Inventory", "Fleet & Logistics", "Manufacturing", "Construction"]
  },
  {
    title: "Cooperatives & Workforce",
    icon: ShieldCheck,
    desc: "SACCOs, microfinance, HR, and payroll.",
    modules: ["SACCO Management", "HR & Payroll", "Project Management"]
  },
  {
    title: "Intelligence & Digital Services",
    icon: Building2,
    desc: "Healthcare, agriculture, NGOs, and AI reports.",
    modules: ["Hospital & Clinic", "Agribusiness", "NGO & Grants", "Analytics & AI"]
  }
]

export default function IsrpLandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Hero */}
        <div className="text-center mb-20">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 text-blue-300 font-semibold text-sm mb-6 border border-blue-500/30">
            November Master Platform Update
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6">
            Welcome to <span className="text-blue-500">Wavve ISRP</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-10">
            The Integrated Services & Resource Platform. One unified digital ecosystem to manage your business, institution, or community.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/wavecore-erp/auth/signup" className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all">
              Create Account to Access
            </Link>
            <Link href="/wavecore-erp/subscription" className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 transition-all">
              View Subscription Plans
            </Link>
          </div>
        </div>

        {/* 20 Systems Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat, i) => {
            const Icon = cat.icon
            return (
              <div key={i} className="bg-slate-900 rounded-2xl border border-slate-800 p-6 hover:border-blue-500/50 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">{cat.title}</h3>
                <p className="text-sm text-slate-400 mb-6">{cat.desc}</p>
                <ul className="space-y-2">
                  {cat.modules.map((mod, j) => (
                    <li key={j} className="text-sm text-slate-300 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> {mod}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}