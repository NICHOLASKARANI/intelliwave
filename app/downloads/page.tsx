import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { Download, Smartphone, Monitor, Apple } from 'lucide-react'

export const metadata: Metadata = { title: 'Downloads - IntelliWavve Platform', description: 'Download IntelliWavve on all platforms.' }

const downloads = [
  { platform: 'Android', version: '3.2.1', size: '45MB', url: '/downloads/intelliwavve.apk', icon: Smartphone, features: ['Biometric Login', 'Camera Upload', 'Push Notifications'] },
  { platform: 'iOS', version: '3.2.1', size: '52MB', url: '/downloads/intelliwavve.ipa', icon: Apple, features: ['Face ID', 'Siri Shortcuts', 'Widgets'] },
  { platform: 'Desktop', version: '3.1.0', size: '78MB', url: '/downloads/intelliwavve-setup.exe', icon: Monitor, features: ['Offline Mode', 'Batch Processing', 'API Access'] },
]

export default function DownloadsPage() {
  return (
    <div className="py-20 container">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold mb-4">Download IntelliWavve</h1>
        <p className="text-xl text-muted-foreground">Available on all platforms</p>
      </div>
      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {downloads.map((dl) => { const Icon = dl.icon; return (
          <div key={dl.platform} className="p-8 rounded-2xl border text-center hover:shadow-xl transition-all">
            <Icon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">{dl.platform}</h3>
            <p className="text-sm text-muted-foreground mb-1">Version {dl.version} • {dl.size}</p>
            <div className="space-y-2 my-6 text-left">
              {dl.features.map((f) => (<div key={f} className="flex items-center gap-2 text-sm"><span className="w-1.5 h-1.5 rounded-full bg-green-500" />{f}</div>))}
            </div>
            <a href={dl.url} download><Button className="w-full gap-2"><Download className="w-4 h-4" /> Download</Button></a>
          </div>
        )})}
      </div>
    </div>
  )
}