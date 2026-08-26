'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CreditCard, Phone, Loader2, CheckCircle, MapPin } from 'lucide-react'

export default function CheckoutPage() {
  const [paymentMethod, setPaymentMethod] = useState('mpesa')
  const [phone, setPhone] = useState('')
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleCheckout = async () => {
    setProcessing(true)
    // Call M-Pesa STK push
    try {
      const res = await fetch('/api/wavecore/mpesa/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, amount: 500 })
      })
      if (res.ok) {
        setSuccess(true)
      }
    } catch (error) {
      console.error('Checkout failed')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/store/cart" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Checkout</span>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 lg:p-8">
        {success ? (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
            <p className="text-muted-foreground">Receipt sent to your phone</p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-pink-500" /> Checkout
            </h1>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Payment Method</label>
                <div className="space-y-2">
                  <button onClick={() => setPaymentMethod('mpesa')}
                    className={`w-full p-4 rounded-xl border ${paymentMethod === 'mpesa' ? 'bg-green-50 border-green-500' : 'bg-white dark:bg-neutral-900'}`}>
                    <div className="flex items-center gap-2">
                      <Phone className="w-5 h-5 text-green-600" />
                      <span className="font-bold">M-Pesa</span>
                    </div>
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Phone Number</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder="07XX XXX XXX" className="w-full px-4 py-3 rounded-xl border" />
              </div>
              <button onClick={handleCheckout} disabled={processing || !phone}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                {processing ? 'Processing...' : 'Pay Now'}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}