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
    { name: "Document Intelligence", href: "/ai-engineering" },
  ],
  services: [
    { name: "AI Development", href: "/ai-engineering" },
    { name: "Software Development", href: "/software-development" },
    { name: "Cybersecurity", href: "/cybersecurity" },
    { name: "Cloud & DevOps", href: "/cloud-devops" },
    { name: "Enterprise Solutions", href: "/enterprise-solutions" },
    { name: "IIoT Automation", href: "/iiot-automation" },
    { name: "AI Estimator", href: "/estimator" },
  ],
  industries: [
    { name: "Government", href: "/industry-solutions" },
    { name: "Banking & Finance", href: "/industry-solutions" },
    { name: "Healthcare", href: "/industry-solutions" },
    { name: "Manufacturing", href: "/iiot-automation" },
    { name: "Education", href: "/industry-solutions" },
    { name: "Logistics", href: "/industry-solutions" },
  ],
  company: [
    { name: "About", href: "/about" },
    { name: "Blog", href: "/blog" },
    { name: "Careers", href: "/careers" },
    { name: "Events", href: "/events" },
    { name: "Contact", href: "/contact" },
    { name: "Insights", href: "/insights" },
    { name: "Management", href: "/management" },
  ],
  legal: [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Cookie Policy", href: "/cookies" },
    { name: "Security Center", href: "/security" },
  ],
  connect: [
    { name: "WhatsApp", href: "https://wa.me/254714694493", external: true },
    { name: "Email", href: "mailto:intelliwavehr@gmail.com", external: true },
    { name: "Phone", href: "tel:+254714694493", external: true },
  ],
}

// Client logos data
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

// Technology partner logos
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
    <footer className="border-t bg-background relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-12">
          {/* Company Info */}
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <div className="relative w-10 h-10">
                <Image src="/logo.png" alt="Intelliwave" width={40} height={40} className="rounded-lg object-contain" />
              </div>
              <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Intelliwave</span>
            </Link>
            
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              Enterprise AI solutions that automate operations. SOC 2 Type II certified. 
              Trusted by 450,000+ businesses across 100+ countries.
            </p>
            
            <div className="mb-6">
              <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Follow Us</p>
              <SocialIcons variant="footer" />
            </div>
            
            <div className="space-y-3">
              <a href="https://wa.me/254714694493" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group">
                <Phone className="w-4 h-4 text-green-500" />
                <span>+254 714 694 493</span>
                <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
              <a href="mailto:intelliwavehr@gmail.com"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group">
                <Mail className="w-4 h-4 text-primary" />
                <span>intelliwavehr@gmail.com</span>
                <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p>Nairobi CBD, Superior Centre</p>
                  <p>Shop F11, 1st Floor</p>
                  <p>Kenyatta Avenue, Kenya</p>
                </div>
              </div>
            </div>
          </div>

          {/* Products */}
          <div>
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Products</h3>
            <ul className="space-y-2">
              {footerNavigation.products.map((item) => (
                <li key={item.name}><Link href={item.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">{item.name}</Link></li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Services</h3>
            <ul className="space-y-2">
              {footerNavigation.services.map((item) => (
                <li key={item.name}><Link href={item.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">{item.name}</Link></li>
              ))}
            </ul>
          </div>

          {/* Industries */}
          <div>
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Industries</h3>
            <ul className="space-y-2">
              {footerNavigation.industries.map((item) => (
                <li key={item.name}><Link href={item.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">{item.name}</Link></li>
              ))}
            </ul>
          </div>

          {/* Company & Legal */}
          <div>
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Company</h3>
            <ul className="space-y-2 mb-6">
              {footerNavigation.company.map((item) => (
                <li key={item.name}><Link href={item.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">{item.name}</Link></li>
              ))}
            </ul>
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Legal</h3>
            <ul className="space-y-2">
              {footerNavigation.legal.map((item) => (
                <li key={item.name}><Link href={item.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">{item.name}</Link></li>
              ))}
            </ul>
          </div>
        </div>

        {/* Client Logos Bar */}
        <div className="py-8 border-t border-b mb-8">
          <p className="text-xs font-semibold text-muted-foreground mb-4 uppercase tracking-wider text-center">Trusted by Industry Leaders</p>
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10">
            {clientLogosList.map((client) => {
              const LogoComponent = client.Logo
              return (
                <div key={client.name} className="flex items-center" title={client.name}>
                  <LogoComponent />
                </div>
              )
            })}
          </div>
        </div>

        {/* Technology Partners Bar */}
        <div className="py-6 mb-8">
          <p className="text-xs font-semibold text-muted-foreground mb-4 uppercase tracking-wider text-center">Technology Partners</p>
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10">
            {techLogosList.map((tech) => {
              const LogoComponent = tech.Logo
              return (
                <div key={tech.name} className="flex items-center" title={tech.name}>
                  <LogoComponent />
                </div>
              )
            })}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground text-center md:text-left">
              <p>© {new Date().getFullYear()} Intelliwave Ltd. All rights reserved.</p>
              <p className="mt-1">CEO: PhD, Eng. Nicholas Karani</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /><span>SOC 2 Type II</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /><span>ISO 27001</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" /><span>GDPR Compliant</span>
              </div>
            </div>
          </div>
          <div className="text-center mt-4">
            <p className="text-xs text-muted-foreground/60 italic">
              &ldquo;Enterprise AI Systems That Automate Operations.&rdquo;
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}