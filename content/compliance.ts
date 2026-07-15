// ========================================
// COMPLIANCE & CERTIFICATIONS
// Only items with verified: true will render
// ========================================

export interface ComplianceClaim {
  id: string
  title: string
  description: string
  verified: boolean
  evidenceUrl?: string
  icon: string
}

export const complianceClaims: ComplianceClaim[] = [
  // TODO: Confirm each of these before setting verified: true
  {
    id: 'soc2',
    title: 'SOC 2 Type II',
    description: 'Annual independent audit of security controls',
    verified: false, // Set to true only when you have the audit report
    evidenceUrl: '',
    icon: 'Shield',
  },
  {
    id: 'iso27001',
    title: 'ISO 27001',
    description: 'Information security management certification',
    verified: false,
    evidenceUrl: '',
    icon: 'Lock',
  },
  {
    id: 'gdpr',
    title: 'GDPR Compliant',
    description: 'EU General Data Protection Regulation',
    verified: false,
    evidenceUrl: '',
    icon: 'Database',
  },
  {
    id: 'kenya-dpa',
    title: 'Kenya DPA 2019',
    description: 'Kenya Data Protection Act compliance',
    verified: false,
    evidenceUrl: '',
    icon: 'FileCheck',
  },
]

export function getVerifiedClaims(): ComplianceClaim[] {
  return complianceClaims.filter(c => c.verified)
}