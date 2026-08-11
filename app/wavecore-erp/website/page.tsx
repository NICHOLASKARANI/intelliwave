import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {
  LayoutDashboard, Plus, Search, Filter, Globe,
  ShoppingCart, Palette, FileText, Image, Settings,
  TrendingUp, DollarSign, Users, Package, Eye,
  Monitor, Smartphone, Tablet, Zap, Share2,
  BarChart3, Store, Tag, Layers, MessageSquare,
  Mail, Star, ThumbsUp, ArrowRight, Clock,
  CheckCircle, AlertCircle, Edit3, Trash2,
  Copy, ExternalLink, RefreshCw, Download,
  CreditCard, Truck, Shield, Grid3X3
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Website & E-Commerce - WaveCore ERP | IntelliWavve',
  description: 'Website builder, CMS, e-commerce, product pages, checkout, and online store management.',
}

const storeStats = [
  { label: 'Products Listed', value: '0', icon: Package, color: 'text-blue-500', change: 'In store' },
  { label: 'Orders Today', value: '0', icon: ShoppingCart, color: 'text-green-500', change: 'Today' },
  { label: 'Revenue (MTD)', value: 'KSh 0.00', icon: DollarSign, color: 'text-emerald-500', change: 'This month' },
  { label: 'Customers', value: '0', icon: Users, color: 'text-purple-500', change: 'Registered' },
  { label: 'Page Views', value: '0', icon: Eye, color: 'text-orange-500', change: 'This week' },
  { label: 'Conversion Rate', value: '0%', icon: TrendingUp, color: 'text-teal-500', change: 'Orders/visits' },
]

const quickActions = [
  { label: 'New Product', href: '/wavecore-erp/website/products/create', icon: Plus, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950' },
  { label: 'New Page', href: '/wavecore-erp/website/pages/create', icon: FileText, color: 'text-green-600 bg-green-50 dark:bg-green-950' },
  { label: 'View Store', href: '/store', icon: Store, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950' },
  { label: 'Orders', href: '/wavecore-erp/website/orders', icon: ShoppingCart, color: 'text-orange-600 bg-orange-50 dark:bg-orange-950' },
  { label: 'Analytics', href: '/wavecore-erp/website/analytics', icon: BarChart3, color: 'text-teal-600 bg-teal-50 dark:bg-teal-950' },
  { label: 'Settings', href: '/wavecore-erp/website/settings', icon: Settings, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950' },
]

const pageTemplates = [
  { name: 'Home Page', type: 'Landing', icon: Globe, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950' },
  { name: 'About Us', type: 'Company', icon: Users, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950' },
  { name: 'Product Catalog', type: 'E-Commerce', icon: Package, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950' },
  { name: 'Contact', type: 'Form', icon: Mail, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950' },
  { name: 'Blog', type: 'Content', icon: FileText, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-950' },
  { name: 'Gallery', type: 'Media', icon: Image, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-950' },
]

const storeFeatures = [
  { icon: ShoppingCart, title: 'Shopping Cart', desc: 'Full-featured cart with coupons' },
  { icon: CreditCard, title: 'Payments', desc: 'M-Pesa, Stripe, PayPal & more' },
  { icon: Truck, title: 'Shipping', desc: 'Real-time rates & tracking' },
  { icon: Tag, title: 'Discounts', desc: 'Promo codes & seasonal sales' },
  { icon: Shield, title: 'Security', desc: 'SSL, fraud protection' },
  { icon: BarChart3, title: 'Analytics', desc: 'Sales & traffic insights' },
]

const designThemes = [
  { name: 'Modern Light', color: 'from-blue-400 to-cyan-300', textColor: 'text-gray-900' },
  { name: 'Dark Mode', color: 'from-gray-800 to-gray-900', textColor: 'text-white' },
  { name: 'Corporate', color: 'from-indigo-600 to-blue-700', textColor: 'text-white' },
  { name: 'Creative', color: 'from-purple-500 to-pink-500', textColor: 'text-white' },
  { name: 'Minimal', color: 'from-white to-gray-100', textColor: 'text-gray-900' },
  { name: 'Bold', color: 'from-red-500 to-orange-500', textColor: 'text-white' },
]

export default function WebsitePage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 lg:px-6 h-16">
          <div className="flex items-center gap-4">
            <Link href="/wavecore-erp" className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden border-2 border-indigo-200 dark:border-indigo-800 shadow-lg">
                <Image src="/images/Wavecore.jpeg" alt="WaveCore ERP" width={40} height={40} className="object-cover" priority />
              </div>
              <span className="font-bold text-xl text-neutral-900 dark:text-white">WaveCore</span>
              <span className="ml-2 px-2 py-0.5 text-[10px] bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full font-medium">ERP</span>
            </Link>
            <span className="text-neutral-300">/</span>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-500" />
              <span className="text-sm font-medium">Website & Commerce</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/store" target="_blank" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted">
              <ExternalLink className="w-4 h-4" /> View Store
            </Link>
            <Link href="/wavecore-erp" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted">
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-neutral-900 border-r min-h-[calc(100vh-64px)] p-4 hidden lg:block">
          <Link href="/wavecore-erp" className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted mb-6">
            ← Back to Dashboard
          </Link>
          <p className="px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">Website</p>
          
          <nav className="space-y-1 mb-6">
            {[
              { icon: LayoutDashboard, label: 'Dashboard', href: '/wavecore-erp/website', active: true },
              { icon: Globe, label: 'Pages', href: '/wavecore-erp/website/pages' },
              { icon: Package, label: 'Products', href: '/wavecore-erp/website/products' },
              { icon: ShoppingCart, label: 'Orders', href: '/wavecore-erp/website/orders' },
              { icon: Image, label: 'Media Library', href: '/wavecore-erp/website/media' },
              { icon: Palette, label: 'Design', href: '/wavecore-erp/website/design' },
              { icon: Tag, label: 'Coupons', href: '/wavecore-erp/website/coupons' },
              { icon: Settings, label: 'Settings', href: '/wavecore-erp/website/settings' },
            ].map((item) => {
              const Icon = item.icon
              return (
                <Link key={item.label} href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${
                    (item as any).active
                      ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold shadow-sm'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-muted'
                  }`}>
                  <Icon className="w-4 h-4" /> {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <p className="px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">Store Status</p>
            <div className="px-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Status</span>
                <span className="flex items-center gap-1 text-green-500 text-xs font-medium">
                  <CheckCircle className="w-3 h-3" /> Online
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>SSL</span>
                <span className="flex items-center gap-1 text-green-500 text-xs font-medium">
                  <Shield className="w-3 h-3" /> Active
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Website & E-Commerce</h1>
              <p className="text-muted-foreground mt-1">Website builder, CMS, product pages, shopping cart, and checkout</p>
            </div>
            <div className="flex gap-3">
              <Link href="/store" target="_blank">
                <Button variant="outline" className="gap-2">
                  <Eye className="w-4 h-4" /> Preview
                </Button>
              </Link>
              <Link href="/wavecore-erp/website/products/create">
                <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                  <Plus className="w-4 h-4" /> Add Product
                </Button>
              </Link>
            </div>
          </div>

          {/* Store Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {storeStats.map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 hover:shadow-lg transition-all">
                  <Icon className={`w-5 h-5 ${stat.color} mb-3`} />
                  <div className="text-2xl font-bold text-neutral-900 dark:text-white">{stat.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                  <div className="text-[10px] text-neutral-400 mt-1">{stat.change}</div>
                </div>
              )
            })}
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4 text-neutral-900 dark:text-white">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <Link key={action.label} href={action.href}
                    className="flex items-center gap-3 p-4 rounded-xl border bg-white dark:bg-neutral-900 hover:border-indigo-300 hover:shadow-md transition-all">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${action.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">{action.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Page Templates & Store Features */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* Page Templates */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-neutral-900 dark:text-white">Page Templates</h3>
                <Link href="/wavecore-erp/website/pages/create" className="text-sm text-indigo-600 hover:text-indigo-700">Create New</Link>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {pageTemplates.map((template) => {
                  const Icon = template.icon
                  return (
                    <div key={template.name} className={`p-4 rounded-xl ${template.bg} border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800 transition-all cursor-pointer`}>
                      <Icon className={`w-6 h-6 ${template.color} mb-2`} />
                      <p className="font-medium text-sm">{template.name}</p>
                      <p className="text-xs text-muted-foreground">{template.type}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Store Features */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
              <h3 className="font-bold mb-4 text-neutral-900 dark:text-white">Store Features</h3>
              <div className="grid grid-cols-2 gap-3">
                {storeFeatures.map((feature) => {
                  const Icon = feature.icon
                  return (
                    <div key={feature.title} className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-indigo-500" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{feature.title}</p>
                        <p className="text-xs text-muted-foreground">{feature.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Design Themes */}
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4 text-neutral-900 dark:text-white">Design Themes</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {designThemes.map((theme) => (
                <div key={theme.name} className="cursor-pointer group">
                  <div className={`h-24 rounded-2xl bg-gradient-to-br ${theme.color} mb-3 border-2 border-transparent hover:border-indigo-500 transition-all shadow-sm hover:shadow-md flex items-center justify-center`}>
                    <span className={`text-sm font-bold ${theme.textColor} opacity-50`}>Aa</span>
                  </div>
                  <p className="text-sm font-medium text-center">{theme.name}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Device Preview */}
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4 text-neutral-900 dark:text-white">Responsive Preview</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 text-center hover:shadow-md transition-all cursor-pointer">
                <Monitor className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="font-medium text-sm">Desktop</p>
                <p className="text-xs text-muted-foreground">1920×1080</p>
              </div>
              <div className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 text-center hover:shadow-md transition-all cursor-pointer">
                <Tablet className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="font-medium text-sm">Tablet</p>
                <p className="text-xs text-muted-foreground">768×1024</p>
              </div>
              <div className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 text-center hover:shadow-md transition-all cursor-pointer">
                <Smartphone className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <p className="font-medium text-sm">Mobile</p>
                <p className="text-xs text-muted-foreground">375×812</p>
              </div>
            </div>
          </div>

          {/* SEO & Marketing */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-neutral-900 dark:text-white">
                <Search className="w-5 h-5 text-indigo-500" /> SEO Settings
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Meta Title</label>
                  <p className="text-sm">IntelliWavve - Your Store</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Meta Description</label>
                  <p className="text-sm">Shop the best products at IntelliWavve. Fast shipping, secure payments.</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Sitemap</label>
                  <p className="text-sm text-green-500 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Generated</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-neutral-900 dark:text-white">
                <Share2 className="w-5 h-5 text-indigo-500" /> Marketing Tools
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors cursor-pointer">
                  <Mail className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Email Campaigns</p>
                    <p className="text-xs text-muted-foreground">Send newsletters & promotions</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors cursor-pointer">
                  <Share2 className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Social Media</p>
                    <p className="text-xs text-muted-foreground">Share products on social platforms</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors cursor-pointer">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium">Reviews</p>
                    <p className="text-xs text-muted-foreground">Collect & display customer reviews</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Empty State for Products */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden shadow-sm">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-bold text-neutral-900 dark:text-white">Recent Orders</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm"><Filter className="w-4 h-4 mr-1" /> Filter</Button>
                <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" /> Export</Button>
              </div>
            </div>
            <div className="p-16 text-center">
              <div className="w-20 h-20 rounded-2xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="w-10 h-10 text-indigo-500" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">No orders yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Your online store is ready to accept orders. Start by adding products to your catalog.
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/wavecore-erp/website/products/create">
                  <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="w-4 h-4" /> Add First Product
                  </Button>
                </Link>
                <Link href="/store" target="_blank">
                  <Button variant="outline">
                    <Eye className="w-4 h-4 mr-1" /> View Store
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}