import Link from "next/link"
import Image from "next/image"
import { Mail, Phone, MapPin, ArrowUpRight } from "lucide-react"
import { SocialIcons } from '@/components/ui/social-icons'
import { 
  SafaricomLogo, KCBLogo, EquityLogo, KQLogo, 
  NationLogo, BritamLogo, AKULogo, CopiaLogo,
  AWSLogo, AzureLogo, GCPSLogo, VercelLogo, 
  StripeLogo, MPesaLogo, DockerLogo, K8sLogo 
} from '@/components/ui/real-logos'

const footerNavigation = {
  products: [
    { name: "WaveCore ERP", href: "/enterprise-solutions" },
    { name: "AI Analytics", href: "/ai-engineering" },
    { name: "AI Agents", href: "/ai-engineering" },
    { name: "API Platform", href: "/api-docs" },
  ],
  services: [
    { name: "AI Development", href: "/ai-engineering" },
    { name: "Software Development", href: "/software-development" },
    { name: "Cybersecurity", href: "/cybersecurity" },
    { name: "Cloud & DevOps", href: "/cloud-devops" },
    { name: "Enterprise Solutions", href: "/enterprise-solutions" },
    { name: "IIoT Automation", href: "/iiot-automation" },
  ],
  industries: [
    { name: "Government", href: "/industry-solutions" },
    { name: "Banking & Finance", href: "/industry-solutions" },
    { name: "Healthcare", href: "/industry-solutions" },
    { name: "Manufacturing", href: "/iiot-automation" },
    { name: "Education", href: "/industry-solutions" },
  ],
  company: [
    { name: "About", href: "/about" },
    { name: "Blog", href: "/blog" },
    { name: "Careers", href: "/careers" },
    { name: "Contact", href: "/contact" },
    { name: "Dashboard", href: "/dashboard" },
  ],
  legal: [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Cookie Policy", href: "/cookies" },
    { name: "Security Center", href: "/security" },
  ],
}

const clientLogosList = [
  { name: 'Safaricom', Logo: SafaricomLogo },
  { name: 'KCB Group', Logo: KCBLogo },
  { name: 'Equity Group', Logo: EquityLogo },
  { name: 'Kenya Airways', Logo: KQLogo },
  { name: 'Nation Media Group', Logo: NationLogo },
  { name: 'Britam Holdings', Logo: BritamLogo },
  { name: 'Aga Khan University', Logo: AKULogo },
  { name: 'Copia Global', Logo: CopiaLogo },
]

const techLogosList = [
  { name: 'AWS', Logo: AWSLogo },
  { name: 'Microsoft Azure', Logo: AzureLogo },
  { name: 'Google Cloud', Logo: GCPSLogo },
  { name: 'Vercel', Logo: VercelLogo },
  { name: 'Stripe', Logo: StripeLogo },
  { name: 'M-Pesa', Logo: MPesaLogo },
  { name: 'Docker', Logo: DockerLogo },
  { name: 'Kubernetes', Logo: K8sLogo },
]

export function Footer() {
  return (
    <footer className="relative bg-slate-950 text-gray-300 overflow-hidden">
      {/* World Map Background */}
      <div className="absolute inset-0 opacity-[0.03]">
        <Image src="/images/world-map-bg.png" alt="" fill className="object-cover" />
      </div>
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/95 to-slate-950/90" />
      
      <div className="container relative py-16 md:py-20">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-16">
          {/* Company Info */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <div className="relative w-10 h-10">
                <Image src="/logo.png" alt="IntelliWavve" width={40} height={40} className="rounded-lg object-contain" />
              </div>
              <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">IntelliWavve</span>
            </Link>
            <p className="text-sm text-gray-400 mb-6 max-w-sm leading-relaxed">
              Building the Intelligent Operating System for governments, global enterprises, and the industries of tomorrow.
            </p>
            <div className="mb-6">
              <SocialIcons variant="footer" />
            </div>
            <div className="space-y-3 text-sm text-gray-400">
              <a href="https://wa.me/254714694493" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-green-400 transition-colors group">
                <Phone className="w-4 h-4 text-green-500" /><span>+254 714 694 493</span><ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
              <a href="mailto:intelliwavehr@gmail.com" className="flex items-center gap-2 hover:text-blue-400 transition-colors group">
                <Mail className="w-4 h-4 text-blue-400" /><span>intelliwavehr@gmail.com</span><ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
              <div className="flex items-start gap-2"><MapPin className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" /><div><p>Nairobi CBD, Superior Centre</p><p>Shop F11, 1st Floor, Kenyatta Avenue</p></div></div>
            </div>
          </div>

          {['Products', 'Services', 'Industries', 'Company'].map((title) => {
            const items = footerNavigation[title.toLowerCase() as keyof typeof footerNavigation]
            return (
              <div key={title}>
                <h3 className="font-semibold mb-4 text-xs uppercase tracking-widest text-gray-500">{title}</h3>
                <ul className="space-y-2.5">
                  {items.map((item: any) => (
                    <li key={item.name}><Link href={item.href} className="text-sm text-gray-400 hover:text-white transition-colors">{item.name}</Link></li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        {/* Client Logos */}
        <div className="py-8 border-t border-b border-gray-800 mb-8">
          <p className="text-xs font-semibold text-gray-500 mb-6 uppercase tracking-widest text-center">Trusted by Industry Leaders</p>
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10">
            {clientLogosList.map((client) => { const LogoComponent = client.Logo; return <div key={client.name} title={client.name}><LogoComponent /></div> })}
          </div>
        </div>

        {/* Technology Partners */}
        <div className="py-6 mb-8">
          <p className="text-xs font-semibold text-gray-500 mb-6 uppercase tracking-widest text-center">Technology Partners</p>
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10">
            {techLogosList.map((tech) => { const LogoComponent = tech.Logo; return <div key={tech.name} title={tech.name}><LogoComponent /></div> })}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">© {new Date().getFullYear()} IntelliWavve Ltd. All rights reserved. CEO: PhD, Eng. Nicholas Karani</p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2 text-xs text-gray-500"><span className="w-1.5 h-1.5 rounded-full bg-green-500" />SOC 2 Type II</span>
            <span className="flex items-center gap-2 text-xs text-gray-500"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" />ISO 27001</span>
            <span className="flex items-center gap-2 text-xs text-gray-500"><span className="w-1.5 h-1.5 rounded-full bg-purple-500" />GDPR Compliant</span>
          </div>
        </div>
      </div>
    </footer>
  )
}