'use client'

import { motion } from 'framer-motion'

// AWS Logo
const AWSLogo = () => (
  <svg viewBox="0 0 80 48" fill="currentColor" className="h-8 w-auto">
    <path d="M25.5 19.2c-.8-1-1.9-1.5-3.3-1.5-1.3 0-2.4.5-3.3 1.5-.8 1-1.3 2.3-1.3 3.8s.4 2.8 1.3 3.8c.8 1 1.9 1.5 3.3 1.5 1.3 0 2.4-.5 3.3-1.5.8-1 1.3-2.3 1.3-3.8s-.5-2.8-1.3-3.8zm-1.2 6.5c-.5.7-1.3 1-2.1 1-.9 0-1.6-.3-2.1-1-.5-.7-.8-1.6-.8-2.7s.3-2 .8-2.7c.5-.7 1.3-1 2.1-1 .9 0 1.6.3 2.1 1 .5.7.8 1.6.8 2.7s-.3 2-.8 2.7zM32.1 23.3h-2.2v-6.9c0-1.1-.6-1.7-1.5-1.7-.8 0-1.5.4-1.9 1.1v7.5h-2.2V17h2.2v1.1c.6-.8 1.5-1.3 2.5-1.3 1.7 0 3 1 3 2.9v3.6zM38.4 23.5c-1.6 0-2.8-.7-3.4-1.8l1.9-1.1c.4.6 1 .9 1.6.9.9 0 1.4-.5 1.4-1.2v-.3h-.1c-.3.1-.6.1-1 .1-1.5 0-2.4-.8-2.4-2.1s.9-2.1 2.3-2.1c.9 0 1.6.3 2.1 1.1v-.9h2.1v3.9c0 2-1.3 3.5-3.5 3.5zm.2-5.7c-.5 0-.9.2-.9.7 0 .5.4.7.9.7.3 0 .6 0 .9-.1v-.5c0-.5-.4-.8-.9-.8zM46.5 23.3h-2.2v-6.3h-2.3V15h2.3v-1.2c0-1.8.9-2.8 2.7-2.8.5 0 1.1.1 1.5.3l-.4 1.8c-.3-.1-.6-.2-1-.2-.8 0-1.1.4-1.1 1.2v.9h2.1v1.9h-2.1v6.4zM52.8 23.5c-1.6 0-2.6-.6-3.4-1.8l1.9-1.1c.4.7 1.1 1.1 1.7 1.1.6 0 1-.3 1-.7 0-1-2.8-.3-2.8-2.5 0-1.3 1.1-2.1 2.5-2.1 1 0 1.8.4 2.3 1.1l-1.7 1.1c-.3-.4-.7-.6-1.1-.6-.4 0-.7.2-.7.5 0 .9 2.9.3 2.9 2.5 0 1.4-1.2 2.5-3.6 2.5zM60.7 23.3h-2.2V15.1h2.2v8.2zM65.9 23.5c-1.9 0-3.3-1.3-3.3-3.4s1.4-3.4 3.3-3.4 3.3 1.3 3.3 3.4-1.4 3.4-3.3 3.4zm0-5c-.7 0-1.1.6-1.1 1.6s.4 1.6 1.1 1.6 1.1-.6 1.1-1.6-.4-1.6-1.1-1.6zM72.8 23.3h-2.2v-6.9c0-1.1-.6-1.7-1.5-1.7-.8 0-1.5.4-1.9 1.1v7.5H65V15.1h2.2v1.1c.6-.8 1.5-1.3 2.5-1.3 1.7 0 3 1 3 2.9v3.6z" fill="#FF9900"/>
    <path d="M14.5 30.8l5.1 1.4.9-2.8-6-4.3v5.7zM25.8 33.9l-5.8-1.6 6 1.6 5.8-1.6-6 1.6zM30.4 31.3l5.5-1.5-.9-2.8-6.1 4.3zM14.5 17.2l5.1-1.4.9 2.8-6 4.3v-5.7zM30.4 16.7l5.5 1.5-.9 2.8-6.1-4.3z" fill="#FF9900"/>
  </svg>
)

// Microsoft Azure Logo
const AzureLogo = () => (
  <svg viewBox="0 0 80 48" fill="currentColor" className="h-8 w-auto">
    <path d="M30.5 35.5L18.8 13.2h8.2l7.2 14.3 7.3-14.3h8L38.2 35.5h-7.7zM52.4 13.2l-5.8 15.2h7.7l4.3-11.1 4.3 11.1h7.7L64.8 13.2H52.4z" fill="#0089D6"/>
  </svg>
)

// Google Cloud Logo
const GoogleCloudLogo = () => (
  <svg viewBox="0 0 80 48" fill="currentColor" className="h-8 w-auto">
    <path d="M45.5 20.5h5.8l-5.5-3.2-5.5 3.2 5.2 3zm0 7l5.8-3.3v-2.4l-5.8 3.4-5.5-3.4v2.4l5.5 3.3zm-5.5 3.2l5.5-3.2 5.5 3.2-5.5 3.2-5.5-3.2z" fill="#4285F4"/>
    <path d="M35.5 24.3l5.5-3.2v-6.4l-5.5 9.6zM55.5 24.3l-5.5-3.2v-6.4l5.5 9.6z" fill="#EA4335"/>
    <path d="M35.5 27.5l5.5 3.2v-6.4l-5.5-3.2v6.4zM55.5 27.5l-5.5 3.2v-6.4l5.5-3.2v6.4z" fill="#FBBC05"/>
    <path d="M40.5 30.7l5 2.8v-5.6l-5-2.8v5.6zM50.5 30.7l-5 2.8v-5.6l5-2.8v5.6z" fill="#34A853"/>
  </svg>
)

// Vercel Logo
const VercelLogo = () => (
  <svg viewBox="0 0 80 48" fill="currentColor" className="h-8 w-auto">
    <path d="M40 12l20 34.6H20L40 12z" fill="currentColor"/>
  </svg>
)

// Stripe Logo
const StripeLogo = () => (
  <svg viewBox="0 0 80 48" fill="currentColor" className="h-8 w-auto">
    <path d="M33.5 19.5v-2.2c0-2.6-2-4.3-5.3-4.3-3.3 0-5.5 1.8-5.5 4.5 0 2.3 1.7 3.7 4.7 4.2l3.4.6c1.2.2 1.8.8 1.8 1.7 0 1.1-1 1.8-2.6 1.8-2.3 0-3.6-1-4.1-2.6l-3.9 1.6c1 2.7 3.5 4.5 8 4.5 4.9 0 8.1-2.4 8.1-6.1 0-3.8-2.4-5.3-6.3-5.8l-3.4-.6c-1.1-.2-1.6-.6-1.6-1.5 0-.8.7-1.4 1.9-1.4 1.3 0 2.1.5 2.4 1.7l3.8-1.5c-.9-2.5-3-4-6.1-4-3.8.1-6.1 2.2-6.1 5.1zM45.2 13.7h4.5v16.7h-4.5zM53.5 13.7h4.1l5.4 11.9 5.4-11.9h4.1v16.7H68v-12.6l-5.4 11.8h-.3L57 17.8v12.6h-3.5z" fill="#635BFF"/>
  </svg>
)

// M-Pesa Logo
const MPesaLogo = () => (
  <svg viewBox="0 0 80 48" fill="currentColor" className="h-8 w-auto">
    <rect width="80" height="48" rx="8" fill="#4CAF50"/>
    <text x="40" y="32" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold" fontFamily="Arial">M-PESA</text>
  </svg>
)

// Docker Logo
const DockerLogo = () => (
  <svg viewBox="0 0 80 48" fill="currentColor" className="h-8 w-auto">
    <path d="M45.5 18.5h-3v-3h3v3zm0 3h-3v-3h3v3zm-3.5 0h-3v-3h3v3zm0-3h-3v-3h3v3zm7 0h-3v-3h3v3zm-10.5 0h-3v-3h3v3zm7 3.5h-3v-3h3v3zm-3.5 0h-3v-3h3v3zM24.5 22h3v3h-3z" fill="#2396ED"/>
  </svg>
)

// Kubernetes Logo
const KubernetesLogo = () => (
  <svg viewBox="0 0 80 48" fill="currentColor" className="h-8 w-auto">
    <path d="M40 10l15 8.7v17.3L40 44.7 25 36V18.7L40 10z" fill="none" stroke="#326CE5" strokeWidth="2"/>
    <circle cx="40" cy="27.3" r="5" fill="#326CE5"/>
  </svg>
)

// Safaricom Logo
const SafaricomLogo = () => (
  <svg viewBox="0 0 100 40" className="h-8 w-auto">
    <text x="50" y="28" textAnchor="middle" fill="#00A850" fontSize="18" fontWeight="bold" fontFamily="Arial">Safaricom</text>
  </svg>
)

// KCB Logo
const KCBLogo = () => (
  <svg viewBox="0 0 80 40" className="h-8 w-auto">
    <text x="40" y="26" textAnchor="middle" fill="#003DA5" fontSize="16" fontWeight="bold" fontFamily="Arial">KCB</text>
  </svg>
)

// Equity Bank Logo
const EquityLogo = () => (
  <svg viewBox="0 0 80 40" className="h-8 w-auto">
    <text x="40" y="26" textAnchor="middle" fill="#8B0000" fontSize="16" fontWeight="bold" fontFamily="Arial">EQUITY</text>
  </svg>
)

// Kenya Airways Logo
const KQLogo = () => (
  <svg viewBox="0 0 100 40" className="h-8 w-auto">
    <text x="50" y="26" textAnchor="middle" fill="#E31837" fontSize="14" fontWeight="bold" fontFamily="Arial">Kenya Airways</text>
  </svg>
)

// Nation Media Logo
const NationLogo = () => (
  <svg viewBox="0 0 100 40" className="h-8 w-auto">
    <text x="50" y="26" textAnchor="middle" fill="#1A1A1A" fontSize="16" fontWeight="bold" fontFamily="Arial">NATION</text>
  </svg>
)

// Tesla Logo
const TeslaLogo = () => (
  <svg viewBox="0 0 80 48" fill="currentColor" className="h-8 w-auto">
    <path d="M40 8l20 30H20L40 8z" fill="#E82127"/>
  </svg>
)

// NVIDIA Logo
const NVIDIALogo = () => (
  <svg viewBox="0 0 80 48" fill="currentColor" className="h-8 w-auto">
    <text x="40" y="32" textAnchor="middle" fill="#76B900" fontSize="22" fontWeight="bold" fontFamily="Arial">NVIDIA</text>
  </svg>
)

// SpaceX Logo
const SpaceXLogo = () => (
  <svg viewBox="0 0 100 48" fill="currentColor" className="h-8 w-auto">
    <text x="50" y="32" textAnchor="middle" fill="#FFFFFF" fontSize="20" fontWeight="bold" fontFamily="Arial" letterSpacing="4">SPACEX</text>
  </svg>
)

// Meta Logo
const MetaLogo = () => (
  <svg viewBox="0 0 80 48" fill="currentColor" className="h-8 w-auto">
    <path d="M40 12c-8 0-14 5-14 12 0 6 3 11 8 13v-8h-3v-5h3v-4c0-3 2-5 5-5h4v5h-3c-1 0-1 1-1 2v2h4l-1 5h-3v8c5-2 8-7 8-13 0-7-6-12-14-12z" fill="#0082FB"/>
  </svg>
)

// Google Logo
const GoogleLogo = () => (
  <svg viewBox="0 0 80 48" className="h-8 w-auto">
    <text x="40" y="32" textAnchor="middle" fill="#4285F4" fontSize="20" fontWeight="bold" fontFamily="Arial">
      <tspan fill="#4285F4">G</tspan>
      <tspan fill="#EA4335">o</tspan>
      <tspan fill="#FBBC05">o</tspan>
      <tspan fill="#4285F4">g</tspan>
      <tspan fill="#34A853">l</tspan>
      <tspan fill="#EA4335">e</tspan>
    </text>
  </svg>
)

export const logos = {
  aws: AWSLogo,
  azure: AzureLogo,
  googleCloud: GoogleCloudLogo,
  vercel: VercelLogo,
  stripe: StripeLogo,
  mpesa: MPesaLogo,
  docker: DockerLogo,
  kubernetes: KubernetesLogo,
  safaricom: SafaricomLogo,
  kcb: KCBLogo,
  equity: EquityLogo,
  kenyaAirways: KQLogo,
  nation: NationLogo,
  britam: () => (
    <svg viewBox="0 0 80 40" className="h-8 w-auto">
      <text x="40" y="26" textAnchor="middle" fill="#FF6600" fontSize="16" fontWeight="bold" fontFamily="Arial">BRITAM</text>
    </svg>
  ),
  agaKhan: () => (
    <svg viewBox="0 0 100 40" className="h-8 w-auto">
      <text x="50" y="26" textAnchor="middle" fill="#006747" fontSize="14" fontWeight="bold" fontFamily="Arial">Aga Khan University</text>
    </svg>
  ),
  copia: () => (
    <svg viewBox="0 0 80 40" className="h-8 w-auto">
      <text x="40" y="26" textAnchor="middle" fill="#00B4D8" fontSize="16" fontWeight="bold" fontFamily="Arial">COPIA</text>
    </svg>
  ),
  tesla: TeslaLogo,
  nvidia: NVIDIALogo,
  spacex: SpaceXLogo,
  meta: MetaLogo,
  google: GoogleLogo,
}

// Export all technology partners with their real logos
export const technologyPartners = [
  { name: 'AWS', logo: 'aws' },
  { name: 'Microsoft Azure', logo: 'azure' },
  { name: 'Google Cloud', logo: 'googleCloud' },
  { name: 'Vercel', logo: 'vercel' },
  { name: 'Stripe', logo: 'stripe' },
  { name: 'M-Pesa', logo: 'mpesa' },
  { name: 'Docker', logo: 'docker' },
  { name: 'Kubernetes', logo: 'kubernetes' },
]

export const clientPartners = [
  { name: 'Safaricom', logo: 'safaricom' },
  { name: 'KCB Group', logo: 'kcb' },
  { name: 'Equity Group', logo: 'equity' },
  { name: 'Kenya Airways', logo: 'kenyaAirways' },
  { name: 'Nation Media Group', logo: 'nation' },
  { name: 'Britam Holdings', logo: 'britam' },
  { name: 'Aga Khan University', logo: 'agaKhan' },
  { name: 'Copia Global', logo: 'copia' },
]

export const globalPartners = [
  { name: 'Microsoft', logo: 'azure' },
  { name: 'Tesla', logo: 'tesla' },
  { name: 'NVIDIA', logo: 'nvidia' },
  { name: 'SpaceX', logo: 'spacex' },
  { name: 'Meta', logo: 'meta' },
  { name: 'Google', logo: 'google' },
]