// ========================================
// INTELLIWAVVE SITE DATA
// Replace with real data before launch
// ========================================

export interface Stat {
  value: number
  label: string
  suffix?: string
  source: string
  verified: boolean
}

export interface ClientLogo {
  name: string
  logoPath: string
  permissionConfirmed: boolean
  caseStudyUrl?: string
}

export interface Certification {
  name: string
  issuer: string
  verified: boolean
  evidenceUrl?: string
  description: string
}

export interface Service {
  slug: string
  title: string
  description: string
  icon: string
  features: string[]
}

export interface CaseStudy {
  slug: string
  title: string
  client: string
  industry: string
  challenge: string
  solution: string
  outcome: string
  outcomeMetric?: string
  verified: boolean
  status: 'published' | 'confidential' | 'in-progress'
}

// ========================================
// REAL STATS - Only add numbers you can verify
// ========================================
export const siteStats: Stat[] = [
  {
    value: 0, // TODO: Replace with real project count
    label: 'Enterprise Projects',
    suffix: '+',
    source: 'Internal project database',
    verified: true,
  },
  // Add more real stats here
]

// ========================================
// CERTIFICATIONS - Only verified ones render
// ========================================
export const certifications: Certification[] = [
  // TODO: Add real certifications with evidence URLs
  // {
  //   name: 'SOC 2 Type II',
  //   issuer: 'AICPA',
  //   verified: true,
  //   evidenceUrl: 'https://example.com/soc2-report',
  //   description: 'Annual audit completed',
  // },
]

// ========================================
// CLIENT LOGOS - Only with permission
// ========================================
export const clientLogos: ClientLogo[] = [
  // TODO: Add client logos with confirmed permission
  // {
  //   name: 'Company Name',
  //   logoPath: '/logos/company.png',
  //   permissionConfirmed: true,
  //   caseStudyUrl: '/work/company-name',
  // },
]

// ========================================
// SERVICES
// ========================================
export const services: Service[] = [
  {
    slug: 'ai-development',
    title: 'AI Development',
    description: 'Custom machine learning models and AI systems for enterprise operations.',
    icon: 'Brain',
    features: ['Predictive Analytics', 'Natural Language Processing', 'Computer Vision', 'AI Agents'],
  },
  {
    slug: 'software-development',
    title: 'Software Development',
    description: 'Enterprise-grade web and mobile applications built with modern technology stacks.',
    icon: 'Code2',
    features: ['Web Applications', 'Mobile Apps', 'API Development', 'SaaS Platforms'],
  },
  {
    slug: 'cybersecurity',
    title: 'Cybersecurity',
    description: 'Security operations, threat monitoring, and compliance for enterprise systems.',
    icon: 'Shield',
    features: ['Threat Monitoring', 'Penetration Testing', 'Compliance', 'Security Audits'],
  },
  {
    slug: 'cloud-devops',
    title: 'Cloud & DevOps',
    description: 'Cloud infrastructure, CI/CD pipelines, and managed hosting with enterprise reliability.',
    icon: 'Cloud',
    features: ['AWS / Azure / GCP', 'Docker & Kubernetes', 'CI/CD Pipelines', 'Managed Hosting'],
  },
  {
    slug: 'enterprise-solutions',
    title: 'Enterprise Solutions',
    description: 'Digital transformation, ERP systems, and IT consulting for large organizations.',
    icon: 'Building2',
    features: ['Digital Transformation', 'ERP Systems', 'IT Consulting', 'Managed Services'],
  },
  {
    slug: 'iiot-automation',
    title: 'IIoT Automation',
    description: 'Industrial IoT systems, predictive maintenance, and smart manufacturing solutions.',
    icon: 'Cpu',
    features: ['Predictive Maintenance', 'Real-time Monitoring', 'Edge Computing', 'Digital Twins'],
  },
]

// ========================================
// CASE STUDIES - Only verified ones with real outcomes
// ========================================
export const caseStudies: CaseStudy[] = [
  // TODO: Add real case studies with permission
  // {
  //   slug: 'banking-ai-fraud-detection',
  //   title: 'AI Fraud Detection for Financial Services',
  //   client: 'Client Name',
  //   industry: 'Banking',
  //   challenge: 'Manual fraud detection missing cases',
  //   solution: 'AI-powered real-time detection system',
  //   outcome: 'Reduced fraud by X%',
  //   outcomeMetric: 'X% reduction',
  //   verified: true,
  //   status: 'published',
  // },
]