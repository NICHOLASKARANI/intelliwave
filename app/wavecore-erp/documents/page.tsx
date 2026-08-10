import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {
  LayoutDashboard, Plus, Search, Filter, FileText,
  FolderOpen, Upload, Download, Star, Clock, Users,
  Shield, Tag, Grid3X3, List, MoreHorizontal, Trash2,
  Share2, Lock, Eye, Edit3, File, FileImage, Video, Music,
  Archive, FileCode, FileSpreadsheet, FileType, ChevronRight,
  HardDrive, Activity, ArrowUpRight, TrendingUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Documents - WaveCore ERP | IntelliWavve',
  description: 'Document storage, OCR, version control, and digital signatures.',
}

const documentStats = [
  { label: 'Total Documents', value: '0', icon: FileText, color: 'text-blue-500', change: 'All files' },
  { label: 'Storage Used', value: '0 MB', icon: HardDrive, color: 'text-green-500', change: 'of 5 GB' },
  { label: 'Shared Files', value: '0', icon: Share2, color: 'text-purple-500', change: 'With team' },
  { label: 'Recent Uploads', value: '0', icon: Upload, color: 'text-orange-500', change: 'This week' },
  { label: 'Starred', value: '0', icon: Star, color: 'text-yellow-500', change: 'Favorites' },
  { label: 'Archived', value: '0', icon: Archive, color: 'text-teal-500', change: 'Old files' },
]

const quickActions = [
  { label: 'Upload File', href: '/wavecore-erp/documents/upload', icon: Upload, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950' },
  { label: 'New Folder', href: '/wavecore-erp/documents/folders/create', icon: FolderOpen, color: 'text-green-600 bg-green-50 dark:bg-green-950' },
  { label: 'Scan Document', href: '/wavecore-erp/documents/scan', icon: FileText, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950' },
  { label: 'Shared With Me', href: '/wavecore-erp/documents?filter=shared', icon: Share2, color: 'text-orange-600 bg-orange-50 dark:bg-orange-950' },
  { label: 'Starred', href: '/wavecore-erp/documents?filter=starred', icon: Star, color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950' },
  { label: 'Trash', href: '/wavecore-erp/documents/trash', icon: Trash2, color: 'text-red-600 bg-red-50 dark:bg-red-950' },
]

const folders = [
  { name: 'Contracts', files: 0, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950' },
  { name: 'Invoices', files: 0, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950' },
  { name: 'HR Documents', files: 0, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950' },
  { name: 'Reports', files: 0, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950' },
  { name: 'Templates', files: 0, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-950' },
  { name: 'Projects', files: 0, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-950' },
]

const fileTypes = [
  { type: 'PDF', icon: File, count: 0, color: 'text-red-500' },
  { type: 'Word', icon: FileText, count: 0, color: 'text-blue-500' },
  { type: 'Excel', icon: FileSpreadsheet, count: 0, color: 'text-green-500' },
  { type: 'Images', icon: FileImage, count: 0, color: 'text-purple-500' },
  { type: 'Code', icon: FileCode, count: 0, color: 'text-orange-500' },
  { type: 'Other', icon: FileType, count: 0, color: 'text-teal-500' },
]

export default function DocumentsPage() {
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
            <span className="text-sm font-medium">Documents</span>
          </div>
          <Link href="/wavecore-erp" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted">
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </Link>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-neutral-900 border-r min-h-[calc(100vh-64px)] p-4 hidden lg:block">
          <Link href="/wavecore-erp" className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted mb-6">
            ← Back to Dashboard
          </Link>
          <p className="px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">Documents</p>
          
          <div className="mb-4">
            <Link href="/wavecore-erp/documents/upload" className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors">
              <Upload className="w-4 h-4" /> Upload Files
            </Link>
          </div>

          <nav className="space-y-1">
            {[
              { icon: LayoutDashboard, label: 'My Drive', href: '/wavecore-erp/documents', active: true },
              { icon: Clock, label: 'Recent', href: '/wavecore-erp/documents/recent' },
              { icon: Star, label: 'Starred', href: '/wavecore-erp/documents/starred' },
              { icon: Share2, label: 'Shared', href: '/wavecore-erp/documents/shared' },
              { icon: Archive, label: 'Archive', href: '/wavecore-erp/documents/archive' },
              { icon: Trash2, label: 'Trash', href: '/wavecore-erp/documents/trash' },
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

          <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-800">
            <p className="px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">Folders</p>
            <nav className="space-y-1">
              {folders.map((folder) => {
                return (
                  <Link key={folder.name} href={`/wavecore-erp/documents/folders/${folder.name.toLowerCase()}`}
                    className="flex items-center gap-3 px-4 py-2 rounded-xl text-sm text-neutral-700 dark:text-neutral-300 hover:bg-muted transition-colors">
                    <FolderOpen className={`w-4 h-4 ${folder.color}`} />
                    <span className="flex-1">{folder.name}</span>
                    <span className="text-xs text-muted-foreground">{folder.files}</span>
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-800">
            <div className="px-4 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium">Storage</span>
                <span className="text-xs text-muted-foreground">0 MB / 5 GB</span>
              </div>
              <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: '0%' }} />
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Documents</h1>
              <p className="text-muted-foreground mt-1">Store, manage, and share your documents securely</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="gap-2">
                <FolderOpen className="w-4 h-4" /> New Folder
              </Button>
              <Link href="/wavecore-erp/documents/upload">
                <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                  <Upload className="w-4 h-4" /> Upload Files
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {documentStats.map((stat) => {
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

          {/* Folders Section */}
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4 text-neutral-900 dark:text-white">Folders</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {folders.map((folder) => {
                return (
                  <Link key={folder.name} href={`/wavecore-erp/documents/folders/${folder.name.toLowerCase()}`}
                    className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 hover:border-indigo-300 hover:shadow-md transition-all text-center group">
                    <div className={`w-14 h-14 rounded-xl ${folder.bg} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                      <FolderOpen className={`w-7 h-7 ${folder.color}`} />
                    </div>
                    <p className="font-medium text-sm text-neutral-900 dark:text-white">{folder.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{folder.files} files</p>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* File Types Overview */}
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4 text-neutral-900 dark:text-white">File Types</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {fileTypes.map((type) => {
                const Icon = type.icon
                return (
                  <div key={type.type} className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 text-center hover:shadow-md transition-all">
                    <Icon className={`w-8 h-8 ${type.color} mx-auto mb-2`} />
                    <p className="font-medium text-sm">{type.type}</p>
                    <p className="text-xs text-muted-foreground">{type.count} files</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Recent Files / Empty State */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden shadow-sm">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-bold text-neutral-900 dark:text-white">Recent Files</h2>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="text" placeholder="Search files..." className="pl-9 pr-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48" />
                </div>
                <Button variant="outline" size="sm"><Filter className="w-4 h-4" /></Button>
                <Button variant="outline" size="sm"><Grid3X3 className="w-4 h-4" /></Button>
              </div>
            </div>
            <div className="p-16 text-center">
              <div className="w-20 h-20 rounded-2xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-10 h-10 text-indigo-500" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">No documents yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Upload your first document to get started with secure file storage and sharing.
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/wavecore-erp/documents/upload">
                  <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                    <Upload className="w-4 h-4" /> Upload Document
                  </Button>
                </Link>
                <Button variant="outline">
                  <FolderOpen className="w-4 h-4 mr-1" /> Create Folder
                </Button>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="grid lg:grid-cols-3 gap-6 mt-8">
            <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
              <Shield className="w-8 h-8 text-green-500 mb-3" />
              <h3 className="font-bold mb-1">Secure Storage</h3>
              <p className="text-sm text-muted-foreground">End-to-end encryption for all your documents</p>
            </div>
            <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
              <Eye className="w-8 h-8 text-blue-500 mb-3" />
              <h3 className="font-bold mb-1">OCR Technology</h3>
              <p className="text-sm text-muted-foreground">Extract text from scanned documents automatically</p>
            </div>
            <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
              <Edit3 className="w-8 h-8 text-purple-500 mb-3" />
              <h3 className="font-bold mb-1">Digital Signatures</h3>
              <p className="text-sm text-muted-foreground">Sign documents electronically with legal validity</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}