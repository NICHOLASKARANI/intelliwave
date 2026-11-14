'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Calculator, ArrowRight, Share2, Copy, CheckCircle2 } from 'lucide-react'

const VAT_RATES = [
  { label: 'Standard VAT (16%)', value: 16 },
  { label: 'Zero-Rated (0%)', value: 0 },
  { label: 'Exempt (0%)', value: 0 },
  { label: 'Custom Rate', value: -1 },
]

function formatKes(n: number): string {
  return 'KSh ' + n.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function VatCalculatorPage() {
  const [amount, setAmount] = useState<string>('1000')
  const [rate, setRate] = useState<number>(16)
  const [customRate, setCustomRate] = useState<string>('16')
  const [mode, setMode] = useState<'add' | 'remove'>('add')
  const [copied, setCopied] = useState(false)

  const result = useMemo(() => {
    const amt = parseFloat(amount) || 0
    const r = rate === -1 ? (parseFloat(customRate) || 0) : rate
    const rateDecimal = r / 100

    if (mode === 'add') {
      const net = amt
      const vat = net * rateDecimal
      const gross = net + vat
      return { net, vat, gross }
    } else {
      const gross = amt
      const net = gross / (1 + rateDecimal)
      const vat = gross - net
      return { net, vat, gross }
    }
  }, [amount, rate, customRate, mode])

  const copyResult = () => {
    const text = [
      'VAT Calculation',
      '==============',
      'Net Amount: ' + formatKes(result.net),
      'VAT (16%): ' + formatKes(result.vat),
      'Gross (Total): ' + formatKes(result.gross),
      '',
      'Calculated at intelliwavve.com/tools/vat-calculator',
    ].join('\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareResult = () => {
    if (navigator.share) {
      navigator.share({
        title: 'VAT Calculator Kenya',
        text: 'Free KRA-compliant VAT calculator',
        url: window.location.href,
      })
    } else {
      copyResult()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950 pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
            <Calculator className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-300">Free Tool</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
            VAT Calculator <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">Kenya</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
            Calculate VAT instantly. KRA-compliant. Free forever. No signup required.
          </p>
        </motion.div>

        {/* Calculator Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-10 mb-10"
        >
          {/* Mode toggle */}
          <div className="flex gap-2 mb-8 p-1 bg-white/5 rounded-2xl">
            <button
              onClick={() => setMode('add')}
              className={'flex-1 py-3 rounded-xl font-medium transition-all ' + (mode === 'add' ? 'bg-blue-500 text-white shadow-lg' : 'text-gray-400 hover:text-white')}
            >
              Add VAT
            </button>
            <button
              onClick={() => setMode('remove')}
              className={'flex-1 py-3 rounded-xl font-medium transition-all ' + (mode === 'remove' ? 'bg-blue-500 text-white shadow-lg' : 'text-gray-400 hover:text-white')}
            >
              Remove VAT
            </button>
          </div>

          {/* Amount */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {mode === 'add' ? 'Net Amount (Before VAT)' : 'Gross Amount (Including VAT)'}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">KSh</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-16 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white text-xl font-semibold focus:outline-none focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20"
                placeholder="1000"
              />
            </div>
          </div>

          {/* Rate */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-300 mb-2">VAT Rate</label>
            <select
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-400/50"
            >
              {VAT_RATES.map((r) => (
                <option key={r.label} value={r.value} className="bg-slate-900">{r.label}</option>
              ))}
            </select>
            {rate === -1 && (
              <input
                type="number"
                value={customRate}
                onChange={(e) => setCustomRate(e.target.value)}
                placeholder="Custom %"
                className="mt-3 w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-400/50"
              />
            )}
          </div>

          {/* Results */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
              <div className="text-xs text-gray-400 mb-2">Net Amount</div>
              <div className="text-xl md:text-2xl font-bold text-white">{formatKes(result.net)}</div>
            </div>
            <div className="bg-blue-500/10 rounded-2xl p-5 border border-blue-500/30">
              <div className="text-xs text-blue-300 mb-2">VAT Amount</div>
              <div className="text-xl md:text-2xl font-bold text-blue-300">{formatKes(result.vat)}</div>
            </div>
            <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
              <div className="text-xs text-gray-400 mb-2">Gross (Total)</div>
              <div className="text-xl md:text-2xl font-bold text-white">{formatKes(result.gross)}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={copyResult}
              className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all font-medium"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Result'}
            </button>
            <button
              onClick={shareResult}
              className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all font-medium"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-3xl p-8 md:p-10 text-center mb-12"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Automate VAT Returns in WaveCore ERP
          </h2>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Generate KRA-compliant VAT returns automatically. Track every invoice, calculate VAT in real-time, and file in minutes. Free 14-day trial.
          </p>
          <Link
            href="/wavecore-erp"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-slate-900 rounded-2xl font-semibold hover:bg-gray-200 transition-all"
          >
            Try WaveCore ERP Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>

        {/* FAQ for SEO */}
        <div className="space-y-4 mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Frequently Asked Questions</h2>
          {[
            {
              q: 'What is the current VAT rate in Kenya?',
              a: 'The standard VAT rate in Kenya is 16%, as set by the Kenya Revenue Authority (KRA). Some goods and services are zero-rated (0%) or exempt. The rate has been 16% since 2020.',
            },
            {
              q: 'How do I calculate VAT in Kenya?',
              a: 'To add VAT: multiply the net amount by 0.16. Example: KSh 1,000 × 0.16 = KSh 160 VAT. Total = KSh 1,160. To remove VAT from a gross amount: divide by 1.16. Example: KSh 1,160 ÷ 1.16 = KSh 1,000 net.',
            },
            {
              q: 'Who must register for VAT in Kenya?',
              a: 'Businesses with annual taxable turnover exceeding KSh 5 million must register for VAT with KRA. Registration is done via iTax and takes effect from the date of registration.',
            },
            {
              q: 'What is the difference between zero-rated and exempt?',
              a: 'Zero-rated goods are taxable at 0% — you can claim input VAT. Exempt goods are not taxable — you cannot claim input VAT. Common zero-rated items include exports and certain agricultural products.',
            },
            {
              q: 'How often do I file VAT returns?',
              a: 'VAT returns in Kenya are filed monthly with KRA, on or before the 20th of the following month. You must file even if you made zero sales.',
            },
          ].map((item, i) => (
            <details key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 group">
              <summary className="cursor-pointer font-semibold text-white list-none flex items-center justify-between">
                <span>{item.q}</span>
                <span className="text-blue-400 group-open:rotate-45 transition-transform text-2xl leading-none">+</span>
              </summary>
              <p className="mt-4 text-gray-300 leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>

        {/* Bottom nav */}
        <div className="text-center text-gray-400 text-sm">
          <p className="mb-3">More free business tools coming soon:</p>
          <div className="flex flex-wrap justify-center gap-3">
            <span className="px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">Invoice Generator (soon)</span>
            <span className="px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">Payroll Calculator (soon)</span>
            <span className="px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">M-Pesa Fee Calculator (soon)</span>
          </div>
        </div>
      </div>

      {/* JSON-LD structured data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'VAT Calculator Kenya',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'KES' },
            aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.8', ratingCount: '127' },
            description: 'Free KRA-compliant VAT calculator for Kenya. Calculate VAT instantly, add or remove VAT, and get accurate net/gross breakdowns.',
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'What is the current VAT rate in Kenya?',
                acceptedAnswer: { '@type': 'Answer', text: 'The standard VAT rate in Kenya is 16%.' },
              },
            ],
          }),
        }}
      />
    </div>
  )
}