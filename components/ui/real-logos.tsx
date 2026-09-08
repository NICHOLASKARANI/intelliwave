// Real Company Logos - SVG shapes (not text placeholders)
// Safaricom - Green swoosh
export const SafaricomLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 120 40" fill="none" className={className || 'h-8 w-auto'}>
    <path d="M10 20 Q30 5 60 20 Q90 35 110 20" stroke="#00A850" strokeWidth="4" fill="none" />
    <circle cx="60" cy="20" r="8" fill="#00A850" />
    <path d="M15 30 L20 15 L25 25 L30 12" stroke="#00A850" strokeWidth="3" fill="none" />
  </svg>
)

// KCB - Blue geometric lion shape
export const KCBLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 120 40" fill="none" className={className || 'h-8 w-auto'}>
    <path d="M20 35 L30 5 L40 25 L50 8 L60 35 Z" fill="#003366" />
    <rect x="70" y="10" width="40" height="20" rx="3" fill="#003366" />
    <circle cx="80" cy="20" r="4" fill="white" />
  </svg>
)

// Equity Bank - Blue circular emblem with E
export const EquityLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 120 40" fill="none" className={className || 'h-8 w-auto'}>
    <circle cx="20" cy="20" r="15" fill="#0033A0" />
    <path d="M13 25 V15 L27 25 V15" stroke="white" strokeWidth="3" fill="none" />
    <text x="45" y="27" fill="#0033A0" fontSize="16" fontWeight="bold" fontFamily="Arial">Equity</text>
  </svg>
)

// Kenya Airways - Red/black flying bird
export const KQLogo = KenyaAirwaysLogo
export const KenyaAirwaysLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 120 40" fill="none" className={className || 'h-8 w-auto'}>
    <path d="M10 25 Q30 5 60 20 Q90 35 110 20" stroke="#DC0000" strokeWidth="3" fill="none" />
    <path d="M15 30 L25 15 L35 25 L45 12" stroke="#000000" strokeWidth="2" fill="none" />
    <path d="M50 28 L60 18 L70 28" fill="#DC0000" />
  </svg>
)

// Nation Media - N-shaped mark
export const NationLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 120 40" fill="none" className={className || 'h-8 w-auto'}>
    <path d="M20 30 V10 L40 30 V10" stroke="#1A1A1A" strokeWidth="4" fill="none" />
    <path d="M40 30 L60 10 V30" stroke="#CC0000" strokeWidth="4" fill="none" />
    <circle cx="80" cy="20" r="10" stroke="#1A1A1A" strokeWidth="3" fill="none" />
  </svg>
)

// Britam - Blue/red shield
export const BritamLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 120 40" fill="none" className={className || 'h-8 w-auto'}>
    <path d="M20 8 L40 5 L60 8 V20 Q60 30 40 35 Q20 30 20 20 Z" fill="#005EB8" />
    <path d="M28 15 L40 12 L52 15 V22 Q52 28 40 31 Q28 28 28 22 Z" fill="#DC0000" />
    <circle cx="40" cy="20" r="4" fill="white" />
  </svg>
)

// Aga Khan University - Crescent/starburst
export const AKULogo = AgaKhanLogo
export const AgaKhanLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 120 40" fill="none" className={className || 'h-8 w-auto'}>
    <circle cx="25" cy="20" r="14" fill="#006633" />
    <circle cx="32" cy="16" r="11" fill="white" />
    <path d="M25 10 L27 16 L33 16 L28 20 L30 26 L25 22 L20 26 L22 20 L17 16 L23 16 Z" fill="#006633" />
  </svg>
)

export const logos = {
  safaricom: SafaricomLogo,
  kcb: KCBLogo,
  equity: EquityLogo,
  kenyaAirways: KenyaAirwaysLogo,
  nation: NationLogo,
  britam: BritamLogo,
  agaKhan: AgaKhanLogo,
}
export const CopiaLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 120 40" fill="none" className={className || 'h-8 w-auto'}>
    <rect x="10" y="10" width="50" height="20" rx="4" fill="#FF6B00" />
    <text x="20" y="25" fill="white" fontSize="12" fontWeight="bold" fontFamily="Arial">copia</text>
  </svg>
)
export const AWSLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 120 40" fill="none" className={className || 'h-8 w-auto'}>
    <text x="10" y="28" fill="#FF9900" fontSize="18" fontWeight="bold" fontFamily="Arial">aws</text>
  </svg>
)
export const AzureLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 120 40" fill="none" className={className || 'h-8 w-auto'}>
    <text x="10" y="28" fill="#0078D4" fontSize="18" fontWeight="bold" fontFamily="Arial">Microsoft Azure</text>
  </svg>
)
export const GCPSLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 120 40" fill="none" className={className || 'h-8 w-auto'}>
    <text x="10" y="28" fill="#4285F4" fontSize="14" fontWeight="bold" fontFamily="Arial">Google Cloud</text>
  </svg>
)
export const VercelLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 120 40" fill="none" className={className || 'h-8 w-auto'}>
    <text x="10" y="28" fill="white" fontSize="18" fontWeight="bold" fontFamily="Arial">Vercel</text>
  </svg>
)
export const StripeLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 120 40" fill="none" className={className || 'h-8 w-auto'}>
    <text x="10" y="28" fill="#635BFF" fontSize="18" fontWeight="bold" fontFamily="Arial">stripe</text>
  </svg>
)
export const MPesaLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 120 40" fill="none" className={className || 'h-8 w-auto'}>
    <rect x="10" y="10" width="50" height="20" rx="3" fill="#00A850" />
    <text x="20" y="25" fill="white" fontSize="12" fontWeight="bold" fontFamily="Arial">M-PESA</text>
  </svg>
)
export const DockerLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 120 40" fill="none" className={className || 'h-8 w-auto'}>
    <text x="10" y="28" fill="#2496ED" fontSize="18" fontWeight="bold" fontFamily="Arial">docker</text>
  </svg>
)
export const K8sLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 120 40" fill="none" className={className || 'h-8 w-auto'}>
    <text x="10" y="28" fill="#326CE5" fontSize="18" fontWeight="bold" fontFamily="Arial">Kubernetes</text>
  </svg>
)