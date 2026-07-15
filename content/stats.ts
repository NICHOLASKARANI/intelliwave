// ========================================
// INTELLIWAVVE STATS - Edit this file with real numbers
// Only stats with verified: true will render
// ========================================

export interface RealStat {
  id: string
  value: number
  suffix: string
  label: string
  source: string
  asOf: string
  verified: boolean
}

export const realStats: RealStat[] = [
  // TODO: Replace with your real, verifiable numbers
  // {
  //   id: 'projects-delivered',
  //   value: 47,
  //   suffix: '+',
  //   label: 'Projects Delivered',
  //   source: 'Internal project database',
  //   asOf: '2025-01-15',
  //   verified: true,
  // },
  // {
  //   id: 'active-clients',
  //   value: 12,
  //   suffix: '',
  //   label: 'Active Clients',
  //   source: 'CRM',
  //   asOf: '2025-01-15',
  //   verified: true,
  // },
]

// Get only verified stats for rendering
export function getVerifiedStats(): RealStat[] {
  return realStats.filter(s => s.verified)
}