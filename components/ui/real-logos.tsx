// Real Company Logos - SVG shapes
// Safaricom - Green swoosh
export const SafaricomLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 120 40" fill="none" className={className || 'h-8 w-auto'}>
    <path d="M10 20 Q30 5 60 20 Q90 35 110 20" stroke="#00A850" strokeWidth="4" fill="none" />
    <circle cx="60" cy="20" r="8" fill="#00A850" />
    <path d="M15 30 L20 15 L25 25 L30 12" stroke="#00A850" strokeWidth="3" fill="none" />
  </svg>
)

// KCB - Blue geometric lion
export const KCBLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 120 40" fill="none" className={className || 'h-8 w-auto'}>
    <path d="M20 35 L30 5 L40 25 L50 8 L60 35 Z" fill="#003366" />
    <rect x="70" y="10" width="40" height="20" rx="3" fill="#003366" />
    <circle cx="80" cy="20" r="4" fill="white" />
  </svg>
)

// Equity Bank
export const EquityLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 120 40" fill="none" className={className || 'h-8 w-auto'}>
    <circle cx="20" cy="20" r="15" fill="#0033A0" />
    <path d="M13 25 V15 L27 25 V15" stroke="white" strokeWidth="3" fill="none" />
    <text x="45" y="27" fill="#0033A0" fontSize="16" fontWeight="bold" fontFamily="Arial">Equity</text>
  </svg>
)

// Kenya Airways (KQ)
export const KQLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 120 40" fill="none" className={className || 'h-8 w-auto'}>
    <path d="M10 25 Q30 5 60 20 Q90 35 110 20" stroke="#DC0000" strokeWidth="3" fill="none" />
    <path d="M15 30 L25 15 L35 25 L45 12" stroke="#000000" strokeWidth="2" fill="none" />
    <path d="M50 28 L60 18 L70 28" fill="#DC0000" />
  </svg>
)

// Kenya Airways alias
export const KenyaAirwaysLogo = KQLogo

// Nation Media
export const NationLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 120 40" fill="none" className={className || 'h-8 w-auto'}>
    <path d="M20 30 V10 L40 30 V10" stroke="#1A1A1A" strokeWidth="4" fill="none" />
    <path d="M40 30 L60 10 V30" stroke="#CC0000" strokeWidth="4" fill="none" />
    <circle cx="80" cy="20" r="10" stroke="#1A1A1A" strokeWidth="3" fill="none" />
  </svg>
)

// Britam
export const BritamLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 120 40" fill="none" className={className || 'h-8 w-auto'}>
    <path d="M20 8 L40 5 L60 8 V20 Q60 30 40 35 Q20 30 20 20 Z" fill="#005EB8" />
    <path d="M28 15 L40 12 L52 15 V22 Q52 28 40 31 Q28 28 28 22 Z" fill="#DC0000" />
    <circle cx="40" cy="20" r="4" fill="white" />
  </svg>
)

// Aga Khan University
export const AKULogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 120 40" fill="none" className={className || 'h-8 w-auto'}>
    <circle cx="25" cy="20" r="14" fill="#006633" />
    <circle cx="32" cy="16" r="11" fill="white" />
    <path d="M25 10 L27 16 L33 16 L28 20 L30 26 L25 22 L20 26 L22 20 L17 16 L23 16 Z" fill="#006633" />
  </svg>
)

// Aga Khan alias
export const AgaKhanLogo = AKULogo

// Copia
export const CopiaLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 120 40" fill="none" className={className || 'h-8 w-auto'}>
    <circle cx="20" cy="20" r="12" fill="#FF6B00" />
    <path d="M14 20 L18 20 L20 16 L24 24 L26 20 L30 20" stroke="white" strokeWidth="2" fill="none" />
    <text x="40" y="26" fill="#FF6B00" fontSize="14" fontWeight="bold" fontFamily="Arial">Copia</text>
  </svg>
)

// AWS
export const AWSLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 120 40" fill="none" className={className || 'h-8 w-auto'}>
    <path d="M10 25 Q25 10 60 15 Q90 20 110 15" stroke="#FF9900" strokeWidth="3" fill="none" />
    <path d="M10 30 Q30 20 60 25 Q90 30 110 25" stroke="#FF9900" strokeWidth="3" fill="none" />
    <text x="30" y="15" fill="#FF9900" fontSize="10" fontWeight="bold" fontFamily="Arial">aws</text>
  </svg>
)

// Azure
export const AzureLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 120 40" fill="none" className={className || 'h-8 w-auto'}>
    <path d="M20 10 L60 35 L100 10 Z" fill="#0078D4" />
    <path d="M40 10 L60 25 L80 10 Z" fill="white" opacity="0.5" />
  </svg>
)

// Google Cloud
export const GCPSLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 120 40" fill="none" className={className || 'h-8 w-auto'}>
    <path d="M30 15 Q40 5 55 10 L60 15 Q70 20 75 30 L65 35 Q50 40 40 35 L30 30 Z" fill="#4285F4" />
    <path d="M55 10 L60 15 Q65 20 60 25 L50 20 Z" fill="#EA4335" />
    <path d="M50 20 L60 25 Q65 30 60 35 L50 30 Z" fill="#FBBC05" />
    <path d="M40 35 L65 35 Q75 30 75 30 L80 25 L85 25" fill="#34A853" />
  </svg>
)

// Vercel
export const VercelLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 120 40" fill="none" className={className || 'h-8 w-auto'}>
    <path d="M20 10 L60 35 L100 10" stroke="white" strokeWidth="3" fill="none" />
    <path d="M40 10 L60 25 L80 10" stroke="white" strokeWidth="2" fill="none" />
  </svg>
)

// Stripe
export const StripeLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 120 40" fill="none" className={className || 'h-8 w-auto'}>
    <text x="10" y="28" fill="#635BFF" fontSize="22" fontWeight="bold" fontFamily="Arial">stripe</text>
    <path d="M80 15 Q95 10 105 15 V20 Q95 15 80 20 Z" fill="#635BFF" />
  </svg>
)

// M-Pesa
export const MPesaLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 120 40" fill="none" className={className || 'h-8 w-auto'}>
    <rect x="10" y="10" width="50" height="20" rx="3" fill="#00A850" />
    <text x="20" y="25" fill="white" fontSize="12" fontWeight="bold" fontFamily="Arial">M-PESA</text>
    <text x="65" y="25" fill="#DC0000" fontSize="12" fontWeight="bold" fontFamily="Arial">Safaricom</text>
  </svg>
)

// Docker
export const DockerLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 120 40" fill="none" className={className || 'h-8 w-auto'}>
    <path d="M10 15 H15 V20 H10 Z M20 15 H25 V20 H20 Z M30 15 H35 V20 H30 Z" fill="#2496ED" />
    <path d="M15 20 H20 V25 H15 Z M25 20 H30 V25 H25 Z M35 20 H40 V25 H35 Z" fill="#2496ED" />
    <path d="M10 25 H40 V30 H10 Z" fill="#2496ED" />
    <path d="M45 15 H50 V20 H45 Z M55 15 H60 V20 H55 Z M50 20 H55 V25 H50 Z" fill="#2496ED" />
    <path d="M45 25 H60 V30 H45 Z" fill="#2496ED" />
  </svg>
)

// Kubernetes
export const K8sLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 120 40" fill="none" className={className || 'h-8 w-auto'}>
    <path d="M30 10 L50 5 L70 10 L75 25 L50 35 L25 25 Z" fill="#326CE5" />
    <circle cx="50" cy="20" r="8" fill="white" />
    <circle cx="50" cy="20" r="4" fill="#326CE5" />
    <path d="M50 12 V28 M42 16 L58 24 M42 24 L58 16" stroke="white" strokeWidth="2" />
  </svg>
)

export const logos = {
  safaricom: SafaricomLogo,
  kcb: KCBLogo,
  equity: EquityLogo,
  kq: KQLogo,
  kenyaAirways: KQLogo,
  nation: NationLogo,
  britam: BritamLogo,
  aku: AKULogo,
  agaKhan: AKULogo,
  copia: CopiaLogo,
  aws: AWSLogo,
  azure: AzureLogo,
  gcp: GCPSLogo,
  vercel: VercelLogo,
  stripe: StripeLogo,
  mpesa: MPesaLogo,
  docker: DockerLogo,
  k8s: K8sLogo,
}